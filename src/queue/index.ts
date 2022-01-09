import { addSubtitlePhrases, isVideoScraped } from '../db'
import { getSubtitles } from '../subtitles'

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
  const { lines, lang } = await getSubtitles({ videoID: videoId }).catch((e) => {
    if (e.status === 429) {
      throw new YouTubeThrottlingUsJobQueueError()
    } else {
      throw new UnknownJobQueueError()
    }
  })
  return lines.map(({ start, dur, text }) => {
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

    const popJob = () => this.jobs.splice(0, 1)

    let delay = MIN_DELAY
    const processItem = () => {
      setTimeout(async () => {
        if (this.jobs.length === 0) {
          console.log('No more jobs to run')
        } else {
          const currentJob = this.jobs[0]
          console.log('Checking video:', currentJob.videoId)
          if (await isVideoScraped({ videoId: currentJob.videoId })) {
            popJob()
            console.log('Video already scraped:', currentJob.videoId)
          } else {
            const dbRows = await getDbRows(currentJob).catch((e) => {
              if (e instanceof YouTubeThrottlingUsJobQueueError) {
                delay = Math.max(MIN_DELAY, delay * 2)
                console.warn("We're being throttled. Backoff:", delay)
              } else {
                popJob()
              }
            })
            if (dbRows) {
              await addSubtitlePhrases(dbRows)
              popJob()
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
