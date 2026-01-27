import { eq, and, or, like, desc, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { products, categories } from '../db/schema';
import { AppError } from '../middleware/errorHandler';
import {
  CreateProductInput,
  UpdateProductInput,
  GetProductsQuery,
} from '../validators/product.validator';

export class ProductService {
  async getProducts(query: GetProductsQuery) {
    const {
      page,
      limit,
      search,
      categoryId,
      minPrice,
      maxPrice,
      isActive,
    } = query;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )!
      );
    }
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    if (minPrice) {
      conditions.push(gte(products.price, minPrice));
    }
    if (maxPrice) {
      conditions.push(lte(products.price, maxPrice));
    }
    if (isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [allProducts, totalCount] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          price: products.price,
          stock: products.stock,
          categoryId: products.categoryId,
          imageUrl: products.imageUrl,
          isActive: products.isActive,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .where(whereClause)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: products.id })
        .from(products)
        .where(whereClause)
        .then((result) => result.length),
    ]);

    return {
      products: allProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getProductById(id: string) {
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  async createProduct(data: CreateProductInput) {
    // Validate category if provided
    if (data.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, data.categoryId))
        .limit(1);

      if (!category) {
        throw new AppError('Category not found', 404);
      }
    }

    // Convert price to string if it's a number
    const priceValue = typeof data.price === 'number' 
      ? data.price.toString() 
      : data.price;

    const [newProduct] = await db
      .insert(products)
      .values({
        name: data.name,
        description: data.description,
        price: priceValue,
        stock: data.stock ?? 0,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? true,
      })
      .returning();

    return newProduct;
  }

  async updateProduct(id: string, data: UpdateProductInput) {
    await this.getProductById(id); // Check if product exists

    // Validate category if provided
    if (data.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, data.categoryId))
        .limit(1);

      if (!category) {
        throw new AppError('Category not found', 404);
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) {
      updateData.price = typeof data.price === 'number' 
        ? data.price.toString() 
        : data.price;
    }
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return updatedProduct;
  }

  async deleteProduct(id: string) {
    await this.getProductById(id); // Check if product exists

    await db.delete(products).where(eq(products.id, id));

    return { message: 'Product deleted successfully' };
  }
}

export const productService = new ProductService();
