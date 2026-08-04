"use server";

import { PrismaClient, Prisma } from "@prisma/client";
import { isAdmin } from "@/lib/adminAuth";

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
  photos: { id: string; url: string; alt: string | null; isPrimary: boolean; position: number }[];
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
  tag?: string;
  lowStock?: boolean;
  lowStockThreshold?: number;
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
} as const;

function buildWhere(filters?: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    removedAt: null,
  };

  if (!filters) return where;

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
  // Low stock filter
  if (filters.lowStock) {
    where.quantity = {
      lte: filters.lowStockThreshold ?? 5,
    };
  }
  if (filters.tag) {
    where.tag = filters.tag;
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
  const categories = await prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return { brands, types, categories };
}

export type FilterOptions = {
  brands: { id: string; name: string }[];
  types: { id: string; name: string }[];
  categories: { id: string; name: string }[];
};

export async function getProductById(productId: string): Promise<ProductListItem | null> {
  if (!productId) return null;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: baseInclude,
  });
  return (product as unknown as ProductListItem) ?? null;
}

// Get related products with full details for a product
export async function getRelatedProductsWithDetails(productId: string): Promise<ProductListItem[]> {
  if (!productId) return [];
  
  try {
    // Query the join table to get related product IDs
    const relatedProductIds: { B: string }[] = await prisma.$queryRaw`
      SELECT "B" FROM "_RelatedProducts" WHERE "A" = ${productId}
    `;
    
    if (!relatedProductIds || relatedProductIds.length === 0) {
      return [];
    }
    
    // Fetch full details of those related products
    const ids = relatedProductIds.map(row => row.B);
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { in: ids },
      },
      include: baseInclude,
    });
    
    return (relatedProducts as unknown as ProductListItem[]) ?? [];
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
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
  return products.map((p: { id: string; name: string; description: string; price: number; brand: { name: string } | null; type: { name: string } | null; category: { name: string } | null; photos: { url: string; isPrimary: boolean }[] }) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    brandName: p.brand?.name ?? null,
    typeName: p.type?.name ?? null,
    categoryName: p.category?.name ?? null,
    photoUrl: (p.photos.find((ph: { url: string; isPrimary: boolean }) => ph.isPrimary) ?? p.photos[0])?.url ?? null,
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

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const name = (formData.get("name") as string) ?? undefined;
  const description = (formData.get("description") as string) ?? undefined;
  const priceStr = (formData.get("price") as string) ?? undefined;
  const quantityStr = (formData.get("quantity") as string) ?? undefined;
  const licenseRequiredStr = (formData.get("licenseRequired") as string) ?? undefined;
  const tag = (formData.get("tag") as string) || null;
  const brandName = (formData.get("brandName") as string)?.trim() ?? undefined;
  const typeName = (formData.get("typeName") as string)?.trim() ?? undefined;
  const caliberName = (formData.get("caliberName") as string)?.trim() ?? undefined;
  const categoryName = (formData.get("categoryName") as string)?.trim() ?? undefined;
  const relatedProductIds = (formData.get("relatedProductIds") as string) ?? undefined;
  const photoMetaStr = formData.get("photoMeta") as string | null;
  const newPhotoFiles = formData.getAll("photos") as unknown as File[];

  type UpdateData = {
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    licenseRequired?: boolean;
    tag?: string | null;
    brand?: { connect: { id: string } };
    type?: { connect: { id: string } };
    caliber?: { connect: { id: string } };
    category?: { connect: { id: string } };
    relatedProducts?: { set: Array<{ id: string }> };
  };

  const data: UpdateData = {};
  if (typeof name === "string") data.name = name;
  if (typeof description === "string") data.description = description;
  if (typeof priceStr === "string" && priceStr.trim() !== "") data.price = Number(priceStr);
  if (typeof quantityStr === "string" && quantityStr.trim() !== "") data.quantity = Number(quantityStr);
  if (typeof licenseRequiredStr === "string") data.licenseRequired = licenseRequiredStr === "on" || licenseRequiredStr === "true";
  if (tag !== null && tag !== undefined && tag !== "") data.tag = tag; else if (tag === "") data.tag = null;

  // Find or create entities by name if provided
  if (brandName) {
    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });
    data.brand = { connect: { id: brand.id } };
  }
  if (typeName) {
    const type = await prisma.type.upsert({
      where: { name: typeName },
      update: {},
      create: { name: typeName },
    });
    data.type = { connect: { id: type.id } };
  }
  if (caliberName) {
    const caliber = await prisma.caliber.upsert({
      where: { name: caliberName },
      update: {},
      create: { name: caliberName },
    });
    data.caliber = { connect: { id: caliber.id } };
  }
  if (categoryName) {
    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    data.category = { connect: { id: category.id } };
  }

  // Handle related products
  if (relatedProductIds !== undefined) {
    const ids = relatedProductIds ? relatedProductIds.split(",").filter(Boolean) : [];
    data.relatedProducts = {
      set: ids.map(id => ({ id })),
    };
  }

  // Update the basic fields first
  await prisma.product.update({ where: { id: productId }, data });

  // Handle photo updates using photoMeta if present
  if (photoMetaStr) {
    type PhotoMetaItem = {
      id?: string;
      tempIndex?: number;
      isPrimary: boolean;
      position: number;
    };
    let photoMeta: PhotoMetaItem[] = [];
    try {
      photoMeta = JSON.parse(photoMetaStr);
    } catch (e) {
      console.error("Failed to parse photoMeta", e);
    }

    const currentDbPhotos = await prisma.photo.findMany({
      where: { productId },
    });

    // Delete photos not present in photoMeta
    const remainingIds = photoMeta.map(p => p.id).filter(Boolean) as string[];
    const deletedPhotos = currentDbPhotos.filter(dbP => !remainingIds.includes(dbP.id));
    if (deletedPhotos.length > 0) {
      await prisma.photo.deleteMany({
        where: { id: { in: deletedPhotos.map(p => p.id) } },
      });
    }

    // Process each photo item in photoMeta
    for (const item of photoMeta) {
      if (item.id) {
        // Update existing photo
        await prisma.photo.update({
          where: { id: item.id },
          data: {
            isPrimary: item.isPrimary,
            position: item.position,
          },
        });
      } else if (typeof item.tempIndex === "number") {
        // Upload new photo
        const file = newPhotoFiles[item.tempIndex];
        if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
          const bytes = Buffer.from(await file.arrayBuffer());
          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          await fs.mkdir(uploadsDir, { recursive: true });
          const safeName = `${Date.now()}_${item.tempIndex}_${(file.name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
          const filePath = path.join(uploadsDir, safeName);
          await fs.writeFile(filePath, bytes);
          const publicUrl = `/uploads/${safeName}`;

          await prisma.photo.create({
            data: {
              url: publicUrl,
              alt: name || "product image",
              isPrimary: item.isPrimary,
              position: item.position,
              productId,
            },
          });
        }
      }
    }
  } else {
    // Fallback/Legacy photo upload logic
    const existingPhotosStr = formData.get("existingPhotos") as string | null;
    let existingPhotos: Array<{ id: string; url: string; isPrimary: boolean; position: number }> = [];
    if (existingPhotosStr) {
      try {
        existingPhotos = JSON.parse(existingPhotosStr);
      } catch (e) {
        console.error("Failed to parse existingPhotos", e);
      }
    }

    const currentDbPhotos = await prisma.photo.findMany({
      where: { productId },
    });

    const remainingIds = existingPhotos.map(p => p.id).filter(Boolean);
    const deletedPhotos = currentDbPhotos.filter(dbP => !remainingIds.includes(dbP.id));
    
    if (deletedPhotos.length > 0) {
      await prisma.photo.deleteMany({
        where: { id: { in: deletedPhotos.map(p => p.id) } },
      });
    }

    for (const p of existingPhotos) {
      if (p.id) {
        await prisma.photo.update({
          where: { id: p.id },
          data: {
            isPrimary: p.isPrimary,
            position: p.position,
          },
        });
      }
    }

    let nextPosition = existingPhotos.length;
    let hasPrimary = existingPhotos.some(p => p.isPrimary);

    for (let i = 0; i < newPhotoFiles.length; i++) {
      const file = newPhotoFiles[i];
      if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}_${i}_${(file.name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
        const filePath = path.join(uploadsDir, safeName);
        await fs.writeFile(filePath, bytes);
        const publicUrl = `/uploads/${safeName}`;

        const isPrimary = !hasPrimary;
        if (isPrimary) hasPrimary = true;

        await prisma.photo.create({
          data: {
            url: publicUrl,
            alt: name || "product image",
            isPrimary,
            position: nextPosition++,
            productId,
          },
        });
      }
    }
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

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  await prisma.product.update({
    where: { id: productId },
    data: { removedAt: new Date() },
  });
  revalidatePath("/mod");
}

// Get all products for selectors (admin-only)
export async function getAllProductsForSelector() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
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

// Get all brands for autocomplete (admin-only)
export async function getAllBrandsForSelector() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const brands = await prisma.brand.findMany({
    select: {
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return brands.map((b: { name: string }) => b.name);
}

// Get all types for autocomplete (admin-only)
export async function getAllTypesForSelector() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const types = await prisma.type.findMany({
    select: {
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return types.map((t: { name: string }) => t.name);
}

// Get all calibers for autocomplete (admin-only)
export async function getAllCalibersForSelector() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const calibers = await prisma.caliber.findMany({
    select: {
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return calibers.map((c: { name: string }) => c.name);
}

// Get all categories for autocomplete (admin-only)
export async function getAllCategoriesForSelector() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const categories = await prisma.category.findMany({
    select: {
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories.map((c: { name: string }) => c.name);
}

// Get all available tags (including enum values and any custom ones if needed)
export async function getAllTagsForSelector() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  // Return the enum values plus any custom tags found in the database
  const enumTags = ["NEW", "TOP_SELLER"];
  
  // Get unique tags from existing products
  const customTags = await prisma.product.findMany({
    where: {
      tag: {
        not: null,
      },
    },
    select: {
      tag: true,
    },
    distinct: ["tag"],
  });

  const allTags = [...new Set([...enumTags, ...customTags.map((p: { tag: string | null }) => p.tag).filter(Boolean)])];
  return allTags as string[];
}

// Add a new tag (admin-only) - Note: This is more of a validation function
// since tags are stored directly on products
export async function addNewTagAction(tagName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const normalizedTag = tagName.trim().toUpperCase().replace(/\s+/g, "_");
  
  if (!normalizedTag) {
    throw new Error("Tag name cannot be empty");
  }

  // Validate tag format (alphanumeric and underscores only)
  if (!/^[A-Z0-9_]+$/.test(normalizedTag)) {
    throw new Error("Tag can only contain letters, numbers, and underscores");
  }

  // Return the normalized tag name to confirm it's valid
  // The actual tag will be saved when the product is created/updated
  return normalizedTag;
}

// Create a product (admin-only)
export async function createProductAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) {
    throw new Error("Forbidden");
  }

  const name = (formData.get("name") as string | null)?.trim() || "";
  const description = (formData.get("description") as string | null)?.trim() || "";
  const priceStr = (formData.get("price") as string | null)?.trim() || "";
  const quantityStr = (formData.get("quantity") as string | null)?.trim() || "";
  const licenseRequiredStr = (formData.get("licenseRequired") as string | null) || null;
  const tag = ((formData.get("tag") as string | null)?.trim() || "") || null;
  const brandName = (formData.get("brandName") as string | null)?.trim() || "";
  const typeName = (formData.get("typeName") as string | null)?.trim() || "";
  const caliberName = (formData.get("caliberName") as string | null)?.trim() || "";
  const categoryName = (formData.get("categoryName") as string | null)?.trim() || "";
  const photoFiles = formData.getAll("photos") as unknown as File[];
  const relatedProductIds = (formData.get("relatedProductIds") as string) ?? undefined;

  if (!name || !description || !priceStr || !quantityStr || !brandName || !typeName || !caliberName || !categoryName) {
    throw new Error("All fields except image are required");
  }

  const price = Number(priceStr);
  const quantity = Number(quantityStr);
  if (!Number.isFinite(price) || price < 0) throw new Error("Invalid price");
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Invalid quantity");

  // Find or create Brand, Type, Caliber, and Category by name
  const [brand, type, caliber, category] = await Promise.all([
    prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    }),
    prisma.type.upsert({
      where: { name: typeName },
      update: {},
      create: { name: typeName },
    }),
    prisma.caliber.upsert({
      where: { name: caliberName },
      update: {},
      create: { name: caliberName },
    }),
    prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    }),
  ]);

  type CreateData = {
    name: string;
    description: string;
    price: number;
    quantity: number;
    licenseRequired: boolean;
    tag?: string;
    brand: { connect: { id: string } };
    type: { connect: { id: string } };
    caliber: { connect: { id: string } };
    category: { connect: { id: string } };
    relatedProducts?: { connect: Array<{ id: string }> };
    photos?: { create: Array<{ url: string; alt?: string | null; isPrimary: boolean; position: number }> };
  };

  const createData: CreateData = {
    name,
    description,
    price,
    quantity,
    licenseRequired: licenseRequiredStr === "on" || licenseRequiredStr === "true" ? true : false,
    tag: tag || undefined,
    brand: { connect: { id: brand.id } },
    type: { connect: { id: type.id } },
    caliber: { connect: { id: caliber.id } },
    category: { connect: { id: category.id } },
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

  // Handle multiple image uploads with photoMeta if present
  const photoMetaStr = formData.get("photoMeta") as string | null;
  const photosToCreate: Array<{ url: string; alt?: string | null; isPrimary: boolean; position: number }> = [];
  
  if (photoMetaStr) {
    type PhotoMetaItem = {
      tempIndex: number;
      isPrimary: boolean;
      position: number;
    };
    let photoMeta: PhotoMetaItem[] = [];
    try {
      photoMeta = JSON.parse(photoMetaStr);
    } catch (e) {
      console.error("Failed to parse photoMeta in create action", e);
    }

    for (const item of photoMeta) {
      const file = photoFiles[item.tempIndex];
      if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}_${item.tempIndex}_${(file.name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
        const filePath = path.join(uploadsDir, safeName);
        await fs.writeFile(filePath, bytes);
        const publicUrl = `/uploads/${safeName}`;
        photosToCreate.push({
          url: publicUrl,
          alt: `${name} ${item.position + 1}`,
          isPrimary: item.isPrimary,
          position: item.position,
        });
      }
    }
  } else {
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      if (file && typeof file === "object" && "arrayBuffer" in file && file.size > 0) {
        const bytes = Buffer.from(await file.arrayBuffer());
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}_${i}_${(file.name || "upload").replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
        const filePath = path.join(uploadsDir, safeName);
        await fs.writeFile(filePath, bytes);
        const publicUrl = `/uploads/${safeName}`;
        photosToCreate.push({
          url: publicUrl,
          alt: `${name} ${i + 1}`,
          isPrimary: i === 0, // First one is primary by default
          position: i,
        });
      }
    }
  }

  if (photosToCreate.length > 0) {
    await prisma.product.create({
      data: {
        ...createData,
        photos: { create: photosToCreate },
      },
    });
  } else {
    await prisma.product.create({ data: createData });
  }

  revalidatePath("/mod");
}

export async function addNewTypeAction(typeName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const name = typeName.trim();
  if (!name) throw new Error("Type name cannot be empty");

  const type = await prisma.type.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return type.name;
}

export async function editTypeAction(oldName: string, newName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const oldN = oldName.trim();
  const newN = newName.trim();
  if (!newN) throw new Error("New type name cannot be empty");

  await prisma.type.update({
    where: { name: oldN },
    data: { name: newN },
  });
  revalidatePath("/mod");
}

export async function deleteTypeAction(typeName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const name = typeName.trim();
  const count = await prisma.product.count({
    where: { type: { name } },
  });
  if (count > 0) {
    throw new Error(`Cannot delete Type "${name}" because it is in use by ${count} products.`);
  }

  await prisma.type.delete({
    where: { name },
  });
  revalidatePath("/mod");
}

export async function editTagAction(oldName: string, newName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const oldN = oldName.trim();
  const newN = newName.trim().toUpperCase().replace(/\s+/g, "_");
  if (!newN) throw new Error("New tag name cannot be empty");

  await prisma.product.updateMany({
    where: { tag: oldN },
    data: { tag: newN },
  });
  revalidatePath("/mod");
}

export async function deleteTagAction(tagName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const name = tagName.trim();
  await prisma.product.updateMany({
    where: { tag: name },
    data: { tag: null },
  });
  revalidatePath("/mod");
}

export async function addNewBrandAction(brandName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const name = brandName.trim();
  if (!name) throw new Error("Brand name cannot be empty");

  const brand = await prisma.brand.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return brand.name;
}

export async function editBrandAction(oldName: string, newName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const oldN = oldName.trim();
  const newN = newName.trim();
  if (!newN) throw new Error("New brand name cannot be empty");

  await prisma.brand.update({
    where: { name: oldN },
    data: { name: newN },
  });
  revalidatePath("/mod");
}

export async function deleteBrandAction(brandName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const name = brandName.trim();
  const count = await prisma.product.count({
    where: { brand: { name } },
  });
  if (count > 0) {
    throw new Error(`Cannot delete Brand "${name}" because it is in use by ${count} products.`);
  }

  await prisma.brand.delete({
    where: { name },
  });
  revalidatePath("/mod");
}

export async function addNewCaliberAction(caliberName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const name = caliberName.trim();
  if (!name) throw new Error("Caliber name cannot be empty");

  const caliber = await prisma.caliber.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return caliber.name;
}

export async function editCaliberAction(oldName: string, newName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const oldN = oldName.trim();
  const newN = newName.trim();
  if (!newN) throw new Error("New caliber name cannot be empty");

  await prisma.caliber.update({
    where: { name: oldN },
    data: { name: newN },
  });
  revalidatePath("/mod");
}

export async function deleteCaliberAction(caliberName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const name = caliberName.trim();
  const count = await prisma.product.count({
    where: { caliber: { name } },
  });
  if (count > 0) {
    throw new Error(`Cannot delete Caliber "${name}" because it is in use by ${count} products.`);
  }

  await prisma.caliber.delete({
    where: { name },
  });
  revalidatePath("/mod");
}

export async function addNewCategoryAction(categoryName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const name = categoryName.trim();
  if (!name) throw new Error("Category name cannot be empty");

  const category = await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return category.name;
}

export async function editCategoryAction(oldName: string, newName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const oldN = oldName.trim();
  const newN = newName.trim();
  if (!newN) throw new Error("New category name cannot be empty");

  await prisma.category.update({
    where: { name: oldN },
    data: { name: newN },
  });
  revalidatePath("/mod");
}

export async function deleteCategoryAction(categoryName: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");
  const userIsAdmin = await isAdmin(session.user.email);
  if (!userIsAdmin) throw new Error("Forbidden");

  const name = categoryName.trim();
  const count = await prisma.product.count({
    where: { category: { name } },
  });
  if (count > 0) {
    throw new Error(`Cannot delete Category "${name}" because it is in use by ${count} products.`);
  }

  await prisma.category.delete({
    where: { name },
  });
  revalidatePath("/mod");
}


