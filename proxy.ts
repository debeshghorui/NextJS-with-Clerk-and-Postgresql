import { clerkClient } from '@clerk/nextjs/server';
import { authMiddleware } from "@clerk/nextjs/legacy";
import { NextResponse } from 'next/server';

const publicRoutes = [
    "/",
    "/api/webhooks/register",
    "/sign-up",
    "/sign-in",
]

export default authMiddleware({
    publicRoutes,
    async afterAuth(auth, req) {
        // Handle unauth users trying to access protected routes
        if (!auth.userId && !publicRoutes.includes(req.nextUrl.pathname)) {
            NextResponse.redirect(new URL('/sign-in', req.url));
        }
    }

    if (auth.userId) {
        try {
            const user = await clerkClient.users.getUser(auth.userId);
            const role = user.publicMetadata.role as string | undefined;

            // Admin role redirects to admin dashboard
            if (role === 'admin' && req.nextUrl.pathname === '/sign-in') {
                return NextResponse.redirect(new URL('/admin', req.url));
            }
            // Prevent Non-admin users trying to access admin routes
            if (role !== 'admin' && req.nextUrl.pathname.startsWith('/admin')) {
                return NextResponse.redirect(new URL('/dashboard', req.url));
            }

            // Redirects auth user trying to access public routes
            if (publicRoutes.includes(req.nextUrl.pathname)) {
                return NextResponse.redirect(
                    new URL(
                        role === 'admin' ? '/admin' : '/dashboard',
                        req.url
                    )
                );
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            return NextResponse.redirect(new URL('/sign-in', req.url));
        }
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
