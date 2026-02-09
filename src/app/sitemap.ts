import { MetadataRoute } from 'next';
import { getPublicBoards } from '@/lib/storage';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.myvoiceboard.com';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/public-boards`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
    ];

    // Dynamic public board pages
    let boardPages: MetadataRoute.Sitemap = [];
    try {
        const publicBoards = await getPublicBoards();
        boardPages = publicBoards.map((board) => ({
            url: `${baseUrl}/board/${board.id}`,
            lastModified: new Date(board.createdAt),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));
    } catch {
        // If DB is unavailable, just return static pages
    }

    return [...staticPages, ...boardPages];
}
