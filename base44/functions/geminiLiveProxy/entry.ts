/**
 * Gemini Live Multimodal API Proxy
 * Bridges the frontend WebSocket to Google's Gemini Live API
 * keeping the API key server-side.
 */

const GEMINI_MODEL = "gemini-2.0-flash-live-001";
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

  // Upgrade immediately — auth headers are unreliable on WS connections
  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

  // Connect to Gemini right away (don't wait for onopen)
  const geminiUrl = `${GEMINI_WS_URL}?key=${GOOGLE_API_KEY}`;
  const geminiSocket = new WebSocket(geminiUrl);

  // Queue messages from client until Gemini is ready
  const pendingMessages = [];
  let geminiReady = false;

  geminiSocket.onopen = () => {
    geminiReady = true;

    // Send setup message
    const setup = {
      setup: {
        model: `models/${GEMINI_MODEL}`,
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: { voice_name: "Charon" }
            }
          }
        },
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        }
      }
    };
    geminiSocket.send(JSON.stringify(setup));

    // Flush any queued messages
    for (const msg of pendingMessages) {
      geminiSocket.send(msg);
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
    } else {
      // Buffer until Gemini is ready
      pendingMessages.push(event.data);
    }
  };

  clientSocket.onclose = () => {
    if (geminiSocket.readyState === WebSocket.OPEN) {
      geminiSocket.close();
    }
  };

  clientSocket.onerror = () => {
    if (geminiSocket.readyState === WebSocket.OPEN) {
      geminiSocket.close();
    }
  };

  return response;
});