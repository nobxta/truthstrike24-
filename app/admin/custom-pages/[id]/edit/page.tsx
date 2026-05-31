import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import CustomPageForm from "@/components/admin/CustomPageForm";

interface Props {
  params: { id: string };
}

export default async function EditCustomPage({ params }: Props) {
  const page = await prisma.customPage.findUnique({
    where: { id: params.id },
  });

  if (!page) notFound();

  return (
    <CustomPageForm
      initialData={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        headline: page.headline,
        subheadline: page.subheadline,
        content: page.content,
        design: page.design,
        heroImage: page.heroImage,
        image2: page.image2,
        logoUrl: page.logoUrl,
        ctaText: page.ctaText,
        ctaUrl: page.ctaUrl,
        sections: page.sections,
        published: page.published,
        metaTitle: page.metaTitle,
        metaDesc: page.metaDesc,
        customCss: page.customCss,
      }}
    />
  );
}
