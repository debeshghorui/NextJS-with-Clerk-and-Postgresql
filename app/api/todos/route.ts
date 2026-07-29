import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

const ITem_PER_PAGE = 10;

export async function GET(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * ITem_PER_PAGE;

    const search = searchParams.get('search') || '';

    try {
        const todos = await prisma.todo.findMany({
            where: {
                userId,
                title: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
            orderBy: { createdAt: 'desc' },
            take: ITem_PER_PAGE,
            skip: offset,
        });

        const totalPages = await prisma.todo.count({
            where: {
                userId,
                title: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
        });

        const totalPageCount = Math.ceil(totalPages / ITem_PER_PAGE);

        return NextResponse.json(
            {
                todos,
                currentPage: page,
                totalPageCount,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error('Error fetching todos:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 },
        );
    }
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { todos: true },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    console.log('User:', user);

    if (!user.isSubscribed && user.todos.length >= 3) {
        return NextResponse.json(
            {
                error: 'Todo limit reached. Please upgrade your plan to add more todos.',
            },
            { status: 403 },
        );
    }

    const { title } = req.json();

    const todo = await prisma.todo.create({
        data: {
            title,
            userId,
        },
    });

    return NextResponse.json(todo, { status: 200 });
}
