import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  revalidateCustomerApp,
  getProductRelatedPaths,
} from '@/lib/revalidateCustomerApp';
import {
  productFeatureSchema,
  variantAttributeSchema,
  variantFeatureSchema,
  productVariantSchema,
  productTestimonialVideoSchema,
  productPageTestimonialSchema,
  faqItemSchema,
} from '@/app/(admin)/products/schema'; // Import related schemas

// Adjusted Zod schema to align with ProductFormValues from schema.ts
const createProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(), // Slug will be generated/validated server-side
  description: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  category_id: z.coerce.number().int().optional().nullable(), // Use coerce for client-side string-to-number
  subcategory_id: z.coerce.number().int().optional().nullable(),
  brand_id: z.coerce.number().int().optional().nullable(),
  price: z.coerce.number().min(0),
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
  shipping_class: z.string().optional().nullable(),
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
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_keywords: z.string().optional().nullable(), // Will be processed into array server-side if needed
  // Related Data Arrays
  images: z.array(z.string().url()).optional().default([]),
  features: z.array(productFeatureSchema).optional().default([]),
  variants: z.array(productVariantSchema).optional().default([]),
  testimonial_videos: z
    .array(productTestimonialVideoSchema)
    .optional()
    .default([]),
  customer_testimonials: z
    .array(productPageTestimonialSchema)
    .optional()
    .default([]),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  faqs: z.array(faqItemSchema).optional().default([]),
  // Read-only fields removed (like rating_average, rating_count)
  // featured_in_collection_slug is also included based on schema.ts
  featured_in_collection_slug: z.string().optional().nullable(),
});

// Helper type for validated data
type ValidatedProductData = z.infer<typeof createProductSchema>;

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Could not create Supabase admin client' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    // Validate the incoming data
    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      // Log the detailed validation errors for debugging
      console.error(
        'Validation Errors:',
        JSON.stringify(validation.error.errors, null, 2)
      );
      return NextResponse.json(
        { error: 'Invalid product data', details: validation.error.flatten() }, // Use flatten for better client-side display
        { status: 400 }
      );
    }

    // Use the validated data type
    const productInput: ValidatedProductData = validation.data;

    // Separate core product data from related arrays
    const {
      images,
      features,
      variants,
      testimonial_videos,
      customer_testimonials,
      tags,
      faqs,
      seo_keywords, // Handle separately if storing as array
      ...coreProductData
    } = productInput;

    // Generate slug (consider checking uniqueness here)
    const baseSlug = slugify(coreProductData.name, {
      lower: true,
      strict: true,
    });
    // Implement slug uniqueness check if necessary before insert
    // const uniqueSlug = await ensureUniqueSlug(baseSlug); // Need ensureUniqueSlug helper

    const slug = baseSlug; // For now, assume base slug is okay or implement check

    // Prepare data for Supabase insert (core product table)
    const dataToInsert = {
      ...coreProductData,
      slug: slug,
      // Ensure nulls/numbers are correct (Zod coerce helps, but double-check)
      sku: coreProductData.sku || null,
      mark: coreProductData.mark || null,
      category_id: coreProductData.category_id || null,
      brand_id: coreProductData.brand_id || null,
      subcategory_id: coreProductData.subcategory_id || null,
      compare_at_price: coreProductData.compare_at_price ?? null,
      cost_price: coreProductData.cost_price ?? null,
      initial_stock: coreProductData.initial_stock ?? null,
      max_stock: coreProductData.max_stock ?? null,
      weight: coreProductData.weight ?? null,
      weight_unit: coreProductData.weight ? coreProductData.weight_unit : null,
      dimensions_length: coreProductData.dimensions_length ?? null,
      dimensions_width: coreProductData.dimensions_width ?? null,
      dimensions_height: coreProductData.dimensions_height ?? null,
      dimensions_unit:
        coreProductData.dimensions_length ||
        coreProductData.dimensions_width ||
        coreProductData.dimensions_height
          ? coreProductData.dimensions_unit
          : null,
      shipping_class: coreProductData.shipping_class || null,
      seo_title: coreProductData.seo_title || null,
      seo_description: coreProductData.seo_description || null,
      // Convert comma-separated keywords string to array if your DB expects it
      seo_keywords: seo_keywords
        ? seo_keywords
            .split(',')
            .map((kw) => kw.trim())
            .filter((kw) => kw)
        : null,
      featured_in_collection_slug:
        coreProductData.featured_in_collection_slug || null,
      // Remove fields not in 'products' table if they exist in coreProductData by mistake
    };

    // Start database transaction (optional but recommended for multiple inserts)
    // Note: Supabase JS client doesn't directly support multi-statement transactions easily.
    // Use edge functions or database functions for true transactions if atomicity is critical.
    // For now, we proceed sequentially and handle errors individually.

    // 1. Insert the main product
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(dataToInsert)
      .select('products_id, slug, category_id, brand_id')
      .single();

    if (insertError || !newProduct) {
      console.error('Supabase insert error:', insertError);
      // Handle potential errors like unique constraint violations (e.g., slug conflict)
      if (insertError?.code === '23505') {
        // Unique violation code
        return NextResponse.json(
          {
            error: `Product creation failed: ${insertError.details || 'Duplicate value exists'}`,
          },
          { status: 409 }
        ); // Conflict
      }
      return NextResponse.json(
        { error: `Failed to create product: ${insertError?.message}` },
        { status: 500 }
      );
    }

    // --- Start Inserting Related Data ---
    const newProductId = newProduct.products_id;
    const relatedDataErrors: string[] = []; // Collect errors

    // 2. Insert Images
    if (images && images.length > 0) {
      const imagesToInsert = images.map((url, index) => ({
        product_id: newProductId,
        url,
        is_primary: index === 0,
        sort_order: index,
      }));
      const { error } = await supabase
        .from('product_images')
        .insert(imagesToInsert);
      if (error) {
        console.error('Error inserting images:', error);
        relatedDataErrors.push(`Images: ${error.message}`);
      }
    }

    // 3. Insert Product Features
    if (features && features.length > 0) {
      const featuresToInsert = features.map((f) => ({
        product_id: newProductId,
        feature_text: f.feature_text,
        // icon_url might not be in this table, based on schema.ts ProductFeature (not variant feature)
      }));
      const { error } = await supabase
        .from('product_features')
        .insert(featuresToInsert);
      if (error) {
        console.error('Error inserting product features:', error);
        relatedDataErrors.push(`Features: ${error.message}`);
      }
    }

    // 4. Insert Tags
    if (tags && tags.length > 0) {
      const tagsToInsert = tags.map((tagText) => ({
        product_id: newProductId,
        tag_text: tagText,
      }));
      const { error } = await supabase
        .from('product_tags')
        .insert(tagsToInsert);
      if (error) {
        console.error('Error inserting tags:', error);
        relatedDataErrors.push(`Tags: ${error.message}`);
      }
    }

    // 5. Insert FAQs
    if (faqs && faqs.length > 0) {
      const faqsToInsert = faqs.map((faq) => ({
        product_id: newProductId,
        question: faq.question,
        answer: faq.answer,
      }));
      const { error } = await supabase
        .from('product_faqs')
        .insert(faqsToInsert);
      if (error) {
        console.error('Error inserting FAQs:', error);
        relatedDataErrors.push(`FAQs: ${error.message}`);
      }
    }

    // 6. Insert Testimonial Videos
    if (testimonial_videos && testimonial_videos.length > 0) {
      const videosToInsert = testimonial_videos.map((video) => ({
        product_id: newProductId,
        video_url: video.video_url,
        title: video.title || null,
        description: video.description || null,
        uploader_name: video.uploader_name || null,
      }));
      const { error } = await supabase
        .from('product_testimonial_videos')
        .insert(videosToInsert);
      if (error) {
        console.error('Error inserting testimonial videos:', error);
        relatedDataErrors.push(`Testimonial Videos: ${error.message}`);
      }
    }

    // 7. Insert Customer Testimonials
    if (customer_testimonials && customer_testimonials.length > 0) {
      const testimonialsToInsert = customer_testimonials.map((test) => ({
        products_id: newProductId, // Ensure table name matches (products_id vs product_id)
        customer_name: test.customer_name,
        testimonial_text: test.testimonial_text,
        rating: test.rating ?? null,
        customer_image_url: test.customer_image_url || null,
      }));
      const { error } = await supabase
        .from('customer_testimonials')
        .insert(testimonialsToInsert);
      if (error) {
        console.error('Error inserting customer testimonials:', error);
        relatedDataErrors.push(`Customer Testimonials: ${error.message}`);
      }
    }

    // 8. Insert Variants and their nested data
    if (variants && variants.length > 0) {
      for (const variant of variants) {
        const { attributes, variant_features, ...coreVariantData } = variant;
        const variantInsertData = {
          ...coreVariantData,
          product_id: newProductId,
          price: coreVariantData.price ?? null,
          compare_at_price: coreVariantData.compare_at_price ?? null,
          sku: coreVariantData.sku ?? null,
          quantity: coreVariantData.quantity ?? null,
          image_url: coreVariantData.image_url ?? null,
          icon_url: coreVariantData.icon_url ?? null,
        };

        const { data: newVariant, error: variantError } = await supabase
          .from('product_variants')
          .insert(variantInsertData)
          .select('id')
          .single();

        if (variantError || !newVariant) {
          console.error('Error inserting variant:', variantError);
          relatedDataErrors.push(
            `Variant (${variant.name || 'Unnamed'}): ${variantError?.message || 'Failed to insert'}`
          );
          continue; // Skip attributes/features for this failed variant
        }

        const newVariantId = newVariant.id;

        // Insert Variant Attributes
        if (attributes && attributes.length > 0) {
          const attributesToInsert = attributes
            .filter((a) => a.name && a.value)
            .map((attr) => ({
              variant_id: newVariantId,
              name: attr.name,
              value: attr.value,
            }));
          if (attributesToInsert.length > 0) {
            const { error: attrError } = await supabase
              .from('variant_attributes')
              .insert(attributesToInsert);
            if (attrError) {
              console.error(
                `Error inserting attributes for variant ${newVariantId}:`,
                attrError
              );
              relatedDataErrors.push(
                `Variant Attributes (${variant.name}): ${attrError.message}`
              );
            }
          }
        }

        // Insert Variant Features
        if (variant_features && variant_features.length > 0) {
          const featuresToInsert = variant_features
            .filter((f) => f.feature_text)
            .map((feat) => ({
              variant_id: newVariantId,
              feature_text: feat.feature_text,
              icon_url: feat.icon_url ?? null,
            }));
          if (featuresToInsert.length > 0) {
            const { error: featError } = await supabase
              .from('variant_features')
              .insert(featuresToInsert);
            if (featError) {
              console.error(
                `Error inserting features for variant ${newVariantId}:`,
                featError
              );
              relatedDataErrors.push(
                `Variant Features (${variant.name}): ${featError.message}`
              );
            }
          }
        }
      }
    }
    // --- End Inserting Related Data ---

    // Trigger revalidation (fire and forget)
    const { categoryPath, brandPath } = await getProductRelatedPaths(
      newProduct.products_id
    );
    const pathsToRevalidate = [
      '/', // Homepage
      '/products', // Admin product list (or customer product list if URL is the same)
      `/products/${newProduct.slug}`, // New product page
    ];
    if (categoryPath) pathsToRevalidate.push(categoryPath);
    if (brandPath) pathsToRevalidate.push(brandPath);

    await revalidateCustomerApp({
      paths: Array.from(new Set(pathsToRevalidate)),
    });

    // Modify response based on related data errors
    const responseMessage =
      relatedDataErrors.length === 0
        ? 'Product and all related data created successfully'
        : `Product created, but errors occurred with related data: ${relatedDataErrors.join('; ')}`;

    return NextResponse.json(
      {
        message: responseMessage,
        product: newProduct,
        errors: relatedDataErrors.length > 0 ? relatedDataErrors : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in create product API route:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
