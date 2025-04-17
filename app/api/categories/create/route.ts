import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { getSupabaseAdmin } from '@/lib/supabase';
import { revalidateCustomerApp } from '@/lib/revalidateCustomerApp';

// Adjust schema based on your category fields
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional().nullable(),
  parent_category_id: z.number().int().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  icon_url: z.string().url().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
  // Add meta fields, etc.
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
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      console.error('Category Validation Errors:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid category data', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const categoryData = validation.data;
    const slug = slugify(categoryData.name, { lower: true, strict: true });

    const dataToInsert = {
      ...categoryData,
      slug: slug,
      description: categoryData.description || null,
      parent_category_id: categoryData.parent_category_id || null,
      image_url: categoryData.image_url || null,
      icon_url: categoryData.icon_url || null,
    };

    // Insert category
    const { data: newCategory, error: insertError } = await supabase
      .from('categories')
      .insert(dataToInsert)
      .select('categories_id, slug') // Adjust select as needed
      .single();

    if (insertError || !newCategory) {
      console.error('Supabase category insert error:', insertError);
      if (insertError?.code === '23505') {
        return NextResponse.json(
          {
            error: `Category creation failed: ${insertError.details || 'Duplicate value (e.g., name or slug) exists'}`,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Failed to create category: ${insertError?.message}` },
        { status: 500 }
      );
    }

    // Revalidate relevant paths
    const pathsToRevalidate = [
      '/',
      '/categories',
      `/category/${newCategory.slug}`,
      // Add other relevant paths...
    ];
    await revalidateCustomerApp({
      paths: Array.from(new Set(pathsToRevalidate)),
    });

    return NextResponse.json(
      { message: 'Category created successfully', category: newCategory },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in create category API route:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}
