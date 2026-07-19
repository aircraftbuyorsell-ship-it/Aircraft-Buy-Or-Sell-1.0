import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const CONNECTOR_ID = '6a5c22a5e51e055fad1d605f';

function buildAgreementHtml(d) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Aircraft Purchase Agreement</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color:#1a1a1a; margin:48px; font-size:12px; line-height:1.6; }
  h1 { font-size:20px; text-align:center; margin-bottom:4px; }
  h2 { font-size:13px; margin-top:18px; margin-bottom:4px; border-bottom:1px solid #ccc; padding-bottom:2px; }
  .meta { text-align:center; color:#666; font-size:10px; margin-bottom:24px; }
  .field { font-weight:bold; }
  table { width:100%; border-collapse:collapse; margin:8px 0; }
  td { padding:3px 6px; border:1px solid #ddd; font-size:11px; }
  td.label { background:#f5f5f5; font-weight:bold; width:35%; }
  .sig { margin-top:36px; }
  .sig-line { border-top:1px solid #333; width:260px; margin-top:24px; padding-top:3px; font-size:10px; color:#666; }
</style></head>
<body>
<h1>AIRCRAFT PURCHASE AGREEMENT</h1>
<div class="meta">ABOS Marketspace — DocuSign eSignature • Generated ${today}</div>

<h2>1. Parties</h2>
<p>This Aircraft Purchase Agreement ("Agreement") is made on <span class="field">${today}</span> by and between:</p>
<p><span class="field">Seller:</span> ${d.sellerName || '____________________'} ("Seller"), and<br>
<span class="field">Buyer:</span> ${d.buyerName || '____________________'} ("Buyer").</p>

<h2>2. Aircraft Description</h2>
<table>
  <tr><td class="label">Registration</td><td>${d.registration || 'N/A'}</td></tr>
  <tr><td class="label">Manufacturer</td><td>${d.make || 'N/A'}</td></tr>
  <tr><td class="label">Model</td><td>${d.model || 'N/A'}</td></tr>
  <tr><td class="label">Serial Number</td><td>${d.serialNumber || 'N/A'}</td></tr>
  <tr><td class="label">Year of Manufacture</td><td>${d.year || 'N/A'}</td></tr>
</table>

<h2>3. Purchase Price</h2>
<p>The total purchase price for the Aircraft is <span class="field">${(d.salePrice || 0).toLocaleString('en-US')} ${d.currency || 'USD'}</span>, payable in accordance with the terms agreed between the parties.</p>

<h2>4. Condition &amp; Inspection</h2>
<p>The Aircraft is sold subject to a satisfactory pre-purchase inspection. The Buyer shall have the right to inspect the Aircraft and its logbooks prior to closing. All Airworthiness Directives and Service Bulletins shall be complied with as of the closing date.</p>

<h2>5. Title &amp; Closing</h2>
<p>Seller represents that they hold good and marketable title to the Aircraft, free and clear of all liens and encumbrances. Closing shall occur upon execution of this Agreement and transfer of the registration.</p>

<h2>6. Governing Law</h2>
<p>This Agreement shall be governed by the laws of the jurisdiction in which the Aircraft is registered at the time of signing.</p>

<h2>7. Acknowledgement</h2>
<p>By signing below, the parties acknowledge they have read and agree to the terms of this Agreement.</p>

<div class="sig">
  <div style="display:flex; justify-content:space-between;">
    <div>
      <div class="sig-line">Buyer Signature: /s/ Buyer</div>
      <div style="font-size:10px; color:#666; margin-top:2px;">Name: ${d.buyerName || ''} &nbsp; Date: ____________</div>
    </div>
    <div>
      <div class="sig-line">Seller Signature: /s/ Seller</div>
      <div style="font-size:10px; color:#666; margin-top:2px;">Name: ${d.sellerName || ''} &nbsp; Date: ____________</div>
    </div>
  </div>
</div>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Resolve account base_uri + account_id from userinfo
    const infoRes = await fetch('https://account.docusign.com/oauth/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!infoRes.ok) {
      return Response.json({ error: 'Failed to resolve DocuSign account', status: infoRes.status }, { status: 502 });
    }
    const info = await infoRes.json();
    const account = (info.accounts || []).find((a) => a.is_default) || (info.accounts || [])[0];
    if (!account) return Response.json({ error: 'No DocuSign account found for this user' }, { status: 400 });
    const apiBase = `${account.base_uri}/restapi/v2.1/accounts/${account.account_id}`;

    if (action === 'list') {
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const listRes = await fetch(`${apiBase}/envelopes?from_date=${fromDate}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!listRes.ok) {
        const t = await listRes.text();
        return Response.json({ error: 'DocuSign list failed', details: t }, { status: 502 });
      }
      const data = await listRes.json();
      return Response.json({ envelopes: data.envelopes || [] });
    }

    if (action === 'send') {
      const d = body;
      if (!d.buyerEmail || !d.buyerName) {
        return Response.json({ error: 'Buyer name and email are required' }, { status: 400 });
      }

      const html = buildAgreementHtml(d);
      const documentBase64 = btoa(unescape(encodeURIComponent(html)));

      const signers = [
        {
          email: d.buyerEmail,
          name: d.buyerName,
          recipientId: '1',
          routingOrder: '1',
          tabs: {
            signHereTabs: [{ anchorString: '/s/ Buyer', anchorYOffset: '10', anchorUnits: 'pixels' }],
            dateSignedTabs: [{ anchorString: 'Date: ____________', anchorYOffset: '0', anchorXOffset: '40', anchorUnits: 'pixels' }],
          },
        },
      ];
      if (d.sellerEmail) {
        signers.push({
          email: d.sellerEmail,
          name: d.sellerName || 'Seller',
          recipientId: '2',
          routingOrder: '2',
          tabs: {
            signHereTabs: [{ anchorString: '/s/ Seller', anchorYOffset: '10', anchorUnits: 'pixels' }],
          },
        });
      }

      const payload = {
        emailSubject: `Aircraft Purchase Agreement — ${d.registration || `${d.make || ''} ${d.model || ''}`.trim()}`,
        status: 'sent',
        documents: [{
          documentId: '1',
          name: 'Aircraft Purchase Agreement',
          fileExtension: 'html',
          documentBase64,
        }],
        recipients: { signers },
      };

      const sendRes = await fetch(`${apiBase}/envelopes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!sendRes.ok) {
        const t = await sendRes.text();
        return Response.json({ error: 'DocuSign send failed', details: t }, { status: 502 });
      }
      const sent = await sendRes.json();
      return Response.json({ envelopeId: sent.envelopeId, envelopeUri: sent.uri });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});