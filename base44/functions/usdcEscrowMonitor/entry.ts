import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { ethers } from 'npm:ethers@6.13.4';

/**
 * USDC Escrow Monitor — generates dedicated Ethereum wallets for escrow
 * deposits and monitors on-chain USDC balance.
 *
 * Actions:
 *   generate_wallet — creates a new Ethereum wallet, encrypts private key, returns address
 *   check_balance   — queries USDC balance for an escrow's wallet, updates status if funded
 */
const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDC_ABI = ['function balanceOf(address) view returns (uint256)'];
const RPC_URL = Deno.env.get('ALCHEMY_RPC_URL') || 'https://rpc.ankr.com/eth';

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

      if (funded && tx.status === 'funds_pending') {
        await base44.asServiceRole.entities.EscrowTransaction.update(escrow_id, {
          status: 'funds_secured',
          usdc_amount_received: balanceUsdc,
        });
      }

      return Response.json({
        address: tx.escrow_wallet_address,
        balance_usdc: balanceUsdc,
        required_usdc: required,
        funded,
        status: funded ? 'funds_secured' : tx.status,
      });
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