import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/my-boards(.*)", "/admin(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/about", "/public-boards(.*)", "/board(.*)", "/sitemap.xml", "/robots.txt"]);

export default clerkMiddleware(async (auth, req) => {
    // Redirect the Vercel-generated domain to the canonical custom domain.
    // pic-speak.vercel.app serves the full site and would otherwise compete
    // with www.myvoiceboard.com as duplicate content in search results.
    if (req.headers.get('host') === 'pic-speak.vercel.app') {
        const url = req.nextUrl.clone();
        url.protocol = 'https';
        url.host = 'www.myvoiceboard.com';
        return NextResponse.redirect(url, 308);
    }

    if (isPublicRoute(req)) {
        // Clerk injects X-Robots-Tag: noindex on every response it touches.
        // Strip it so public pages remain crawlable.
        const response = NextResponse.next();
        response.headers.delete('X-Robots-Tag');
        return response;
    }
    if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
    matcher: [
        // Skip Next.js internals, static files, sitemap, and robots.txt
        '/((?!_next|sitemap\\.xml|robots\\.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
