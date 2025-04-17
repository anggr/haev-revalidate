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

// Adjusted Zod schema for updates, including related data
const updateProductSchema = z.object({
  products_id: z.number().int(), // ID is required for update
  name: z.string().min(2).optional(),
  slug: z.string().optional(), // Will be validated/regenerated if name changes
  description: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  sku: z.string().optional().nullable(),
  status: z.enum(['active', 'draft']).optional(),
  mark: z
    .enum([
      'selling fast',
      'Trending now',
      'Must Have',
      'Loved by Many',
      'best seller',
      'limited edition',
    ])
    .optional()
    .nullable(),
  category_id: z.coerce.number().int().optional().nullable(),
  brand_id: z.coerce.number().int().optional().nullable(),
  subcategory_id: z.coerce.number().int().optional().nullable(),
  compare_at_price: z.coerce.number().optional().nullable(),
  cost_price: z.coerce.number().positive().nullable().optional(),
  currency_code: z.string().optional(),
  initial_stock: z.coerce.number().int().min(0).nullable().optional(),
  track_inventory: z.boolean().optional(),
  backorderable: z.boolean().optional(),
  low_stock_threshold: z.coerce.number().min(0).optional(),
  reserved_quantity: z.coerce.number().min(0).optional(),
  max_stock: z.coerce.number().min(0).optional().nullable(),
  weight: z.coerce.number().optional().nullable(),
  weight_unit: z.string().optional().nullable(),
  dimensions_length: z.coerce.number().optional().nullable(),
  dimensions_width: z.coerce.number().optional().nullable(),
  dimensions_height: z.coerce.number().optional().nullable(),
  dimensions_unit: z.string().optional().nullable(),
  shipping_required: z.boolean().optional(),
  shipping_class: z.string().optional().nullable(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_keywords: z.string().optional().nullable(), // Comma-separated string from client
  // Related Data Arrays (optional because they might not be sent if unchanged, but expect full arrays for update)
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
  featured_in_collection_slug: z.string().optional().nullable(),
});

// Helper type for validated data
type ValidatedUpdateData = z.infer<typeof updateProductSchema>;

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
    const validation = updateProductSchema.safeParse(body);
    if (!validation.success) {
      console.error(
        'Validation Errors:',
        JSON.stringify(validation.error.errors, null, 2)
      );
      return NextResponse.json(
        { error: 'Invalid product data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      products_id,
      images,
      features,
      variants,
      testimonial_videos,
      customer_testimonials,
      tags,
      faqs,
      seo_keywords,
      ...coreUpdateData // Renamed from updateData to coreUpdateData
    }: ValidatedUpdateData = validation.data;

    // Regenerate slug if name changes
    let newSlug: string | undefined;
    if (coreUpdateData.name) {
      newSlug = slugify(coreUpdateData.name, { lower: true, strict: true });
      // Implement slug uniqueness check if necessary, comparing against other products
      coreUpdateData.slug = newSlug; // Add slug to the update payload
    }

    // Fetch the current slug and related paths BEFORE updating
    const { data: currentProductData, error: fetchError } = await supabase
      .from('products')
      .select('slug, category_id, brand_id')
      .eq('products_id', products_id)
      .single();

    if (fetchError || !currentProductData) {
      console.error('Error fetching current product data:', fetchError);
      return NextResponse.json(
        { error: 'Could not find product to update' },
        { status: 404 }
      );
    }

    const oldSlug = currentProductData.slug;
    const oldPaths = await getProductRelatedPaths(products_id);

    // Prepare the final update payload for the core product table
    const dataToUpdate = {
      ...coreUpdateData,
      // Ensure correct null/number handling as in create
      sku: coreUpdateData.sku !== undefined ? coreUpdateData.sku : undefined, // Only include if provided
      mark: coreUpdateData.mark !== undefined ? coreUpdateData.mark : undefined,
      category_id:
        coreUpdateData.category_id !== undefined
          ? coreUpdateData.category_id
          : undefined,
      brand_id:
        coreUpdateData.brand_id !== undefined
          ? coreUpdateData.brand_id
          : undefined,
      subcategory_id:
        coreUpdateData.subcategory_id !== undefined
          ? coreUpdateData.subcategory_id
          : undefined,
      compare_at_price:
        coreUpdateData.compare_at_price !== undefined
          ? coreUpdateData.compare_at_price
          : undefined,
      cost_price:
        coreUpdateData.cost_price !== undefined
          ? coreUpdateData.cost_price
          : undefined,
      initial_stock:
        coreUpdateData.initial_stock !== undefined
          ? coreUpdateData.initial_stock
          : undefined,
      max_stock:
        coreUpdateData.max_stock !== undefined
          ? coreUpdateData.max_stock
          : undefined,
      weight:
        coreUpdateData.weight !== undefined ? coreUpdateData.weight : undefined,
      weight_unit: coreUpdateData.weight
        ? coreUpdateData.weight_unit
        : undefined,
      dimensions_length:
        coreUpdateData.dimensions_length !== undefined
          ? coreUpdateData.dimensions_length
          : undefined,
      dimensions_width:
        coreUpdateData.dimensions_width !== undefined
          ? coreUpdateData.dimensions_width
          : undefined,
      dimensions_height:
        coreUpdateData.dimensions_height !== undefined
          ? coreUpdateData.dimensions_height
          : undefined,
      dimensions_unit:
        coreUpdateData.dimensions_length ||
        coreUpdateData.dimensions_width ||
        coreUpdateData.dimensions_height
          ? coreUpdateData.dimensions_unit
          : undefined,
      shipping_class:
        coreUpdateData.shipping_class !== undefined
          ? coreUpdateData.shipping_class
          : undefined,
      seo_title:
        coreUpdateData.seo_title !== undefined
          ? coreUpdateData.seo_title
          : undefined,
      seo_description:
        coreUpdateData.seo_description !== undefined
          ? coreUpdateData.seo_description
          : undefined,
      seo_keywords: seo_keywords
        ? seo_keywords
            .split(',')
            .map((kw) => kw.trim())
            .filter((kw) => kw)
        : undefined,
      featured_in_collection_slug:
        coreUpdateData.featured_in_collection_slug !== undefined
          ? coreUpdateData.featured_in_collection_slug
          : undefined,
      updated_at: new Date().toISOString(), // Force update timestamp
    };

    // Remove undefined keys to prevent accidentally nullifying fields
    Object.keys(dataToUpdate).forEach((key) => {
      const currentKey = key as keyof typeof dataToUpdate;
      if (dataToUpdate[currentKey] === undefined) {
        delete dataToUpdate[currentKey];
      }
    });

    // Start transaction simulation (delete old related data, update core, insert new related data)
    const relatedDataErrors: string[] = [];

    // --- Delete all existing related data first (Simpler strategy) ---

    // 1. Get IDs of variants to delete their related attributes/features
    const { data: variantIdsData, error: variantIdsError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', products_id);

    if (variantIdsError) {
      console.error(
        'Error fetching variant IDs for deletion:',
        variantIdsError
      );
      relatedDataErrors.push(
        `Failed to fetch variant IDs: ${variantIdsError.message}`
      );
      // Potentially return error early if this is critical
    }

    const variantIdsToDelete = variantIdsData?.map((v) => v.id) || [];

    // 2. Setup deletion promises
    const deletePromises = [
      supabase.from('product_images').delete().eq('product_id', products_id),
      supabase.from('product_features').delete().eq('product_id', products_id),
      supabase.from('product_tags').delete().eq('product_id', products_id),
      supabase.from('product_faqs').delete().eq('product_id', products_id),
      supabase
        .from('product_testimonial_videos')
        .delete()
        .eq('product_id', products_id),
      supabase
        .from('customer_testimonials')
        .delete()
        .eq('products_id', products_id), // Check column name!
    ];

    // Conditionally add variant attribute/feature deletions if variant IDs were fetched
    if (variantIdsToDelete.length > 0) {
      deletePromises.push(
        supabase
          .from('variant_attributes')
          .delete()
          .in('variant_id', variantIdsToDelete)
      );
      deletePromises.push(
        supabase
          .from('variant_features')
          .delete()
          .in('variant_id', variantIdsToDelete)
      );
    } else if (!variantIdsError) {
      // No variants existed, no need to delete attributes/features
      console.log(
        'No variants found for product, skipping attribute/feature deletion.'
      );
    }
    // If variantIdsError occurred, we skip deleting attributes/features to avoid partial deletion issues

    // 3. Execute deletions
    const deleteResults = await Promise.allSettled(deletePromises);
    deleteResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        // Note: Index mapping might be slightly off due to conditional pushes, consider better error source logging
        const errorMsg = `Error deleting related data group ${index}: ${result.reason?.message || 'Unknown error'}`;
        console.error(errorMsg, result.reason);
        relatedDataErrors.push(errorMsg);
      }
    });

    // 4. Conditionally delete variants themselves only if attribute/feature deletion didn't fail explicitly
    if (
      variantIdsToDelete.length > 0 &&
      !relatedDataErrors.some(
        (e) =>
          e.includes('variant_attributes') || e.includes('variant_features')
      )
    ) {
      const { error: deleteVariantsError } = await supabase
        .from('product_variants')
        .delete()
        .in('id', variantIdsToDelete); // Use the fetched IDs here too
      if (deleteVariantsError) {
        const errorMsg = `Error deleting variants: ${deleteVariantsError.message}`;
        console.error(errorMsg, deleteVariantsError);
        relatedDataErrors.push(errorMsg);
      }
    }
    // --- End Deletion Phase ---

    // --- Update Core Product --- (Do this *after* successful deletions or handle potential FK issues)
    const { error: updateError } = await supabase
      .from('products')
      .update(dataToUpdate)
      .eq('products_id', products_id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      // Handle potential errors like unique constraint violations (e.g., slug conflict)
      if (updateError?.code === '23505') {
        return NextResponse.json(
          {
            error: `Product update failed: ${updateError.details || 'Duplicate value exists'}`,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Failed to update product: ${updateError.message}` },
        { status: 500 }
      );
    }

    // --- Insert New Related Data (Similar logic as in create route) ---
    // Use products_id instead of newProductId

    // 2. Insert Images
    if (images && images.length > 0) {
      const imagesToInsert = images.map((url, index) => ({
        product_id: products_id,
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
        product_id: products_id,
        feature_text: f.feature_text,
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
        product_id: products_id,
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
        product_id: products_id,
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
        product_id: products_id,
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
        products_id: products_id,
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
          id: undefined, // Ensure we insert new variants after deletion
          product_id: products_id,
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
          continue;
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
    const newPaths = await getProductRelatedPaths(products_id); // Get potentially new paths after update
    const pathsToRevalidate = [
      '/', // Homepage
      '/products', // Product list
      `/products/${newSlug || oldSlug}`, // Updated product page (using new slug if changed)
    ];
    if (oldSlug !== newSlug) {
      // If slug changed, we might want to revalidate the old path too,
      // though it might lead to a 404 if the customer app removes pages immediately.
      // Revalidating listing pages is safer.
      // pathsToRevalidate.push(`/products/${oldSlug}`);
    }

    // Add old and new category/brand paths
    if (oldPaths.categoryPath) pathsToRevalidate.push(oldPaths.categoryPath);
    if (oldPaths.brandPath) pathsToRevalidate.push(oldPaths.brandPath);
    if (newPaths.categoryPath) pathsToRevalidate.push(newPaths.categoryPath);
    if (newPaths.brandPath) pathsToRevalidate.push(newPaths.brandPath);

    await revalidateCustomerApp({
      paths: Array.from(new Set(pathsToRevalidate)),
    });

    const responseMessage =
      relatedDataErrors.length === 0
        ? 'Product and all related data updated successfully'
        : `Product updated, but errors occurred with related data: ${relatedDataErrors.join('; ')}`;

    return NextResponse.json(
      {
        message: responseMessage,
        updatedProduct: { products_id, ...coreUpdateData }, // Return core data sent for update
        errors: relatedDataErrors.length > 0 ? relatedDataErrors : undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in update product API route:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
