import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

import { env } from '@/env';

const PrismaClientSingleton = () => {
    const adapter = new PrismaPg(env.DATABASE_URL);

    return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof PrismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? PrismaClientSingleton();

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
