import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, color, emoji } = body as {
      name?: string;
      color?: string;
      emoji?: string;
    };

    const data: Record<string, string> = {};
    if (name) {
      data.name = name;
      data.slug = slugify(name);
    }
    if (color) data.color = color;
    if (emoji) data.emoji = emoji;

    const category = await prisma.category.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postsCount = await prisma.post.count({
      where: { categoryId: params.id },
    });

    if (postsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${postsCount} posts use this category` },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
