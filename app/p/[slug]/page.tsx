import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDesign } from "@/lib/designs";
import CustomPageRenderer from "@/components/public/CustomPageRenderer";
import AnalyticsTracker from "@/components/public/AnalyticsTracker";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await prisma.customPage.findUnique({
    where: { slug: params.slug, published: true },
    select: {
      title: true,
      headline: true,
      subheadline: true,
      metaTitle: true,
      metaDesc: true,
      heroImage: true,
      updatedAt: true,
    },
  });

  if (!page) return { title: "Page Not Found" };

  const title = page.metaTitle || page.title;
  const description =
    page.metaDesc ||
    page.subheadline ||
    page.headline ||
    page.title;
  const image = page.heroImage || undefined;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title: page.metaTitle || page.headline || page.title,
      description,
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: page.title }]
        : undefined,
      siteName: "TruthStrike24",
      modifiedTime: page.updatedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle || page.headline || page.title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: `/p/${params.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

export default async function CustomPublicPage({ params }: Props) {
  const page = await prisma.customPage.findUnique({
    where: { slug: params.slug, published: true },
  });

  if (!page) notFound();

  const design = getDesign(page.design);

  return (
    <>
      <AnalyticsTracker pathname={`/p/${params.slug}`} />
    <CustomPageRenderer
      page={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        headline: page.headline,
        subheadline: page.subheadline,
        content: page.content,
        heroImage: page.heroImage,
        image2: page.image2,
        logoUrl: page.logoUrl,
        ctaText: page.ctaText,
        ctaUrl: page.ctaUrl,
        sections: page.sections,
        customCss: page.customCss,
      }}
      design={design}
    />
    </>
  );
}
