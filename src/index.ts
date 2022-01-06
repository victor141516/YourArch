import express from 'express'
import { getSubtitles, lang } from 'youtube-captions-scraper'

import { ChromeExtensionPayload } from './@types/api'
import { langPriority } from './config'
import { addSubtitlePhrases } from './db'

const app = express()
app.use(express.json())

app.post('/api/items', async (req, res) => {
  const result = (
    await Promise.all(
      (req.body as ChromeExtensionPayload).map(async ({ channelId, videoId, videoTitle }) => {
        const subtitles = await getSubtitles({ videoID: videoId, lang: langPriority as lang[] })
        return subtitles.map(({ start, dur, text, lang }) => {
          return {
            channelId: channelId,
            videoId: videoId,
            videoTitle: videoTitle,
            from: start,
            duration: dur,
            text: text,
            lang: lang,
          }
        })
      }),
    )
  ).flat()
  addSubtitlePhrases(result)
  res.json({ ok: true, result })
})

app.listen(3000, () => {
  console.log('Listening on 3000')
})
