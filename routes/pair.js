const express = require('express');
const fs = require('fs');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  delay
} = require("@whiskeysockets/baileys");
const pino = require("pino");

const router = express.Router();

router.post("/api/pair", async (req, res) => {
  const { number, token } = req.body;
  const SECRET = process.env.PAIR_SECRET || "ALEX_SECRET_KEY";

  if (token !== SECRET) return res.status(403).send({ error: "Unauthorized token." });
  if (!number) return res.status(400).send({ error: "No number provided." });

  const id = "session_" + Math.random().toString(36).substring(2, 10);
  const authFolder = `./auth/${id}`;

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  try {
    const sock = makeWASocket({
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
      },
      logger: pino({ level: "fatal" }),
      browser: ["Lussh AI", "MacOS", "14.0.3"]  // spoofed browser for compatibility
    });

    sock.ev.on("creds.update", saveCreds);

    // Connection debug logging
    sock.ev.on("connection.update", (update) => {
      console.log("🔌 Connection Status:", update.connection, update.lastDisconnect?.error?.message);
    });

    if (!sock.authState.creds.registered) {
      const cleaned = number.replace(/[^0-9]/g, '');
      await delay(1500);  // allow WebSocket to warm up
      const code = await sock.requestPairingCode(cleaned);
      console.log("✅ Pairing Code:", code);
      return res.send({ code });
    }

    sock.ev.on("connection.update", async ({ connection }) => {
      if (connection === "open") {
        console.log("✅ WhatsApp connection opened");
        await delay(3000);
        sock.ws.close();
        fs.rmSync(authFolder, { recursive: true, force: true });
      }
    });

  } catch (err) {
    console.error("❌ Error:", err);
    fs.rmSync(authFolder, { recursive: true, force: true });
    if (!res.headersSent) res.status(500).send({ error: "Internal Server Error" });
  }
});

module.exports = router;
