import express from 'express'
import pino from 'pino'
import pinoExpress from 'pino-http'

import { ChromeExtensionPayload } from './@types/api'
import { search } from './db'
import { JobQueue } from './queue'

const logger = pino()

const queue = new JobQueue()
queue.run()

const app = express()
app.use(express.static('./src/static'))
app.use(pinoExpress())
app.use(
  express.json({
    verify: (_, res, buff) => {
      try {
        JSON.parse(buff.toString())
      } catch {
        res.setHeader('Content-Type', 'application/json')
        res.write(JSON.stringify({ ok: false, error: 'Payload must be a valid JSON' }))
        res.end()
        throw new (class MalformedJsonError extends Error {})()
      }
    },
  }),
)

function isString(a: string | any): a is string {
  return typeof a === 'string'
}

app.post('/api/items', async (req, res) => {
  if (!Array.isArray(req.body)) return res.json({ ok: false, error: 'Payload must be array' })
  const result = (req.body as ChromeExtensionPayload)
    .map(({ channelId, videoId, videoTitle }) => {
      if ([channelId, videoId, videoTitle].every((e) => isString(e))) {
        queue.add({ channelId, videoId, videoTitle })
        return true
      } else return false
    })
    .reduce((acc, e) => Object.assign({}, acc, { good: acc.good + (e ? 1 : 0), bad: acc.bad + (e ? 0 : 1) }), {
      good: 0,
      bad: 0,
    })
  res.json({ ok: true, ...result })
})

app.get('/api/search', async (req, res) => {
  const results = await search(req.query.q as string)
  res.json(results)
})

app.listen(3000, () => {
  logger.info('Listening on 3000')
})
