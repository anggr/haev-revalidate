import { z } from 'zod';

// Define schema for a single product feature (product-level)
export const productFeatureSchema = z.object({
  id: z.number().optional(), // Optional for new features
  feature_text: z.string().min(1, { message: 'Feature text cannot be empty' }),
  icon_url: z
    .string()
    .url({ message: 'Please enter a valid URL for the icon' })
    .optional()
    .or(z.literal(''))
    .nullable(),
});

// NEW: Define schema for a single variant attribute (e.g., Color: Red)
export const variantAttributeSchema = z.object({
  id: z.number().optional(), // Optional for new attributes
  name: z.string().min(1, { message: 'Attribute name cannot be empty' }), // e.g., "Color", "Size"
  value: z.string().min(1, { message: 'Attribute value cannot be empty' }), // e.g., "Red", "L"
  // variant_id is handled during submission
});

// NEW: Define schema for a single variant-specific feature
export const variantFeatureSchema = z.object({
  id: z.number().optional(), // Optional for new features
  feature_text: z
    .string()
    .min(1, { message: 'Variant feature text cannot be empty' }),
  icon_url: z
    .string()
    .url({ message: 'Please enter a valid URL for the icon' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  // variant_id is handled during submission
});

// Define schema for a single product variant (core details + nested attributes/features)
export const productVariantSchema = z.object({
  id: z.number().optional(), // Optional for new variants (this is the product_variants.id)
  name: z.string().min(1, { message: 'Variant name cannot be empty' }), // ADDED: Variant name is required
  price: z.coerce.number().min(0).optional().nullable(), // Variant-specific price override
  compare_at_price: z.coerce.number().optional().nullable(), // Variant-specific compare price
  sku: z.string().optional().nullable(), // Variant-specific SKU
  quantity: z.coerce.number().min(0).optional().nullable(), // Variant-specific quantity
  image_url: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .or(z.literal(''))
    .nullable(), // Variant-specific image URL
  icon_url: z
    .string()
    .url({ message: 'Please enter a valid URL for the icon' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  // Add other core variant-specific fields from your DB schema if needed (e.g., weight)

  // NEW: Add nested array for variant attributes
  attributes: z.array(variantAttributeSchema).optional().default([]),

  // NEW: Add nested array for variant-specific features
  variant_features: z.array(variantFeatureSchema).optional().default([]),
});

// Define schema for a single product testimonial video
export const productTestimonialVideoSchema = z.object({
  id: z.number().optional(), // Optional for existing videos during update
  video_url: z.string().url({ message: 'Please enter a valid URL' }).min(1),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  uploader_name: z.string().optional().nullable(),
  // product_id is handled during submission
});

// NEW: Define schema for a single product testimonial within the product form
export const productPageTestimonialSchema = z.object({
  id: z.number().optional(), // For identifying existing testimonials during edit
  customer_name: z
    .string()
    .min(2, { message: 'Customer name must be at least 2 characters' }),
  testimonial_text: z
    .string()
    .min(10, { message: 'Testimonial text must be at least 10 characters' }),
  rating: z.coerce
    .number()
    .min(0, { message: 'Rating must be at least 0' })
    .max(5, { message: 'Rating must be at most 5' })
    .optional()
    .nullable(),
  customer_image_url: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .or(z.literal(''))
    .nullable(),
  // product_id is implicit from the parent product form
});

// Add the schema for a single FAQ item
export const faqItemSchema = z.object({
  id: z.number().optional(), // Optional ID for existing FAQs during edits
  question: z.string().min(1, 'Question cannot be empty'),
  answer: z.string().min(1, 'Answer cannot be empty'),
});

// Add the type for a single FAQ item
export interface FaqItemValues {
  id?: number;
  question: string;
  answer: string;
}

export const productFormSchema = z
  .object({
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
    cost_price: z.coerce.number().positive().nullable().optional(),
    currency_code: z.string().default('USD'),
    initial_stock: z.coerce.number().int().min(0).nullable().optional(),
    track_inventory: z.boolean().default(true),
    quantity: z.coerce.number().min(0).default(0),
    backorderable: z.boolean().default(false),
    low_stock_threshold: z.coerce.number().min(0).default(5),
    reserved_quantity: z.coerce.number().min(0).default(0),
    max_stock: z.coerce.number().min(0).optional().nullable(),
    weight: z.coerce.number().optional().nullable(),
    weight_unit: z.string().optional().nullable(),
    dimensions_length: z.coerce.number().optional().nullable(),
    dimensions_width: z.coerce.number().optional().nullable(),
    dimensions_height: z.coerce.number().optional().nullable(),
    dimensions_unit: z.string().optional().nullable(),
    shipping_required: z.boolean().default(true),
    shipping_class: z.string().nullable(),
    status: z.enum(['active', 'draft']).default('draft'),
    mark: z
      .enum([
        'selling fast',
        'Trending now',
        'Must Have',
        'Loved by Many',
        'best seller',
        'limited edition',
      ])
      .nullable()
      .optional(),
    seo_title: z.string().nullable(),
    seo_description: z.string().nullable(),
    seo_keywords: z.string().optional().nullable(), // Stored as array, handle conversion
    images: z.array(z.string()).default([]), // Handle image fetching/updating
    rating_average: z.coerce
      .number()
      .min(0, { message: 'Rating must be positive' })
      .max(5, { message: 'Rating cannot exceed 5' })
      .optional()
      .nullable(),
    rating_count: z.coerce
      .number()
      .min(0, { message: 'Rating count must be positive' })
      .int({ message: 'Rating count must be an integer' })
      .optional()
      .nullable(),
    // Add arrays for features and variants
    features: z.array(productFeatureSchema).optional().default([]), // Product-level features
    variants: z.array(productVariantSchema).optional().default([]), // UPDATED: Uses the complex variant schema
    // Add array for testimonial videos
    testimonial_videos: z
      .array(productTestimonialVideoSchema)
      .optional()
      .default([]),
    // NEW: Add array for customer testimonials linked to this product
    customer_testimonials: z
      .array(productPageTestimonialSchema)
      .optional()
      .default([]),
    featured_in_collection_slug: z.string().optional().nullable(),
    tags: z.array(z.string().trim().min(1)).optional(),
    // Add the faqs array field
    faqs: z.array(faqItemSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.shipping_required) {
      // Only validate shipping fields if shipping is required
      if (
        data.weight !== null &&
        data.weight !== undefined &&
        data.weight < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 0,
          type: 'number',
          inclusive: true,
          message: 'Weight must be a non-negative number',
          path: ['weight'],
        });
      }

      // Validate dimensions if provided and are negative
      if (
        data.dimensions_length !== null &&
        data.dimensions_length !== undefined &&
        data.dimensions_length < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 0,
          type: 'number',
          inclusive: true,
          message: 'Length must be a non-negative number',
          path: ['dimensions_length'],
        });
      }
      if (
        data.dimensions_width !== null &&
        data.dimensions_width !== undefined &&
        data.dimensions_width < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 0,
          type: 'number',
          inclusive: true,
          message: 'Width must be a non-negative number',
          path: ['dimensions_width'],
        });
      }
      if (
        data.dimensions_height !== null &&
        data.dimensions_height !== undefined &&
        data.dimensions_height < 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 0,
          type: 'number',
          inclusive: true,
          message: 'Height must be a non-negative number',
          path: ['dimensions_height'],
        });
      }

      // Validate units if corresponding value is provided
      if (
        data.weight !== null &&
        data.weight !== undefined &&
        !data.weight_unit
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Weight unit is required when weight is provided',
          path: ['weight_unit'],
        });
      }

      const hasDimensions =
        (data.dimensions_length !== null &&
          data.dimensions_length !== undefined) ||
        (data.dimensions_width !== null &&
          data.dimensions_width !== undefined) ||
        (data.dimensions_height !== null &&
          data.dimensions_height !== undefined);

      if (hasDimensions && !data.dimensions_unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dimensions unit is required when any dimension is provided',
          path: ['dimensions_unit'],
        });
      }
    } else {
      // If shipping is not required, set all shipping-related fields to null
      data.shipping_class = null;
      data.weight = null;
      data.weight_unit = null;
      data.dimensions_length = null;
      data.dimensions_width = null;
      data.dimensions_height = null;
      data.dimensions_unit = null;
    }
  });

export type ProductFeatureValues = z.infer<typeof productFeatureSchema>;
export type VariantAttributeValues = z.infer<typeof variantAttributeSchema>; // NEW
export type VariantFeatureValues = z.infer<typeof variantFeatureSchema>; // NEW
export type ProductVariantValues = z.infer<typeof productVariantSchema>; // UPDATED
export type ProductTestimonialVideoValues = z.infer<
  typeof productTestimonialVideoSchema
>;
export type ProductPageTestimonialValues = z.infer<
  typeof productPageTestimonialSchema
>; // NEW
export type ProductFormValues = z.infer<typeof productFormSchema>; // UPDATED

// Keep related interfaces here for shared use
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

export const customerTestimonialSchema = z.object({
  id: z.number().optional(),
  customer_name: z.string().min(1, 'Customer name is required'),
  testimonial_text: z.string().min(1, 'Testimonial text is required'),
  rating: z
    .number()
    .min(0, 'Rating must be at least 0')
    .max(5, 'Rating must be at most 5')
    .nullable()
    .optional(),
  customer_image_url: z.string().url().nullable().optional(),
});
