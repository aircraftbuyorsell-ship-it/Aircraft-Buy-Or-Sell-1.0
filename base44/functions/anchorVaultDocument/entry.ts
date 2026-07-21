import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { ethers } from 'npm:ethers@6.13.4';

// Real on-chain anchoring requires a funded signer wallet. Without it, this
// function must not fabricate a tx_hash/block_number — anchored stays false
// and callers must not present the result as a verified blockchain record.
const RPC_URL = Deno.env.get('POLYGON_ANCHOR_RPC_URL') || Deno.env.get('ALCHEMY_RPC_URL') || 'https://polygon-rpc.com';
const SIGNER_KEY = Deno.env.get('POLYGON_ANCHOR_SIGNER_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, document_type, listing_registration } = req.body
      ? await req.json()
      : {};

    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    // Fetch the file content to compute hash
    let fileHash = '';
    try {
      const fileRes = await fetch(file_url);
      const buf = await fileRes.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Could not fetch file for hashing:', e.message);
      fileHash = '';
    }

    if (!SIGNER_KEY) {
      // No signer configured — be honest instead of returning a fake tx.
      return Response.json({
        anchored: false,
        status: 'not_configured',
        file_hash: fileHash,
        tx_hash: null,
        block_number: null,
        message: 'Polygon anchoring is not configured for this environment. Document hash was computed but not written on-chain.',
      });
    }

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(SIGNER_KEY, provider);
      const reg = (listing_registration || 'unknown').replace(/[^a-zA-Z0-9]/g, '');
      const memo = `abos:${document_type || 'doc'}:${reg}:${fileHash}`;
      const tx = await wallet.sendTransaction({
        to: wallet.address,
        value: 0n,
        data: ethers.hexlify(ethers.toUtf8Bytes(memo)).slice(0, 2 + 2000), // guard against oversized calldata
      });
      const receipt = await tx.wait();

      return Response.json({
        anchored: true,
        status: 'confirmed',
        file_hash: fileHash,
        tx_hash: receipt.hash,
        block_number: receipt.blockNumber,
        verified_at: new Date().toISOString(),
        network: 'polygon-mainnet',
        message: 'Document hash anchored to the Polygon blockchain.',
      });
    } catch (chainError) {
      console.error('[anchorVaultDocument] on-chain anchoring failed:', chainError.message);
      return Response.json({
        anchored: false,
        status: 'anchor_failed',
        file_hash: fileHash,
        tx_hash: null,
        block_number: null,
        message: 'Polygon anchoring failed. Document hash was computed but not written on-chain.',
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
