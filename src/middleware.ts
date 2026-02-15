import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/my-boards(.*)", "/board(.*)", "/admin(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/about", "/public-boards(.*)", "/sitemap.xml", "/robots.txt"]);

export default clerkMiddleware(async (auth, req) => {
    // Let public pages pass through without any Clerk processing for crawlers
    if (isPublicRoute(req)) return;
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
