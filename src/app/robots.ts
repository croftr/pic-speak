import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/my-boards'],
        },
        sitemap: 'https://www.myvoiceboard.com/sitemap.xml',
    };
}
