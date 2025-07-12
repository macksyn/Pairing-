const express = require('express');
const fs = require('fs');
const pino = require("pino");
const { default: Gifted_Tech, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("maher-zubair-baileys");
const { makeid } = require('../utils/makeid');

const router = express.Router();

function removeFile(FilePath) {
  if (fs.existsSync(FilePath)) {
    fs.rmSync(FilePath, { recursive: true, force: true });
  }
}

router.post('/api/pair', async (req, res) => {
  const { number, token } = req.body;
  const SECRET = process.env.PAIR_SECRET || 'ALEX_SECRET_KEY';

  if (token !== SECRET) return res.status(403).send({ error: "Unauthorized token." });
  if (!number) return res.status(400).send({ error: "No number provided." });

  const id = makeid();
  const sanitizedNumber = number.replace(/[^0-9]/g, '');

  async function startPairing() {
    const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

    try {
      const conn = Gifted_Tech({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        browser: ["Chrome", "Linux", "103.0.5060.134"],
        logger: pino({ level: "fatal" })
      });

      if (!conn.authState.creds.registered) {
        await delay(1000);
        const code = await conn.requestPairingCode(sanitizedNumber);
        res.send({ code });
      }

      conn.ev.on("connection.update", async (update) => {
        if (update.connection === "open") {
          await delay(4000);
          const creds = fs.readFileSync(`./temp/${id}/creds.json`);
          const b64 = Buffer.from(creds).toString('base64');

          await conn.sendMessage(conn.user.id, {
            text: `Your Session (base64):\n\n${b64}`
          });

          await conn.ws.close();
          removeFile('./temp/' + id);
        }
      });

      conn.ev.on("creds.update", saveCreds);
    } catch (err) {
      console.error("Pair error:", err);
      removeFile('./temp/' + id);
      if (!res.headersSent) res.send({ error: "Internal Error" });
    }
  }

  await startPairing();
});

module.exports = router;