import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidateCustomerApp } from '@/lib/revalidateCustomerApp';
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

// Adjust schema based on your category fields (ID required, others optional)
const updateCategorySchema = z.object({
  categories_id: z.number().int(), // ID is required
  name: z.string().min(1, 'Category name cannot be empty').optional(),
  description: z.string().optional().nullable(),
  parent_category_id: z.number().int().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  icon_url: z.string().url().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
  // Add other updatable fields...
});

// Helper function to get slug by ID
async function getCategorySlugById(
  supabase: SupabaseClient, // Use SupabaseClient type
  categoryId: number | null | undefined
): Promise<string | null> {
  if (!categoryId) return null;
  const { data, error } = await supabase
    .from('categories')
    .select('slug')
    .eq('categories_id', categoryId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching slug for category ID ${categoryId}:`, error);
    return null;
  }
  return data?.slug ?? null;
}

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
    const validation = updateCategorySchema.safeParse(body);

    if (!validation.success) {
      console.error(
        'Category Update Validation Errors:',
        validation.error.errors
      );
      return NextResponse.json(
        { error: 'Invalid category data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { categories_id, ...updateData } = validation.data;

    // Fetch old slug and parent ID for revalidation purposes
    const { data: oldCategoryData, error: fetchError } = await supabase
      .from('categories')
      .select('slug, parent_category_id') // Select parent_category_id as well
      .eq('categories_id', categories_id)
      .single();

    if (fetchError || !oldCategoryData) {
      console.error('Error fetching old category data:', fetchError);
      return NextResponse.json(
        { error: 'Category not found or error fetching data.' },
        { status: 404 } // Changed to 404
      );
    }
    const oldSlug = oldCategoryData.slug;
    const oldParentId = oldCategoryData.parent_category_id; // Store old parent ID

    // Regenerate slug if name changes
    let newSlug: string | undefined;
    if (updateData.name) {
      newSlug = slugify(updateData.name, { lower: true, strict: true });
      updateData.slug = newSlug;
    }

    // Determine the new parent ID from the request data
    // Use null if explicitly provided as null, otherwise keep undefined if not provided
    const newParentId = updateData.parent_category_id; // This will be number, null, or undefined

    // Prepare final update payload, handling nullable parent_category_id
    const dataToUpdate = {
      ...updateData,
      parent_category_id: newParentId === undefined ? undefined : newParentId, // Ensure correct handling for update
      updated_at: new Date().toISOString(),
    };

    // Remove undefined keys (like parent_category_id if not provided)
    Object.keys(dataToUpdate).forEach((key) => {
      const currentKey = key as keyof typeof dataToUpdate;
      if (dataToUpdate[currentKey] === undefined) {
        delete dataToUpdate[currentKey];
      }
    });

    // Check if there's anything actually to update
    if (Object.keys(dataToUpdate).length <= 1 && !dataToUpdate.updated_at) {
      // <= 1 because updated_at is always added
      // Or check specifically if only updated_at is present
      if (Object.keys(dataToUpdate).length === 1 && dataToUpdate.updated_at) {
        console.log(
          'No fields to update besides timestamp. Skipping database call.'
        );
        // Still might need to revalidate if only status changed for example, proceed with revalidation step
      } else {
        // Genuinely nothing provided to update
        return NextResponse.json(
          { message: 'No update data provided.' },
          { status: 200 } // Or potentially 400 Bad Request if no fields are allowed
        );
      }
    } else {
      // Update category in database only if there are changes
      const { error: updateError } = await supabase
        .from('categories')
        .update(dataToUpdate)
        .eq('categories_id', categories_id);

      if (updateError) {
        console.error('Supabase category update error:', updateError);
        if (updateError?.code === '23505') {
          return NextResponse.json(
            {
              error: `Category update failed: ${updateError.details || 'Duplicate value (e.g., name or slug) exists'}`,
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: `Failed to update category: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    // --- Revalidation Logic ---
    const pathsToRevalidate = new Set<string>(); // Use a Set to avoid duplicates

    pathsToRevalidate.add('/');
    pathsToRevalidate.add('/categories');
    pathsToRevalidate.add(`/category/${oldSlug}`); // Add old category path

    if (newSlug && newSlug !== oldSlug) {
      pathsToRevalidate.add(`/category/${newSlug}`); // Add new category path if slug changed
    }

    // Check if parent category ID has changed
    const parentIdChanged =
      'parent_category_id' in updateData && oldParentId !== newParentId;

    if (parentIdChanged) {
      console.log(
        `Parent category changed from ${oldParentId} to ${newParentId}. Fetching parent slugs.`
      );
      // Fetch slugs for old and new parents concurrently
      const [oldParentSlug, newParentSlug] = await Promise.all([
        getCategorySlugById(supabase, oldParentId),
        getCategorySlugById(supabase, newParentId), // newParentId could be null
      ]);

      if (oldParentSlug) {
        pathsToRevalidate.add(`/category/${oldParentSlug}`);
        console.log(`Adding old parent path: /category/${oldParentSlug}`);
      }
      if (newParentSlug) {
        pathsToRevalidate.add(`/category/${newParentSlug}`);
        console.log(`Adding new parent path: /category/${newParentSlug}`);
      }
    }

    if (pathsToRevalidate.size > 0) {
      console.log('Revalidating paths:', Array.from(pathsToRevalidate));
      await revalidateCustomerApp({
        paths: Array.from(pathsToRevalidate), // Convert Set back to array
      });
    } else {
      console.log('No paths identified for revalidation.');
    }

    return NextResponse.json(
      {
        message: 'Category updated successfully',
        // Return the data that was intended for update, might not reflect final DB state if skipping update logic was complex
        updatedCategory: { categories_id, ...validation.data },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in update category API route:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
