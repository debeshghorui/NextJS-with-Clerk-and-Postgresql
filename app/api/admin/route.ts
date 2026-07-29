import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function isAdmin(userId: string) {
    try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const role = user.privateMetadata.role;

        return role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const admin = await isAdmin(userId);

    return NextResponse.json({ isAdmin: admin });
}
