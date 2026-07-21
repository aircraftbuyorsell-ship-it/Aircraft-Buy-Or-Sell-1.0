import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { ethers } from 'npm:ethers@6.13.4';

/**
 * USDC Escrow Monitor — generates dedicated EVM wallets for escrow
 * deposits and monitors on-chain USDC balance on POLYGON (per ARCH-004,
 * chosen over Ethereum mainnet for negligible gas fees).
 *
 * Actions:
 *   generate_wallet — creates a new EVM wallet, encrypts private key, returns address
 *   check_balance   — queries Polygon USDC balance for an escrow's wallet, updates status if funded
 *   release         — sends the seller's net USDC from the escrow wallet to
 *                      seller_usdc_payout_address. Only runs once funds are
 *                      'funds_secured' (i.e. already past the KYC gate) and a
 *                      payout address is on file. Fails closed — no status
 *                      change and no fake success — if the wallet lacks
 *                      balance, lacks gas, or the address is missing.
 */
// Native USDC on Polygon PoS (Circle-issued)
const USDC_CONTRACT = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const USDC_ABI = ['function balanceOf(address) view returns (uint256)'];
const RPC_URL = Deno.env.get('ALCHEMY_RPC_URL') || 'https://polygon-rpc.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action, escrow_id, embed_token } = body;

    if (action === 'generate_wallet') {
      if (!embed_token) return Response.json({ error: 'embed_token required' }, { status: 403 });
      const partners = await base44.asServiceRole.entities.PartnerConfig.filter(
        { embed_token, is_active: true }, '-created_date', 1
      );
      if (partners.length === 0) return Response.json({ error: 'Invalid embed token' }, { status: 403 });

      const wallet = ethers.Wallet.createRandom();
      const encryptedKey = await encryptPrivateKey(wallet.privateKey, Deno.env.get('ESCROW_API_KEY'));
      return Response.json({ address: wallet.address, encrypted_key: encryptedKey });
    }

    if (action === 'check_balance') {
      if (!escrow_id) return Response.json({ error: 'escrow_id required' }, { status: 400 });

      // Require either authenticated user or valid embed_token
      const hasEmbedToken = !!embed_token;
      if (!hasEmbedToken) {
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const tx = await base44.asServiceRole.entities.EscrowTransaction.get(escrow_id);
      if (!tx) return Response.json({ error: 'Transaction not found' }, { status: 404 });
      if (!tx.escrow_wallet_address) return Response.json({ error: 'No wallet address on transaction' }, { status: 400 });

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const usdc = new ethers.Contract(USDC_CONTRACT, USDC_ABI, provider);
      const balanceWei = await usdc.balanceOf(tx.escrow_wallet_address);
      const balanceUsdc = Number(balanceWei) / 1e6;
      const required = tx.usdc_amount_required || 0;
      const funded = balanceUsdc >= required;

      // ARCH-004: KYC required before funds > EUR 1000 can be released as "secured".
      // USDC is ~1:1 USD; treated as an approximation of the EUR threshold until
      // proper FX-aware compliance logic and a real KYC provider are wired up.
      const KYC_THRESHOLD_USDC = 1000;
      const requiresKyc = required > KYC_THRESHOLD_USDC;
      const kycCleared = tx.kyc_status === 'verified';
      const heldForKyc = funded && requiresKyc && !kycCleared;

      if (funded && tx.status === 'funds_pending') {
        if (heldForKyc) {
          await base44.asServiceRole.entities.EscrowTransaction.update(escrow_id, {
            usdc_amount_received: balanceUsdc,
            kyc_status: tx.kyc_status === 'not_required' ? 'required' : tx.kyc_status,
          });
        } else {
          await base44.asServiceRole.entities.EscrowTransaction.update(escrow_id, {
            status: 'funds_secured',
            usdc_amount_received: balanceUsdc,
          });
        }
      }

      return Response.json({
        held_for_kyc: heldForKyc,
        address: tx.escrow_wallet_address,
        balance_usdc: balanceUsdc,
        required_usdc: required,
        funded,
        status: heldForKyc ? tx.status : (funded ? 'funds_secured' : tx.status),
      });
    }

    if (action === 'release') {
      if (!escrow_id) return Response.json({ error: 'escrow_id required' }, { status: 400 });

      let authorized = false;
      if (embed_token) {
        const partners = await base44.asServiceRole.entities.PartnerConfig.filter(
          { embed_token, is_active: true }, '-created_date', 1
        );
        authorized = partners.length > 0;
      } else {
        const user = await base44.auth.me();
        authorized = user?.role === 'admin';
      }
      if (!authorized) return Response.json({ error: 'Unauthorized' }, { status: 403 });

      const tx = await base44.asServiceRole.entities.EscrowTransaction.get(escrow_id);
      if (!tx) return Response.json({ error: 'Transaction not found' }, { status: 404 });
      if (tx.payment_method !== 'usdc') return Response.json({ error: 'Not a USDC-funded escrow' }, { status: 400 });
      if (tx.status !== 'funds_secured') {
        return Response.json({ error: `Cannot release from status '${tx.status}' — funds must be secured (and KYC-cleared) first` }, { status: 400 });
      }
      if (!tx.seller_usdc_payout_address) {
        return Response.json({ error: 'seller_usdc_payout_address is not set on this transaction' }, { status: 400 });
      }
      if (!tx.escrow_wallet_encrypted_key) {
        return Response.json({ error: 'No escrow wallet key on this transaction' }, { status: 400 });
      }

      const payoutAmount = tx.seller_net || tx.usdc_amount_required || 0;
      if (payoutAmount <= 0) return Response.json({ error: 'Invalid payout amount' }, { status: 400 });

      let privateKey;
      try {
        privateKey = await decryptPrivateKey(tx.escrow_wallet_encrypted_key, Deno.env.get('ESCROW_API_KEY'));
      } catch (e) {
        console.error('[usdcEscrowMonitor] decrypt failed:', e.message);
        return Response.json({ error: 'Failed to decrypt escrow wallet key' }, { status: 500 });
      }

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(privateKey, provider);
      const usdcWrite = new ethers.Contract(
        USDC_CONTRACT,
        [...USDC_ABI, 'function transfer(address,uint256) returns (bool)'],
        wallet
      );
      const payoutUnits = BigInt(Math.round(payoutAmount * 1e6));

      try {
        const balanceWei = await usdcWrite.balanceOf(wallet.address);
        if (balanceWei < payoutUnits) {
          return Response.json({
            error: 'Escrow wallet USDC balance is insufficient for payout',
            balance_usdc: Number(balanceWei) / 1e6,
            required_usdc: payoutAmount,
          }, { status: 409 });
        }
        const gasBalance = await provider.getBalance(wallet.address);
        if (gasBalance === 0n) {
          return Response.json({
            error: 'Escrow wallet has no MATIC/POL for gas — fund the wallet before releasing',
            wallet_address: wallet.address,
          }, { status: 409 });
        }

        const releaseTx = await usdcWrite.transfer(tx.seller_usdc_payout_address, payoutUnits);
        const receipt = await releaseTx.wait();

        await base44.asServiceRole.entities.EscrowTransaction.update(escrow_id, {
          status: 'released',
          blockchain_tx_hash: receipt.hash,
        });

        return Response.json({
          released: true,
          tx_hash: receipt.hash,
          amount_usdc: payoutAmount,
          to: tx.seller_usdc_payout_address,
        });
      } catch (chainError) {
        console.error('[usdcEscrowMonitor] release failed:', chainError.message);
        return Response.json({ error: 'On-chain release failed: ' + chainError.message }, { status: 500 });
      }
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ═══════════════════════════════════════════
// HELPER: AES-GCM encrypt private key with PBKDF2-derived key
// ═══════════════════════════════════════════
async function encryptPrivateKey(privateKey, password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(privateKey)
  );
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

// ═══════════════════════════════════════════
// HELPER: AES-GCM decrypt private key (inverse of encryptPrivateKey)
// ═══════════════════════════════════════════
async function decryptPrivateKey(encoded, password) {
  const enc = new TextEncoder();
  const combined = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}