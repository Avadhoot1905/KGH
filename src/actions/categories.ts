"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

let prisma: PrismaClient;
declare global {
  var __PRISMA__: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__PRISMA__) {
    global.__PRISMA__ = new PrismaClient();
  }
  prisma = global.__PRISMA__;
}

export type Category = {
  id: string;
  name: string;
};

export async function getAllCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createCategory(name: string): Promise<{ success: boolean; category?: Category; error?: string }> {
  try {
    if (!name || !name.trim()) {
      return { success: false, error: "Category name is required" };
    }

    const trimmedName = name.trim();

    // Check if category already exists
    const existing = await prisma.category.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return { success: false, error: "Category already exists" };
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
      },
      select: {
        id: true,
        name: true,
      },
    });

    revalidatePath("/mod");
    return { success: true, category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Failed to create category" };
  }
}
