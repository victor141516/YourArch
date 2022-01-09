import { decode } from 'html-entities'
import fetch, { Response } from 'node-fetch'
import striptags from 'striptags'

export class SubtitleError {
  args: any[]
  constructor(...args: any[]) {
    this.args = args
  }
}
export class ThrottlingSubtitleError extends SubtitleError {}
export class UnknownSubtitleError extends SubtitleError {}

function handleRequestError(r: Response) {
  if (r.status === 429) {
    throw new ThrottlingSubtitleError()
  } else if (r.status !== 200) {
    throw new UnknownSubtitleError(r)
  } else {
    return r
  }
}

export async function getSubtitles({ videoId: videoId, lang = [] }: { videoId: string; lang?: string[] }) {
  const data = (await fetch(`https://youtube.com/watch?v=${videoId}`)
    .then((r) => handleRequestError(r))
    .then((r) => r.text())) as string

  // * ensure we have access to captions data
  if (!data.includes('captionTracks')) throw new Error(`Could not find captions for video: ${videoId}`)

  const regex = /({"captionTracks":.*isTranslatable":(true|false)}])/
  const [match] = regex.exec(data)!
  const captionTracks = (
    JSON.parse(`${match}}`) as {
      captionTracks: {
        languageCode: string
        vssId: string
        baseUrl: string
      }[]
    }
  ).captionTracks

  const nonTranslatedCaptionTracks = captionTracks.filter((e) => !e.baseUrl.includes('&kind=asr'))

  /**
   * 1. Get user preferred language track
   * 2. Get non transcripted english track
   * 3. Get first non transcripted track
   * 4. Get transcripted english track
   * 5. Get first track
   */
  let theLang: string | undefined
  lang.forEach((l) => {
    if (captionTracks.find(({ languageCode }) => languageCode.slice(0, 2) === l)) {
      theLang = l
    }
  })

  if (!theLang) {
    if (nonTranslatedCaptionTracks.find(({ languageCode }) => languageCode.slice(0, 2) === 'en')) {
      theLang = 'en'
    }
  }

  if (!theLang) {
    theLang = nonTranslatedCaptionTracks[0]?.languageCode.slice(0, 2)
  }

  if (!theLang) {
    if (captionTracks.find(({ languageCode }) => languageCode.slice(0, 2) === 'en')) {
      theLang = 'en'
    }
  }

  if (!theLang) {
    theLang = captionTracks[0]?.languageCode.slice(0, 2)
  }

  if (!theLang) {
    throw new Error(`Could not find captions for ${videoId}`)
  }

  const subtitle =
    captionTracks.find(({ vssId }) => vssId == `.${theLang}`) ||
    captionTracks.find(({ vssId }) => vssId == `a.${theLang}`) ||
    captionTracks.find(({ vssId }) => vssId && vssId.match(`.${theLang}`))

  // * ensure we have found the correct subtitle lang
  if (!subtitle || (subtitle && !subtitle.baseUrl)) throw new Error(`Could not find ${theLang} captions for ${videoId}`)

  const transcript = await fetch(subtitle.baseUrl)
    .then((r) => handleRequestError(r))
    .then((r) => r.text())
  const lines = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
    .replace('</transcript>', '')
    .split('</text>')
    .filter((line) => line && line.trim())
    .map((line) => {
      const startRegex = /start="([\d.]+)"/
      const durRegex = /dur="([\d.]+)"/

      const [, start] = startRegex.exec(line)!
      const [, dur] = durRegex.exec(line)!

      const htmlText = line
        .replace(/<text.+>/, '')
        .replace(/&amp;/gi, '&')
        .replace(/<\/?[^>]+(>|$)/g, '')

      const decodedText = decode(htmlText)
      const text = striptags(decodedText)

      return {
        from: start,
        duration: dur,
        text,
      }
    })

  return { lang: theLang, lines }
}
