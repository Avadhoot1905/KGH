"use server";

import { PrismaClient, Prisma, ProductTag } from "@prisma/client";

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

export type ProductListItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  quantity: number;
  licenseRequired: boolean;
  tag: string | null;
  averageRating?: number | null;
  totalRating?: number | null;
  totalReviews?: number | null;
  createdAt: Date;
  updatedAt: Date;
  brand: { id: string; name: string };
  type: { id: string; name: string };
  caliber: { id: string; name: string };
  category: { id: string; name: string };
  photos: { id: string; url: string; alt: string | null; isPrimary: boolean }[];
  relatedProducts?: { id: string; name: string }[];
};

export type ProductFilters = {
  brandIds?: string[];
  typeIds?: string[];
  caliberIds?: string[];
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  tag?: ProductTag;
  sort?: "PRICE_ASC" | "PRICE_DESC" | "NEWEST" | "RATING_DESC";
};

export type ProductQuery = {
  filters?: ProductFilters;
  page?: number; // 1-based
  pageSize?: number; // default 20
};

export type PaginatedProducts = {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const baseInclude = {
  brand: { select: { id: true, name: true } },
  type: { select: { id: true, name: true } },
  caliber: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  photos: { select: { id: true, url: true, alt: true, isPrimary: true } },
  relatedProducts: { select: { id: true, name: true } },
} as const;

function buildWhere(filters?: ProductFilters): Prisma.ProductWhereInput | undefined {
  if (!filters) return undefined;

  const where: Prisma.ProductWhereInput = {};

  if (filters.brandIds && filters.brandIds.length > 0) {
    where.brandId = { in: filters.brandIds };
  }
  if (filters.typeIds && filters.typeIds.length > 0) {
    where.typeId = { in: filters.typeIds };
  }
  if (filters.caliberIds && filters.caliberIds.length > 0) {
    where.caliberId = { in: filters.caliberIds };
  }
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    where.categoryId = { in: filters.categoryIds };
  }
  if (typeof filters.minPrice === "number" || typeof filters.maxPrice === "number") {
    where.price = {
      gte: typeof filters.minPrice === "number" ? filters.minPrice : undefined,
      lte: typeof filters.maxPrice === "number" ? filters.maxPrice : undefined,
    };
  }
  if (filters.tag) {
    where.tag = filters.tag as ProductTag;
  }
  if (filters.search && filters.search.trim().length > 0) {
    const q = filters.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
      { type: { name: { contains: q, mode: "insensitive" } } },
      { caliber: { name: { contains: q, mode: "insensitive" } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

function buildOrder(filters?: ProductFilters): Prisma.ProductOrderByWithRelationInput | undefined {
  if (!filters?.sort) return undefined;
  switch (filters.sort) {
    case "PRICE_ASC":
      return { price: "asc" };
    case "PRICE_DESC":
      return { price: "desc" };
    case "NEWEST":
      return { createdAt: "desc" };
    case "RATING_DESC":
      return { averageRating: "desc" };
    default:
      return undefined;
  }
}

export async function getProducts(query?: ProductQuery): Promise<PaginatedProducts> {
  const filters = query?.filters;
  const where = buildWhere(filters);
  const orderBy = buildOrder(filters) ?? { createdAt: "desc" };
  const page = Math.max(1, query?.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, query?.pageSize ?? 20));
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include: baseInclude, orderBy, skip, take }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: products as unknown as ProductListItem[],
    total,
    page,
    pageSize,
    totalPages,
  };
}

// Back-compat wrappers (can be removed after consumers migrate)
export async function getAllProducts(): Promise<ProductListItem[]> {
  const result = await getProducts({ page: 1, pageSize: 50 });
  return result.items;
}

export async function getFilteredProducts(filters?: ProductFilters): Promise<ProductListItem[]> {
  const result = await getProducts({ filters, page: 1, pageSize: 50 });
  return result.items;
}

export async function getFilterOptions() {
  const [brands, types] = await Promise.all([
    prisma.brand.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.type.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { brands, types };
}

export async function getProductById(productId: string): Promise<ProductListItem | null> {
  if (!productId) return null;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: baseInclude,
  });
  return (product as unknown as ProductListItem) ?? null;
}

// Brute-force search wrapper for Navbar
export async function searchProductsBrute(query: string): Promise<ProductListItem[]> {
  const q = (query || "").trim();
  if (!q) return [];
  const { items } = await getProducts({ filters: { search: q }, page: 1, pageSize: 50 });
  return items;
}

// Lightweight search index for client Fuse.js
export async function getSearchIndex() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      brand: { select: { name: true } },
      type: { select: { name: true } },
      category: { select: { name: true } },
      photos: { select: { url: true, isPrimary: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    brandName: p.brand?.name ?? null,
    typeName: p.type?.name ?? null,
    categoryName: p.category?.name ?? null,
    photoUrl: (p.photos.find(ph => ph.isPrimary) ?? p.photos[0])?.url ?? null,
  }));
}

// Server action to update a product (admin-only)
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

export async function updateProductAction(
  productId: string,
  formData: FormData
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  // Place allowed admin emails here (same as (admin)/layout.tsx)
  // const allowedAdmins = [
  //   "arcsmo19@gmail.com",
  // ];
  const allowedAdmins: string[] = ["arcsmo19@gmail.com"]; // keep in sync

  if (!allowedAdmins.includes(session.user.email)) {
    throw new Error("Forbidden");
  }

  const name = (formData.get("name") as string) ?? undefined;
  const description = (formData.get("description") as string) ?? undefined;
  const priceStr = (formData.get("price") as string) ?? undefined;
  const quantityStr = (formData.get("quantity") as string) ?? undefined;
  const licenseRequiredStr = (formData.get("licenseRequired") as string) ?? undefined;
  const tag = (formData.get("tag") as string) || null;
  const brandId = (formData.get("brandId") as string) ?? undefined;
  const typeId = (formData.get("typeId") as string) ?? undefined;
  const caliberId = (formData.get("caliberId") as string) ?? undefined;
  const categoryId = (formData.get("categoryId") as string) ?? undefined;
  const photoFile = formData.get("photo") as unknown as File | null;
  const relatedProductIds = (formData.get("relatedProductIds") as string) ?? undefined;

  const data: any = {};
  if (typeof name === "string") data.name = name;
  if (typeof description === "string") data.description = description;
  if (typeof priceStr === "string" && priceStr.trim() !== "") data.price = Number(priceStr);
  if (typeof quantityStr === "string" && quantityStr.trim() !== "") data.quantity = Number(quantityStr);
  if (typeof licenseRequiredStr === "string") data.licenseRequired = licenseRequiredStr === "on" || licenseRequiredStr === "true";
  if (tag !== null && tag !== undefined && tag !== "") data.tag = tag as any; else if (tag === "") data.tag = null;

  if (brandId) data.brand = { connect: { id: brandId } };
  if (typeId) data.type = { connect: { id: typeId } };
  if (caliberId) data.caliber = { connect: { id: caliberId } };
  if (categoryId) data.category = { connect: { id: categoryId } };

  // Handle related products
  if (relatedProductIds !== undefined) {
    const ids = relatedProductIds ? relatedProductIds.split(",").filter(Boolean) : [];
    data.relatedProducts = {
      set: ids.map(id => ({ id })),
    };
  }

  // If a new photo is uploaded, save it under public/uploads and create a primary photo
  let photoToCreate: { url: string; alt?: string | null; isPrimary: boolean } | null = null;
  if (photoFile && typeof photoFile === "object" && "arrayBuffer" in photoFile) {
    const bytes = Buffer.from(await photoFile.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}_${(photoFile.name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeName);
    await fs.writeFile(filePath, bytes);
    const publicUrl = `/uploads/${safeName}`;
    photoToCreate = { url: publicUrl, alt: data.name as string | undefined, isPrimary: true };
  }

  if (Object.keys(data).length === 0 && !photoToCreate) {
    throw new Error("No valid fields to update");
  }

  if (photoToCreate) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        photos: {
          updateMany: {
            where: { isPrimary: true },
            data: { isPrimary: false },
          },
          create: photoToCreate,
        },
      },
    });
  } else {
    await prisma.product.update({ where: { id: productId }, data });
  }

  // Revalidate the admin products page
  revalidatePath("/mod");
}

// Delete a product (admin-only)
export async function deleteProductAction(productId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  const allowedAdmins: string[] = ["arcsmo19@gmail.com"]; // keep in sync with admin layout
  if (!allowedAdmins.includes(session.user.email)) {
    throw new Error("Forbidden");
  }

  if (!productId) {
    throw new Error("Invalid product id");
  }

  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/mod");
}

// Get all products for selectors (admin-only)
export async function getAllProductsForSelector() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  const allowedAdmins: string[] = ["arcsmo19@gmail.com"];
  if (!allowedAdmins.includes(session.user.email)) {
    throw new Error("Forbidden");
  }

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return products;
}

// Create a product (admin-only)
export async function createProductAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  const allowedAdmins: string[] = ["arcsmo19@gmail.com"]; // keep in sync
  if (!allowedAdmins.includes(session.user.email)) {
    throw new Error("Forbidden");
  }

  const name = (formData.get("name") as string | null)?.trim() || "";
  const description = (formData.get("description") as string | null)?.trim() || "";
  const priceStr = (formData.get("price") as string | null)?.trim() || "";
  const quantityStr = (formData.get("quantity") as string | null)?.trim() || "";
  const licenseRequiredStr = (formData.get("licenseRequired") as string | null) || null;
  const tag = ((formData.get("tag") as string | null)?.trim() || "") || null;
  const brandId = (formData.get("brandId") as string | null)?.trim() || "";
  const typeId = (formData.get("typeId") as string | null)?.trim() || "";
  const caliberId = (formData.get("caliberId") as string | null)?.trim() || "";
  const categoryId = (formData.get("categoryId") as string | null)?.trim() || "";
  const photoFile = formData.get("photo") as unknown as File | null;
  const relatedProductIds = (formData.get("relatedProductIds") as string) ?? undefined;

  if (!name || !description || !priceStr || !quantityStr || !brandId || !typeId || !caliberId || !categoryId) {
    throw new Error("All fields except image are required");
  }

  const price = Number(priceStr);
  const quantity = Number(quantityStr);
  if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price");
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Invalid quantity");

  const createData: any = {
    name,
    description,
    price,
    quantity,
    licenseRequired: licenseRequiredStr === "on" || licenseRequiredStr === "true" ? true : false,
    tag: tag ? (tag as any) : undefined,
    brand: { connect: { id: brandId } },
    type: { connect: { id: typeId } },
    caliber: { connect: { id: caliberId } },
    category: { connect: { id: categoryId } },
  };

  // Handle related products
  if (relatedProductIds) {
    const ids = relatedProductIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      createData.relatedProducts = {
        connect: ids.map(id => ({ id })),
      };
    }
  }

  // Handle optional image upload
  let photoToCreate: { url: string; alt?: string | null; isPrimary: boolean } | null = null;
  if (photoFile && typeof photoFile === "object" && "arrayBuffer" in photoFile) {
    const bytes = Buffer.from(await (photoFile as any).arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}_${((photoFile as any).name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeName);
    await fs.writeFile(filePath, bytes);
    const publicUrl = `/uploads/${safeName}`;
    photoToCreate = { url: publicUrl, alt: name, isPrimary: true };
  }

  if (photoToCreate) {
    await prisma.product.create({
      data: {
        ...createData,
        photos: { create: photoToCreate },
      },
    });
  } else {
    await prisma.product.create({ data: createData });
  }

  revalidatePath("/mod");
}

