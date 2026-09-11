import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://buyairgunsindia.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/mod/', '/api/', '/Cart/', '/profile/', '/Wishlist/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
