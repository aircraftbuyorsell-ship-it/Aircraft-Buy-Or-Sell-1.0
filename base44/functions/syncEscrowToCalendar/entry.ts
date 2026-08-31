import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { transaction_id } = body;
    if (!transaction_id) {
      return Response.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    // Fetch the escrow transaction
    const tx = await base44.entities.EscrowTransaction.get(transaction_id);
    if (!tx) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Get Google Calendar access token (SHARED connector)
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const aircraftLabel = tx.aircraft_label || `${tx.listing || 'Aircraft'}`;
    const existingIds = tx.google_calendar_event_id
      ? tx.google_calendar_event_id.split(',').filter(Boolean)
      : [];
    const newEventIds = [];

    // ── Create/update Inspection event ──────────────────────
    if (tx.inspection_date) {
      const inspTitle = `🔍 Pre-Buy Inspection: ${aircraftLabel}`;
      const inspDate = new Date(tx.inspection_date + 'T09:00:00');
      const inspEnd = new Date(tx.inspection_date + 'T17:00:00');

      let existingInspId = null;
      // Try to find existing inspection event from stored IDs
      if (existingIds.length > 0) {
        for (const eid of existingIds) {
          try {
            const check = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eid}`,
              { headers: authHeader }
            );
            if (check.ok) {
              const ev = await check.json();
              if (ev.summary && ev.summary.includes('Pre-Buy Inspection')) {
                existingInspId = eid;
                break;
              }
            }
          } catch (_) { /* event may be deleted */ }
        }
      }

      const inspBody = {
        summary: inspTitle,
        description: [
          `Aircraft: ${aircraftLabel}`,
          `Buyer: ${tx.buyer_name || '—'}`,
          `Seller: ${tx.seller_name || '—'}`,
          `Sale Amount: $${(tx.sale_amount || 0).toLocaleString()}`,
          tx.notes ? `\nNotes: ${tx.notes}` : '',
        ].join('\n'),
        start: { dateTime: inspDate.toISOString(), timeZone: 'UTC' },
        end: { dateTime: inspEnd.toISOString(), timeZone: 'UTC' },
        colorId: '5', // Banana (yellow) — stands out
      };

      let inspResp;
      if (existingInspId) {
        inspResp = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingInspId}`,
          { method: 'PUT', headers: authHeader, body: JSON.stringify(inspBody) }
        );
      } else {
        inspResp = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          { method: 'POST', headers: authHeader, body: JSON.stringify(inspBody) }
        );
      }

      if (inspResp.ok) {
        const ev = await inspResp.json();
        newEventIds.push(ev.id);
      }
    }

    // ── Create/update Closing Deadline event ────────────────
    if (tx.closing_deadline) {
      const closeTitle = `📋 Closing Deadline: ${aircraftLabel}`;
      const closeDate = new Date(tx.closing_deadline + 'T17:00:00');
      const closeStart = new Date(tx.closing_deadline + 'T16:30:00');

      let existingCloseId = null;
      if (existingIds.length > 0) {
        for (const eid of existingIds) {
          try {
            const check = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eid}`,
              { headers: authHeader }
            );
            if (check.ok) {
              const ev = await check.json();
              if (ev.summary && ev.summary.includes('Closing Deadline')) {
                existingCloseId = eid;
                break;
              }
            }
          } catch (_) { /* event may be deleted */ }
        }
      }

      const closeBody = {
        summary: closeTitle,
        description: [
          `Aircraft: ${aircraftLabel}`,
          `Buyer: ${tx.buyer_name || '—'}`,
          `Seller: ${tx.seller_name || '—'}`,
          `Sale Amount: $${(tx.sale_amount || 0).toLocaleString()}`,
          `Broker: ${tx.broker_name || '—'}`,
          tx.notes ? `\nNotes: ${tx.notes}` : '',
        ].join('\n'),
        start: { dateTime: closeStart.toISOString(), timeZone: 'UTC' },
        end: { dateTime: closeDate.toISOString(), timeZone: 'UTC' },
        colorId: '11', // Bold red — signals urgency
      };

      let closeResp;
      if (existingCloseId) {
        closeResp = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingCloseId}`,
          { method: 'PUT', headers: authHeader, body: JSON.stringify(closeBody) }
        );
      } else {
        closeResp = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          { method: 'POST', headers: authHeader, body: JSON.stringify(closeBody) }
        );
      }

      if (closeResp.ok) {
        const ev = await closeResp.json();
        newEventIds.push(ev.id);
      }
    }

    // ── Store event IDs back on the transaction ────────────
    if (newEventIds.length > 0) {
      await base44.entities.EscrowTransaction.update(transaction_id, {
        google_calendar_event_id: newEventIds.join(','),
      });
    }

    return Response.json({
      success: true,
      events_synced: newEventIds.length,
      message: newEventIds.length > 0
        ? `${newEventIds.length} event(s) synced to Google Calendar`
        : 'No dates set — nothing to sync',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});