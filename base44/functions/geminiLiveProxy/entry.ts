/**
 * Gemini Live Multimodal API Proxy
 * Bridges the frontend WebSocket to Google's Gemini Live API
 * keeping the API key server-side.
 */

const GEMINI_MODEL = "gemini-3.1-flash-live-preview";
const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`;

const SYSTEM_INSTRUCTION = `You are Max, an expert aviation pre-buy inspection assistant for ABOS.

You are watching a live camera feed during an aircraft pre-buy inspection. Analyze what you see and provide real-time commentary focused on:

INSPECTION PRIORITIES:
- Corrosion, oxidation, or rust on airframe, engine, or control surfaces
- Damage, dents, cracks, or repairs on the fuselage, wings, or empennage
- Engine condition: oil leaks, staining, hose condition, exhaust deposits
- Avionics panel: equipment, condition, obvious issues
- Logbooks and documentation: read dates, signatures, entries if visible
- Landing gear condition: tires, brake wear, strut condition
- Interior condition: fabric, instruments, panel wear
- Overall maintenance quality indicators

RESPONSE STYLE:
- Concise, professional — like a seasoned aviation inspector talking through findings
- Flag any RED FLAGS immediately and clearly
- If nothing concerning is visible, say so briefly
- Keep each observation to 1-2 sentences
- If you cannot determine something, say what additional inspection is needed

Always frame findings in terms of how they affect the ATI score and transaction confidence.`;

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
  if (!GOOGLE_API_KEY) {
    return Response.json({ error: "GOOGLE_API_KEY not configured" }, { status: 500 });
  }

  // Require WebSocket upgrade
  const upgrade = req.headers.get("upgrade");
  if (upgrade?.toLowerCase() !== "websocket") {
    return Response.json({ error: "WebSocket upgrade required" }, { status: 426 });
  }

  // Authenticate user BEFORE upgrading to WebSocket
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only now upgrade to WebSocket
  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

  // Connect to Gemini right away (don't wait for onopen)
  const geminiUrl = `${GEMINI_WS_URL}?key=${GOOGLE_API_KEY}`;
  const geminiSocket = new WebSocket(geminiUrl);

  // Queue messages from client until Gemini is ready (cap at 20 to prevent memory abuse)
  const pendingMessages = [];
  const MAX_PENDING = 20;
  let geminiReady = false;
  let clientClosed = false;

  geminiSocket.onopen = () => {
    geminiReady = true;

    // Send setup message
    const setup = {
      setup: {
        model: `models/${GEMINI_MODEL}`,
        responseModalities: ["TEXT"],
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        }
      }
    };
    geminiSocket.send(JSON.stringify(setup));

    // Flush any queued messages (if client still connected)
    if (!clientClosed) {
      for (const msg of pendingMessages) {
        geminiSocket.send(msg);
      }
    }
    pendingMessages.length = 0;
  };

  // Pipe Gemini → client
  geminiSocket.onmessage = (event) => {
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(event.data);
    }
  };

  geminiSocket.onerror = () => {
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({ error: "Gemini connection error" }));
      clientSocket.close();
    }
  };

  geminiSocket.onclose = () => {
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.close();
    }
  };

  // Pipe client → Gemini
  clientSocket.onmessage = (event) => {
    if (geminiReady && geminiSocket.readyState === WebSocket.OPEN) {
      geminiSocket.send(event.data);
    } else if (!geminiReady && pendingMessages.length < MAX_PENDING) {
      // Buffer until Gemini is ready (capped)
      pendingMessages.push(event.data);
    }
    // Silently drop messages beyond the cap
  };

  clientSocket.onclose = () => {
    clientClosed = true;
    if (geminiSocket.readyState === WebSocket.OPEN || geminiSocket.readyState === WebSocket.CONNECTING) {
      geminiSocket.close();
    }
    pendingMessages.length = 0;
  };

  clientSocket.onerror = () => {
    clientClosed = true;
    if (geminiSocket.readyState === WebSocket.OPEN || geminiSocket.readyState === WebSocket.CONNECTING) {
      geminiSocket.close();
    }
    pendingMessages.length = 0;
  };

  return response;
});