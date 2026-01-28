import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required').max(255),
    description: z.string().optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/).or(z.number().positive()),
    stock: z.number().int().min(0).default(0),
    categoryId: z.string().uuid().optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/).or(z.number().positive()).optional(),
    stock: z.number().int().min(0).optional(),
    categoryId: z.string().uuid().optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
});

export const getProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
});

export const getProductsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    minPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    maxPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    isActive: z.string().transform((val) => val === 'true').optional(),
  }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type GetProductsQuery = z.infer<typeof getProductsSchema>['query'];
