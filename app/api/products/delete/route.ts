import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  revalidateCustomerApp,
  getProductRelatedPaths,
} from '@/lib/revalidateCustomerApp';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Could not create Supabase admin client' },
      { status: 500 }
    );
  }

  try {
    const { id } = await req.json();

    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // 1. Get related paths BEFORE deleting
    const { categoryPath, brandPath } = await getProductRelatedPaths(id);

    // 2. Delete the product
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('products_id', id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      // Check for specific errors, e.g., foreign key constraint if needed
      return NextResponse.json(
        { error: `Failed to delete product: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // 3. Trigger revalidation (fire and forget, errors logged within the function)
    const pathsToRevalidate = ['/', '/products']; // Always revalidate home and product listing
    if (categoryPath) pathsToRevalidate.push(categoryPath);
    if (brandPath) pathsToRevalidate.push(brandPath);
    // Add other known listing paths if necessary

    // Use Set to remove duplicates before sending
    await revalidateCustomerApp({
      paths: Array.from(new Set(pathsToRevalidate)),
    });

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in delete product API route:', error);
    // Handle JSON parsing errors or other unexpected errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
