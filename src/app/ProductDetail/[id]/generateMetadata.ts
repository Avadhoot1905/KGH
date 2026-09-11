import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brands: { select: { name: true } },
        categories: { select: { name: true } },
        calibers: { select: { name: true } },
        photos: { select: { url: true, alt: true, isPrimary: true } },
      },
    });

    if (!product) {
      return {
        title: 'Product Not Found | Kathuria Gun House',
        description: 'Explore premium airguns, rifles, pistols, and shooting accessories at Kathuria Gun House.',
      };
    }

    const brandNames = product.brands.map((b) => b.name).join(', ');
    const categoryNames = product.categories.map((c) => c.name).join(', ');
    const caliberNames = product.calibers.map((c) => c.name).join(', ');
    const primaryPhoto = product.photos.find((p) => p.isPrimary)?.url || product.photos[0]?.url;

    const pageTitle = `Buy ${product.name} Online in India | Kathuria Gun House`;
    const metaDescription = `Buy ${product.name} ${brandNames ? `by ${brandNames}` : ''} at best price in India. ${caliberNames ? `Caliber: ${caliberNames}.` : ''} ${categoryNames ? `Category: ${categoryNames}.` : ''} 100% Genuine with Warranty from Kathuria Gun House Malout Punjab.`;

    return {
      title: pageTitle,
      description: metaDescription.slice(0, 160),
      keywords: [
        product.name,
        `Buy ${product.name}`,
        `${product.name} price India`,
        `${product.name} specs`,
        ...product.brands.map((b) => `${b.name} airguns`),
        ...product.categories.map((c) => `buy ${c.name} India`),
        ...product.calibers.map((c) => `${c.name} air pistol`),
        'Kathuria Gun House',
        'Airguns India',
      ],
      openGraph: {
        title: pageTitle,
        description: metaDescription,
        url: `https://buyairgunsindia.in/ProductDetail/${id}`,
        siteName: 'Kathuria Gun House',
        images: primaryPhoto ? [{ url: primaryPhoto, alt: product.name }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: metaDescription,
        images: primaryPhoto ? [primaryPhoto] : [],
      },
    };
  } catch {
    return {
      title: 'Product Details | Kathuria Gun House',
      description: 'Explore top quality sports airguns, pistols, and shooting supplies in India.',
    };
  }
}
