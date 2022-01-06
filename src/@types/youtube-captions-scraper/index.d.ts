declare module 'youtube-captions-scraper' {
  export type lang = 'fr' | 'en' | 'es'
  export interface GetSubtitlesParams {
    videoID: string
    lang?: lang | lang[]
  }

  export interface Phrase {
    start: string
    dur: string
    text: string
    lang: lang
  }

  export type Subtitles = Phrase[]

  export function getSubtitles(params: GetSubtitlesParams): Promise<Subtitles>
}
