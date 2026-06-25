// Resilient dev runner: keeps `next dev` alive across crashes and machine sleep.
// If the dev server process exits for any reason (OOM, sleep/wake socket loss,
// an unhandled error), this relaunches it automatically with a short backoff.
// No external dependencies — plain Node.
//
// Usage: npm run dev:watch

import { spawn } from 'node:child_process'

const PORT = process.env.PORT || '3000'
const MIN_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 15000

let backoff = MIN_BACKOFF_MS
let child = null
let shuttingDown = false

function start() {
  const startedAt = Date.now()
  // Use the local Next binary; inherit stdio so logs show normally.
  child = spawn('npx', ['next', 'dev', '-p', PORT], {
    stdio: 'inherit',
    env: process.env,
  })

  child.on('exit', (code, signal) => {
    child = null
    if (shuttingDown) return

    // If it ran healthily for a while, reset the backoff.
    if (Date.now() - startedAt > 30000) backoff = MIN_BACKOFF_MS

    console.log(
      `\n[dev-supervisor] next dev exited (code=${code} signal=${signal}). ` +
        `Restarting in ${backoff}ms...`
    )
    setTimeout(start, backoff)
    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
  })

  child.on('error', (err) => {
    console.error('[dev-supervisor] failed to spawn next dev:', err.message)
  })
}

function shutdown(signal) {
  shuttingDown = true
  if (child) child.kill(signal)
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

console.log('[dev-supervisor] starting next dev with auto-restart...')
start()
