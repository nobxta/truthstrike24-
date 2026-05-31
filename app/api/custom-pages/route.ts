import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const pages = await prisma.customPage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(pages);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      slug: customSlug,
      headline,
      subheadline,
      content,
      design,
      heroImage,
      image2,
      logoUrl,
      ctaText,
      ctaUrl,
      sections,
      published,
      metaTitle,
      metaDesc,
      customCss,
    } = body as {
      title: string;
      slug?: string;
      headline?: string;
      subheadline?: string;
      content: string;
      design: string;
      heroImage?: string;
      image2?: string;
      logoUrl?: string;
      ctaText?: string;
      ctaUrl?: string;
      sections?: string;
      published?: boolean;
      metaTitle?: string;
      metaDesc?: string;
      customCss?: string;
    };

    if (!title || !design) {
      return NextResponse.json(
        { error: "Title and design are required" },
        { status: 400 }
      );
    }

    let slug = customSlug?.trim() ? slugify(customSlug) : slugify(title);
    let counter = 1;
    let uniqueSlug = slug;
    while (await prisma.customPage.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${++counter}`;
    }
    slug = uniqueSlug;

    const page = await prisma.customPage.create({
      data: {
        title,
        slug,
        headline: headline || "",
        subheadline: subheadline || "",
        content: content || "",
        design,
        heroImage: heroImage || "",
        image2: image2 || "",
        logoUrl: logoUrl || "",
        ctaText: ctaText || "",
        ctaUrl: ctaUrl || "",
        sections: sections || "[]",
        published: published || false,
        metaTitle: metaTitle || title,
        metaDesc: metaDesc || "",
        customCss: customCss || "",
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create page";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
