import express from 'express'

import { ChromeExtensionPayload } from './@types/api'
import { search } from './db'
import { JobQueue } from './queue'

const queue = new JobQueue()
queue.run()
const app = express()
app.use(express.json())

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
  console.log('Listening on 3000')
})
