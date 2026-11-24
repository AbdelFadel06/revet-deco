/**
 * Capture d'écran « téléphone » d'une page du site, via le protocole DevTools
 * de Chrome (sans dépendance). Outil de développement uniquement.
 *
 *   node scripts/dev/screenshot.mjs <url> <sortie.png> [largeur=390] [hauteur=844] [pleinePage=0] [js]
 *   [js] : expression évaluée avant la capture (ex. un clic sur un bouton)
 *   SHOT_NET=3g : simule une connexion 3G et liste les vidéos téléchargées
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [url, out, width = '390', height = '844', full = '0', js] = process.argv.slice(2)
if (!url || !out) {
  console.error('Usage : node scripts/dev/screenshot.mjs <url> <sortie.png> [largeur] [hauteur] [pleinePage]')
  process.exit(1)
}

const port = 9300 + Math.floor(Math.random() * 500)
const chrome = spawn(
  'google-chrome',
  ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'rd-shot-'))}`, 'about:blank'],
  { stdio: 'ignore' },
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  let target
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200)
    target = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()).then((l) => l.find((t) => t.type === 'page')).catch(() => null)
  }
  if (!target) throw new Error('Chrome ne répond pas')

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data)
    if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg)
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id
      pending.set(n, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)))
      ws.send(JSON.stringify({ id: n, method, params }))
    })

  const w = Number(width)
  const h = Number(height)
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: w < 768 })
  await send('Page.enable')
  const videos = new Set()
  if (process.env.SHOT_NET === '3g') {
    await send('Network.enable')
    // ~ 3G : 400 ms de latence, 750 kb/s
    await send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: 93750, uploadThroughput: 31250, connectionType: 'cellular3g' })
    // Ce que rapporte Chrome Android sur un vrai réseau 3G (l'émulation ne le change pas en headless).
    const fake = `const c = new EventTarget(); c.effectiveType = '3g'; c.saveData = false; Object.defineProperty(navigator, 'connection', { get: () => c });`
    await send('Page.addScriptToEvaluateOnNewDocument', { source: fake })
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data)
      if (m.method === 'Network.requestWillBeSent' && /\.mp4/.test(m.params.request.url)) videos.add(m.params.request.url.split('/').pop())
    })
  }
  await send('Page.navigate', { url })
  await sleep(6000) // compilation à la demande en dev + images

  if (js) {
    await send('Runtime.evaluate', { expression: js })
    await sleep(Number(process.env.SHOT_WAIT ?? 800)) // SHOT_WAIT=5000 si le script recharge la page
  }

  let clip
  if (full === '1') {
    const { cssContentSize } = await send('Page.getLayoutMetrics')
    clip = { x: 0, y: 0, width: w, height: Math.min(cssContentSize.height, 6000), scale: 1 }
  }
  const { data } = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip, captureBeyondViewport: true } : {}) })
  writeFileSync(out, Buffer.from(data, 'base64'))
  const { result } = await send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth + "x" + innerWidth' })
  console.log(`ok ${out} (largeur contenu x fenêtre : ${result.value})`)
  if (process.env.SHOT_NET === '3g') {
    const { result: conn } = await send('Runtime.evaluate', { expression: 'navigator.connection ? navigator.connection.effectiveType : "?"' })
    console.log(`connexion vue par la page : ${conn.value} — vidéos demandées : ${videos.size ? [...videos].join(', ') : 'aucune'}`)
  }
  ws.close()
} finally {
  chrome.kill()
}
