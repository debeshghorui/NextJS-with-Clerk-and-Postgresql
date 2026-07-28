import { clerkClient, clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const publicRoutes = new Set([
    '/',
    '/api/webhooks/register',
    '/sign-up',
    '/sign-in',
]);

function isPublicRoute(pathname: string) {
    return publicRoutes.has(pathname);
}

function getRole(publicMetadata: Record<string, unknown>) {
    const role = publicMetadata.role;

    return typeof role === 'string' ? role : undefined;
}

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const { pathname } = req.nextUrl;

    if (!userId) {
        if (isPublicRoute(pathname)) {
            return NextResponse.next();
        }

        return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    if (!isPublicRoute(pathname) && !pathname.startsWith('/admin')) {
        return NextResponse.next();
    }

    try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const role = getRole(user.publicMetadata);

        if (role === 'admin' && pathname === '/sign-in') {
            return NextResponse.redirect(new URL('/admin', req.url));
        }

        if (role !== 'admin' && pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        if (isPublicRoute(pathname)) {
            return NextResponse.redirect(
                new URL(role === 'admin' ? '/admin' : '/dashboard', req.url),
            );
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.redirect(new URL('/sign-in', req.url));
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
        // Always run for Clerk-specific frontend API routes
        '/__clerk/(.*)',
    ],
};
