import type { Prisma, SubtitlePhrase as PrismaSubtitlePhrase } from '@prisma/client'
import PrismaClientPkg from '@prisma/client'

type CopyWithPartial<T, K extends keyof T> = Omit<T, K> & Partial<T>
export type SubtitlePhrase = CopyWithPartial<PrismaSubtitlePhrase, 'id' | 'createdAt'>

const PrismaClient = PrismaClientPkg.PrismaClient
const prisma = new PrismaClient()

export async function close() {
  return prisma.$disconnect()
}

export async function addSubtitlePhrases(items: SubtitlePhrase[]) {
  return prisma.subtitlePhrase.createMany({
    data: items,
  })
}
