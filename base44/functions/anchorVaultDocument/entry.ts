import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, file_name, document_type, ati_card_id, listing_registration } = req.body
      ? await req.json()
      : {};

    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    // ── SSRF protection: validate URL scheme, block private/internal hosts, resolve DNS ──
    function isPrivateIPv4(ip: string): boolean {
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return true;
      const [a, b] = ip.split('.').map(Number);
      if ([a, b].some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return true;
      if (a === 0 || a === 10 || a === 127) return true;
      if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
      if (a === 169 && b === 254) return true; // link-local / cloud metadata
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && (b === 0 || b === 168)) return true;
      if (a === 198 && b >= 18 && b <= 19) return true; // benchmarking
      if (a >= 224) return true; // multicast/reserved
      return false;
    }

    function isBlockedIPv6(host: string): boolean {
      const normalized = host.replace(/^\[/, '').replace(/\]$/, '').toLowerCase();
      return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb');
    }
    async function assertSafeUrl(raw: string) {
      let parsed: URL;
      try { parsed = new URL(raw); } catch { throw new Error('Invalid file_url'); }
      if (parsed.protocol !== 'https:') throw new Error('Only HTTPS file URLs are allowed');
      const host = parsed.hostname.toLowerCase();
      // Strict host safelist: only ABOS platform file storage is fetchable.
      // This eliminates SSRF regardless of DNS TOCTOU or IP-literal tricks,
      // because internal/metadata hosts can never match.
      if (!host.endsWith('.base44.com')) throw new Error('Only ABOS storage URLs are allowed');
      if (host === 'localhost' || host.endsWith('.localhost')) throw new Error('Blocked host');
      // Block IPv6 loopback and link-local
      if (isBlockedIPv6(host)) throw new Error('Blocked IPv6');
      // Literal IPv4 — never allowed (storage is a domain name)
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) throw new Error('Blocked private IP');
      // Domain name — resolve DNS and reject if any resolved IP is private/internal
      let addrs: string[];
      try {
        addrs = await Deno.resolveDns(host, 'A');
      } catch {
        throw new Error('DNS resolution failed');
      }
      if (!addrs || addrs.length === 0) throw new Error('No DNS records');
      for (const ip of addrs) {
        if (isPrivateIPv4(ip)) throw new Error('Blocked private IP in DNS');
      }
    }
    try { await assertSafeUrl(file_url); } catch (e) {
      return Response.json({ error: 'file_url rejected' }, { status: 400 });
    }

    // Fetch the file content to compute hash
    let fileContent = '';
    try {
      // Disable redirects so a trusted storage hostname cannot redirect the server
      // into an internal/private destination after the DNS check.
      const fileRes = await fetch(file_url, { redirect: 'error' });
      if (!fileRes.ok) throw new Error(`File fetch failed with HTTP ${fileRes.status}`);
      const finalHost = new URL(fileRes.url || file_url).hostname.toLowerCase();
      if (!finalHost.endsWith('.base44.com') || isBlockedIPv6(finalHost) || /^\d{1,3}(\.\d{1,3}){3}$/.test(finalHost)) {
        throw new Error('Fetched URL host rejected');
      }
      const buf = await fileRes.arrayBuffer();
      const bytes = new Uint8Array(buf);
      // Simple hex from bytes
      const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      fileContent = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Could not fetch file for hashing:', e.message);
      fileContent = 'hash_unavailable';
    }

    const timestamp = Date.now();
    const reg = (listing_registration || 'unknown').replace(/[^a-zA-Z0-9]/g, '');

    // Generate a deterministic Polygon-style tx hash
    const txSeed = `${fileContent.slice(0, 32)}|${document_type || 'doc'}|${reg}|${timestamp}`;
    const txHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txSeed));
    const txHashArray = Array.from(new Uint8Array(txHashBuffer));
    const txHash = '0x' + txHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Simulated block number based on timestamp
    const blockNumber = Math.floor(timestamp / 2000) + 58000000;

    return Response.json({
      file_hash: fileContent,
      tx_hash: txHash,
      block_number: blockNumber,
      verified_at: new Date().toISOString(),
      network: 'polygon-mainnet',
      message: 'Document hash anchored to Polygon blockchain (simulated)',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});