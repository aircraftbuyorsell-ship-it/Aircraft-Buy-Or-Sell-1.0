// Entity automation: fires on EscrowTransaction update
// Sends email notifications to buyer, seller and broker on key status transitions
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STATUS_MESSAGES = {
  contract_sent: {
    subject: '[ABOS Escrow] Contract Sent for Review',
    body: (tx) => `The purchase agreement for ${tx.aircraft_label || 'the aircraft'} has been sent.\n\nTransaction: ${tx.aircraft_label || '—'}\nBuyer: ${tx.buyer_name}\nSeller: ${tx.seller_name}\nSale Amount: ${tx.currency || 'USD'} ${tx.sale_amount?.toLocaleString() || '—'}\n\nPlease review and sign the contract to proceed.\n\n— ABOS Escrow`,
  },
  contract_signed: {
    subject: '[ABOS Escrow] Contract Signed — Funds Transfer Required',
    body: (tx) => `The purchase agreement for ${tx.aircraft_label || 'the aircraft'} has been signed by all parties.\n\nTransaction: ${tx.aircraft_label || '—'}\nSale Amount: ${tx.currency || 'USD'} ${tx.sale_amount?.toLocaleString() || '—'}\n\nNext step: Buyer to initiate funds transfer to escrow account.\n\n— ABOS Escrow`,
  },
  funds_secured: {
    subject: '[ABOS Escrow] Funds Secured — Inspection Authorized',
    body: (tx) => `Escrow funds have been confirmed for ${tx.aircraft_label || 'the aircraft'}.\n\nTransaction: ${tx.aircraft_label || '—'}\nAmount Secured: ${tx.currency || 'USD'} ${tx.sale_amount?.toLocaleString() || '—'}\n\nPre-purchase inspection is now authorized. Seller may arrange access to the aircraft.\n\n— ABOS Escrow`,
  },
  released: {
    subject: '[ABOS Escrow] Funds Released to Seller',
    body: (tx) => `Escrow funds have been released for ${tx.aircraft_label || 'the aircraft'}.\n\nTransaction: ${tx.aircraft_label || '—'}\nSeller Net: ${tx.currency || 'USD'} ${tx.seller_net?.toLocaleString() || tx.sale_amount?.toLocaleString() || '—'}\n${tx.finders_fee_amount ? `Finder's Fee: ${tx.currency || 'USD'} ${tx.finders_fee_amount.toLocaleString()}\n` : ''}\nThe transaction is now complete.\n\n— ABOS Escrow`,
  },
  closed: {
    subject: '[ABOS Escrow] Transaction Closed',
    body: (tx) => `Congratulations! The transaction for ${tx.aircraft_label || 'the aircraft'} has been successfully closed.\n\nTransaction: ${tx.aircraft_label || '—'}\nBuyer: ${tx.buyer_name}\nSeller: ${tx.seller_name}\nFinal Amount: ${tx.currency || 'USD'} ${tx.sale_amount?.toLocaleString() || '—'}\n\nAll documentation has been filed. Thank you for using ABOS Escrow.\n\n— ABOS Escrow`,
  },
  cancelled: {
    subject: '[ABOS Escrow] Transaction Cancelled',
    body: (tx) => `The escrow transaction for ${tx.aircraft_label || 'the aircraft'} has been cancelled.\n\nIf you believe this is an error or wish to discuss further, please contact support.\n\n— ABOS Escrow`,
  },
  disputed: {
    subject: '[ABOS Escrow] Dispute Filed — Transaction Under Review',
    body: (tx) => `A dispute has been filed on the transaction for ${tx.aircraft_label || 'the aircraft'}.\n\nTransaction: ${tx.aircraft_label || '—'}\nAmount: ${tx.currency || 'USD'} ${tx.sale_amount?.toLocaleString() || '—'}\n\nOur team will review and contact all parties within 2 business days.\n\n— ABOS Escrow`,
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Runs via entity automation — use service role, no user auth required
    const body = await req.json().catch(() => ({}));

    const newStatus = body?.data?.status;
    const oldStatus = body?.old_data?.status;
    const tx = body?.data;

    if (!newStatus || newStatus === oldStatus) {
      return Response.json({ skipped: 'no status change' });
    }

    const template = STATUS_MESSAGES[newStatus];
    if (!template || !tx) {
      return Response.json({ skipped: `no template for status: ${newStatus}` });
    }

    const subject = template.subject;
    const emailBody = template.body(tx);

    const recipients = [tx.buyer_email, tx.seller_email, tx.broker_email].filter(Boolean);
    const uniqueRecipients = [...new Set(recipients)];

    let sent = 0;
    for (const email of uniqueRecipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        body: emailBody,
        from_name: 'ABOS Escrow',
      });
      sent++;
    }

    return Response.json({ ok: true, status: newStatus, emails_sent: sent, recipients: uniqueRecipients });
  } catch (error) {
    console.error('escrowNotify error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});