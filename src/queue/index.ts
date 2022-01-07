import { getSubtitles, lang } from 'youtube-captions-scraper'

import { langPriority } from '../config'
import { addSubtitlePhrases, isVideoScraped } from '../db'

const MIN_DELAY = 5_000

class JobQueueError {
  args: any[]
  constructor(...args: any[]) {
    this.args = args
  }
}
class YouTubeThrottlingUsJobQueueError extends JobQueueError {}
class UnknownJobQueueError extends JobQueueError {}

async function getDbRows({
  videoId,
  channelId,
  videoTitle,
}: {
  videoId: string
  channelId: string
  videoTitle: string
}) {
  const subtitles = await getSubtitles({ videoID: videoId, lang: langPriority as lang[] }).catch((e) => {
    if (e.status === 429) {
      throw new YouTubeThrottlingUsJobQueueError()
    } else {
      throw new UnknownJobQueueError()
    }
  })
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
}

export class JobQueue {
  private jobs: { videoId: string; channelId: string; videoTitle: string }[]
  private nextJobHandler: number | null

  constructor() {
    this.jobs = []
    this.nextJobHandler = null
  }

  add(job: { videoId: string; channelId: string; videoTitle: string }) {
    return this.jobs.push(job)
  }

  length() {
    return this.jobs.length
  }

  run() {
    if (this.nextJobHandler !== null) {
      console.warn('Queue already running')
      return
    }

    let delay = MIN_DELAY
    const processItem = () => {
      setTimeout(async () => {
        if (this.jobs.length === 0) {
          console.log('No more jobs to run')
        } else {
          const currentJob = this.jobs[0]
          console.log('Checking video:', currentJob.videoId)
          if (await isVideoScraped({ videoId: currentJob.videoId })) {
            this.jobs.splice(0, 1) // pop first item
            console.log('Video already scraped:', currentJob.videoId)
          } else {
            const dbRows = await getDbRows(currentJob).catch((e) => {
              if (e instanceof YouTubeThrottlingUsJobQueueError) {
                delay = Math.max(MIN_DELAY, delay * 2)
              }
            })
            if (dbRows) {
              await addSubtitlePhrases(dbRows)
              this.jobs.splice(0, 1) // pop first item
            }
          }
        }
        processItem()
      }, delay)
    }
    processItem()
  }

  stop() {
    if (this.nextJobHandler) clearTimeout(this.nextJobHandler)
  }
}
