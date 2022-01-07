import express from 'express'

import { ChromeExtensionPayload } from './@types/api'
import { search } from './db'
import { JobQueue } from './queue'

const queue = new JobQueue()
queue.run()
const app = express()
app.use(express.json())

app.post('/api/items', async (req, res) => {
  ;(req.body as ChromeExtensionPayload).forEach(({ channelId, videoId, videoTitle }) => {
    queue.add({ channelId, videoId, videoTitle })
  })
  res.json({ ok: true })
})

app.get('/api/search', async (req, res) => {
  const results = await search(req.query.q as string)
  res.json(results)
})

app.listen(3000, () => {
  console.log('Listening on 3000')
})
