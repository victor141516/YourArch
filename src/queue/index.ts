import { text } from 'express'
import pino from 'pino'

import { addSubtitlePhrases, addVideo, isVideoScraped } from '../db'
import { getSubtitles, ThrottlingSubtitleError, UnknownSubtitleError } from '../subtitles'

const logger = pino()
const MIN_DELAY = 5_000

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
      logger.warn('Queue already running')
      return
    }

    const popJob = () => this.jobs.splice(0, 1)

    let delay = MIN_DELAY
    const processItem = () => {
      setTimeout(async () => {
        if (this.jobs.length === 0) {
          logger.info('No more jobs to run')
        } else {
          const currentJob = this.jobs[0]
          logger.info('Checking video: %s', currentJob.videoId)
          if (await isVideoScraped({ videoId: currentJob.videoId })) {
            popJob()
            logger.info('Video already scraped: %s', currentJob.videoId)
          } else {
            const dbRows = await getSubtitles({ videoId: currentJob.videoId }).catch(async (e) => {
              if (e instanceof ThrottlingSubtitleError) {
                delay = Math.max(MIN_DELAY, delay * 2)
                logger.warn("We're being throttled. Backoff: %d", delay)
              } else {
                const status = (e as UnknownSubtitleError)?.args?.[0]?.status
                const text = await (e as UnknownSubtitleError)?.args?.[0]?.text?.()
                if (status && text) {
                  logger.warn('Unknown error (%s) <%d>: %s', e.constructor.name, status, text)
                } else {
                  logger.warn('Unknown error (%s): %s', e.constructor.name, e)
                }
                popJob()
              }
            })
            if (dbRows) {
              dbRows = MIN_DELAY
              const video = await addVideo({
                title: currentJob.videoTitle,
                lang: dbRows.lang,
                videoId: currentJob.videoId,
                channelId: currentJob.channelId,
              })
              await addSubtitlePhrases(dbRows.lines.map((e) => ({ videoId: video.id, ...e })))
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
