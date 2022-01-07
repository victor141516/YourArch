import PrismaLib, { SubtitlePhrase as PrismaSubtitlePhrase } from '@prisma/client'
const { PrismaClient } = PrismaLib

type CopyWithPartial<T, K extends keyof T> = Omit<T, K> & Partial<T>
export type SubtitlePhrase = CopyWithPartial<PrismaSubtitlePhrase, 'id' | 'createdAt'>

const prisma = new PrismaClient()

export async function close() {
  return prisma.$disconnect()
}

export async function addSubtitlePhrases(items: SubtitlePhrase[]) {
  return prisma.subtitlePhrase.createMany({
    data: items,
  })
}

export async function search(term: string) {
  return prisma.subtitlePhrase.findMany({
    where: { text: { contains: term, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function isVideoScraped(params: { videoId: string }) {
  const res = await prisma.subtitlePhrase.findFirst({ where: params })
  return res !== null
}
