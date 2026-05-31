import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDesign } from "@/lib/designs";
import CustomPageRenderer from "@/components/public/CustomPageRenderer";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await prisma.customPage.findUnique({
    where: { slug: params.slug, published: true },
    select: { title: true, metaTitle: true, metaDesc: true, heroImage: true },
  });

  if (!page) return { title: "Page Not Found" };

  return {
    title: page.metaTitle || page.title,
    description: page.metaDesc || undefined,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDesc || undefined,
      images: page.heroImage ? [page.heroImage] : [],
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
  );
}
