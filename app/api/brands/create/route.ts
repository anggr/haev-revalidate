import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidateCustomerApp } from '@/lib/revalidateCustomerApp';
import { revalidatePath } from 'next/cache';

// Define a schema for brand creation (adjust based on your actual form/DB schema)
const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  description: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
  // Add other relevant fields like meta_title, meta_description, etc.
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
    const validation = createBrandSchema.safeParse(body);

    if (!validation.success) {
      console.error('Brand Validation Errors:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid brand data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const brandData = validation.data;
    const slug = slugify(brandData.name, { lower: true, strict: true });

    const dataToInsert = {
      ...brandData,
      slug: slug,
      // Handle nullable fields explicitly
      description: brandData.description || null,
      image_url: brandData.image_url || null,
      website: brandData.website || null,
    };

    // Insert brand
    const { data: newBrand, error: insertError } = await supabase
      .from('brands')
      .insert(dataToInsert)
      .select('brands_id, slug') // Select needed fields
      .single();

    if (insertError || !newBrand) {
      console.error('Supabase brand insert error:', insertError);
      if (insertError?.code === '23505') {
        return NextResponse.json(
          {
            error: `Brand creation failed: ${insertError.details || 'Duplicate value (e.g., name or slug) exists'}`,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Failed to create brand: ${insertError?.message}` },
        { status: 500 }
      );
    }

    // Revalidate relevant paths in customer app(s)
    const pathsToRevalidate = [
      '/', // Homepage
      '/brands', // Brands listing page (adjust path if different in customer app)
      `/brand/${newBrand.slug}`, // New brand detail page (adjust path if different)
      // Add other relevant paths, e.g., maybe a general product listing if brands are shown there?
      // '/products'
    ];
    await revalidateCustomerApp({
      paths: Array.from(new Set(pathsToRevalidate)),
    });

    // Revalidate admin paths
    revalidatePath('/brands');

    return NextResponse.json(
      { message: 'Brand created successfully', brand: newBrand },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in create brand API route:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
