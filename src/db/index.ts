import pino from 'pino'
import PrismaLib, { SubtitlePhrase, Video } from '@prisma/client'
const { PrismaClient } = PrismaLib

type CopyWithPartial<T, K extends keyof T> = Omit<T, K> & Partial<T>

const logger = pino()
const prisma = new PrismaClient()

export async function close() {
  return prisma.$disconnect()
}

export async function addVideo(video: CopyWithPartial<Video, 'id' | 'createdAt'>) {
  return prisma.video.create({ data: video })
}

export async function addSubtitlePhrases(items: CopyWithPartial<SubtitlePhrase, 'id' | 'createdAt'>[]) {
  return prisma.subtitlePhrase.createMany({ data: items }).then(({ count }) => {
    logger.info('%d new subtitle phrases saved', count)
  })
}

export async function search(term: string) {
  return prisma.subtitlePhrase.findMany({
    where: { text: { contains: term, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
    include: { Video: {} },
  })
}

export async function isVideoScraped(params: { videoId: string }) {
  const res = await prisma.video.findFirst({ where: params })
  return res !== null
}
