import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidateCustomerApp } from '@/lib/revalidateCustomerApp';
import { revalidatePath } from 'next/cache';

// Define a schema for brand update (similar to create, but ID is required and fields are optional)
const updateBrandSchema = z.object({
  brands_id: z.number().int(), // ID is required
  name: z.string().min(1, 'Brand name cannot be empty').optional(),
  description: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
  // Add other fields...
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
    const validation = updateBrandSchema.safeParse(body);

    if (!validation.success) {
      console.error('Brand Update Validation Errors:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid brand data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { brands_id, ...updateData } = validation.data;

    // Regenerate slug if name is being updated
    let newSlug: string | undefined;
    if (updateData.name) {
      newSlug = slugify(updateData.name, { lower: true, strict: true });
      updateData.slug = newSlug;
    }

    // Fetch old slug for revalidation purposes
    const { data: oldBrandData, error: fetchError } = await supabase
      .from('brands')
      .select('slug')
      .eq('brands_id', brands_id)
      .single();

    if (fetchError || !oldBrandData) {
      console.error('Error fetching old brand slug:', fetchError);
      // Decide if this should be a 404 or just proceed without old slug revalidation
      return NextResponse.json(
        { error: 'Brand not found or error fetching slug.' },
        { status: 404 }
      );
    }
    const oldSlug = oldBrandData.slug;

    // Prepare final update payload
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined keys to prevent accidentally nullifying fields
    Object.keys(dataToUpdate).forEach((key) => {
      const currentKey = key as keyof typeof dataToUpdate;
      if (dataToUpdate[currentKey] === undefined) {
        delete dataToUpdate[currentKey];
      }
    });

    // Update brand
    const { error: updateError } = await supabase
      .from('brands')
      .update(dataToUpdate)
      .eq('brands_id', brands_id);

    if (updateError) {
      console.error('Supabase brand update error:', updateError);
      if (updateError?.code === '23505') {
        return NextResponse.json(
          {
            error: `Brand update failed: ${updateError.details || 'Duplicate value (e.g., name or slug) exists'}`,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Failed to update brand: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Revalidate relevant paths
    const pathsToRevalidate = [
      '/', // Homepage
      '/brands', // Brands listing page
      `/brand/${oldSlug}`, // Old brand detail page
    ];
    if (newSlug && newSlug !== oldSlug) {
      pathsToRevalidate.push(`/brand/${newSlug}`); // Add new brand detail page if slug changed
    }
    // Add other relevant paths...
    await revalidateCustomerApp({
      paths: Array.from(new Set(pathsToRevalidate)),
    });

    // Revalidate admin paths
    revalidatePath('/brands');
    revalidatePath(`/brands/${brands_id}/edit`);

    return NextResponse.json(
      {
        message: 'Brand updated successfully',
        updatedBrand: { brands_id, ...updateData },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in update brand API route:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
