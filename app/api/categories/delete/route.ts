import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidateCustomerApp } from '@/lib/revalidateCustomerApp';
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type

// Schema to validate the incoming request body
const deleteCategorySchema = z.object({
  id: z.number().int(),
});

// Helper function to get slug by ID (can be shared or redefined)
async function getCategorySlugById(
  supabase: SupabaseClient,
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
    const validation = deleteCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid category ID provided',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { id: categoryId } = validation.data;

    // --- Fetch data BEFORE deleting for revalidation ---
    const { data: categoryToDelete, error: fetchError } = await supabase
      .from('categories')
      .select('slug, parent_category_id') // Select slug and parent ID
      .eq('categories_id', categoryId)
      .single();

    if (fetchError || !categoryToDelete) {
      // If fetchError and code is P0001 (not found) or similar, or !categoryToDelete, then category doesn't exist.
      // Decide if this is a 404 or should still proceed (maybe allow deleting non-existent for idempotency?)
      // For now, assume 404 if not found.
      console.error('Error fetching category data before delete:', fetchError);
      return NextResponse.json(
        { error: 'Category not found or error fetching data before deletion.' },
        { status: 404 }
      );
    }

    const slugToDelete = categoryToDelete.slug;
    const parentId = categoryToDelete.parent_category_id;

    // --- Delete the category ---
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('categories_id', categoryId);

    if (deleteError) {
      console.error('Supabase category delete error:', deleteError);
      // Handle potential foreign key constraint errors
      if (deleteError.code === '23503') {
        // Foreign key violation
        return NextResponse.json(
          {
            error: `Cannot delete category: It is referenced by other records (e.g., products, subcategories). Details: ${deleteError.details}`,
          },
          { status: 409 } // Conflict
        );
      }
      return NextResponse.json(
        { error: `Failed to delete category: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // --- Revalidate relevant paths ---
    const pathsToRevalidate = new Set<string>();
    pathsToRevalidate.add('/');
    pathsToRevalidate.add('/categories');
    if (slugToDelete) {
      pathsToRevalidate.add(`/category/${slugToDelete}`); // Add the deleted category path
    }

    // Add parent category path if it exists
    if (parentId) {
      const parentSlug = await getCategorySlugById(supabase, parentId);
      if (parentSlug) {
        pathsToRevalidate.add(`/category/${parentSlug}`);
        console.log(
          `Adding parent path for revalidation: /category/${parentSlug}`
        );
      }
    }

    if (pathsToRevalidate.size > 0) {
      console.log(
        'Revalidating paths after delete:',
        Array.from(pathsToRevalidate)
      );
      await revalidateCustomerApp({
        paths: Array.from(pathsToRevalidate),
      });
    } else {
      console.log('No paths identified for revalidation after delete.');
    }

    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in delete category API route:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
