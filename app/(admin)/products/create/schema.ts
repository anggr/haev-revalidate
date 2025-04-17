import { z } from 'zod';

export const productFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  slug: z.string().min(2, { message: 'Slug must be at least 2 characters' }),
  description: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  subcategory_id: z.string().optional().nullable(),
  brand_id: z.string().optional().nullable(),
  price: z.coerce
    .number()
    .min(0, { message: 'Price must be a positive number' }),
  compare_at_price: z.coerce.number().optional().nullable(),
  cost_price: z.coerce.number().optional().nullable(),
  currency_code: z.string().default('USD'),
  track_inventory: z.boolean().default(true),
  quantity: z.coerce.number().min(0).default(0),
  backorderable: z.boolean().default(false),
  low_stock_threshold: z.coerce.number().min(0).default(5),
  reserved_quantity: z.coerce.number().min(0).default(0),
  max_stock: z.coerce.number().min(0).optional().nullable(),
  weight: z.coerce.number().min(0).optional().nullable(),
  weight_unit: z.string().default('kg'),
  dimensions_length: z.coerce.number().min(0).optional().nullable(),
  dimensions_width: z.coerce.number().min(0).optional().nullable(),
  dimensions_height: z.coerce.number().min(0).optional().nullable(),
  dimensions_unit: z.string().default('cm'),
  shipping_required: z.boolean().default(true),
  shipping_class: z.string().optional().nullable(),
  status: z.string().default('draft'),
  is_limited_edition: z.boolean().default(false),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_keywords: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  features: z
    .array(
      z.object({
        feature_text: z.string(),
      })
    )
    .default([]),
  variants: z
    .array(
      z.object({
        price: z.number(),
        compare_at_price: z.number().optional().nullable(),
        sku: z.string(),
        quantity: z.number(),
      })
    )
    .default([]),
  rating_average: z.number().optional().nullable(),
  rating_count: z.number().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export interface Category {
  categories_id: number;
  name: string;
}

export interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

export interface Brand {
  brands_id: number;
  name: string;
}
