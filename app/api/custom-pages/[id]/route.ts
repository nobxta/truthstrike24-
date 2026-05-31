import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const page = await prisma.customPage.findUnique({
      where: { id: params.id },
    });
    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      title?: string;
      slug?: string;
      headline?: string;
      subheadline?: string;
      content?: string;
      design?: string;
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

    const existing = await prisma.customPage.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let slug = existing.slug;
    if (customSlug && customSlug !== existing.slug) {
      slug = slugify(customSlug);
      const conflict = await prisma.customPage.findUnique({ where: { slug } });
      if (conflict && conflict.id !== params.id) {
        let counter = 1;
        let uniqueSlug = slug;
        while (
          await prisma.customPage.findUnique({ where: { slug: uniqueSlug } })
        ) {
          uniqueSlug = `${slug}-${++counter}`;
        }
        slug = uniqueSlug;
      }
    }

    const page = await prisma.customPage.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        slug,
        ...(headline !== undefined && { headline }),
        ...(subheadline !== undefined && { subheadline }),
        ...(content !== undefined && { content }),
        ...(design !== undefined && { design }),
        ...(heroImage !== undefined && { heroImage }),
        ...(image2 !== undefined && { image2 }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(ctaText !== undefined && { ctaText }),
        ...(ctaUrl !== undefined && { ctaUrl }),
        ...(sections !== undefined && { sections }),
        ...(published !== undefined && { published }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDesc !== undefined && { metaDesc }),
        ...(customCss !== undefined && { customCss }),
      },
    });

    return NextResponse.json(page);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update page";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.customPage.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
