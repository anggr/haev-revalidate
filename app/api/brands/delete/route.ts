import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidateCustomerApp } from '@/lib/revalidateCustomerApp';
import { revalidatePath } from 'next/cache';

// Schema to validate the incoming request body (just needs the ID)
const deleteBrandSchema = z.object({
  id: z.number().int(),
});

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
    const validation = deleteBrandSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid brand ID provided',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { id: brandId } = validation.data;

    // Optional: Fetch slug BEFORE deleting for logging or other purposes if needed
    // const { data: brandData } = await supabase.from('brands').select('slug').eq('brands_id', brandId).single();
    // const deletedSlug = brandData?.slug;

    // Delete the brand
    const { error: deleteError } = await supabase
      .from('brands')
      .delete()
      .eq('brands_id', brandId);

    if (deleteError) {
      console.error('Supabase brand delete error:', deleteError);
      // Handle potential foreign key constraint errors if brands are linked elsewhere
      if (deleteError.code === '23503') {
        // Foreign key violation
        return NextResponse.json(
          {
            error: `Cannot delete brand: It is referenced by other records (e.g., products). Details: ${deleteError.details}`,
          },
          { status: 409 }
        ); // Conflict
      }
      return NextResponse.json(
        { error: `Failed to delete brand: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // Revalidate relevant paths (cannot revalidate the deleted slug)
    const pathsToRevalidate = [
      '/', // Homepage
      '/brands', // Brands listing page
      // Add other listing pages where this brand might have appeared
      // '/products' // If products show brand info directly
    ];
    await revalidateCustomerApp({
      paths: Array.from(new Set(pathsToRevalidate)),
    });

    // Revalidate admin paths
    revalidatePath('/brands');

    return NextResponse.json(
      { message: 'Brand deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in delete brand API route:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
