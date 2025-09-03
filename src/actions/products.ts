"use server";

import { PrismaClient, Prisma } from "@prisma/client";

let prisma: PrismaClient;
declare global {
  // eslint-disable-next-line no-var
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
  createdAt: Date;
  updatedAt: Date;
  brand: { id: string; name: string };
  type: { id: string; name: string };
  caliber: { id: string; name: string };
  category: { id: string; name: string };
  photos: { id: string; url: string; alt: string | null; isPrimary: boolean }[];
};

export type ProductFilters = {
  brandIds?: string[];
  typeIds?: string[];
  caliberIds?: string[];
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  tag?: "NEW" | "TOP_SELLER";
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
} satisfies Prisma.ProductInclude;

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
    where.tag = filters.tag as any;
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


