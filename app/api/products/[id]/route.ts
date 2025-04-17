import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not initialized.');
      return NextResponse.json(
        { error: 'Internal Server Error: Database client not configured.' },
        { status: 500 }
      );
    }
    const id = params.id;

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(
        `
        *,
        categories(categories_id, name),
        brands(brands_id, name),
        product_images(id, url, alt, is_primary, sort_order)
      `
      )
      .eq('products_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'An error occurred while fetching the product',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not initialized.');
      return NextResponse.json(
        { error: 'Internal Server Error: Database client not configured.' },
        { status: 500 }
      );
    }
    const id = params.id;
    const body = await request.json();

    // Check if product exists
    const { data: existingProduct, error: checkError } = await supabaseAdmin
      .from('products')
      .select('products_id')
      .eq('products_id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      throw checkError;
    }

    // Update product
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        short_description: body.short_description || null,
        sku: body.sku || null,
        category_id: body.category_id || null,
        brand_id: body.brand_id || null,
        price: body.price,
        compare_at_price: body.compare_at_price || null,
        cost_price: body.cost_price || null,
        currency_code: body.currency_code || 'USD',
        track_inventory:
          body.track_inventory !== undefined ? body.track_inventory : true,
        quantity: body.quantity || 0,
        backorderable: body.backorderable || false,
        low_stock_threshold: body.low_stock_threshold || 5,
        status: body.status || 'draft',
        is_limited_edition: body.is_limited_edition || false,
        seo_title: body.seo_title || null,
        seo_description: body.seo_description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('products_id', id);

    if (updateError) {
      throw updateError;
    }

    // Handle images if provided
    if (body.images !== undefined) {
      // Delete existing images
      const { error: deleteImagesError } = await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', existingProduct.products_id);

      if (deleteImagesError) {
        throw deleteImagesError;
      }

      // Add new images
      if (body.images.length > 0) {
        const productImages = body.images.map((url: string, index: number) => ({
          product_id: existingProduct.products_id,
          url,
          is_primary: index === 0, // First image is primary
          sort_order: index,
        }));

        const { error: insertImagesError } = await supabaseAdmin
          .from('product_images')
          .insert(productImages);

        if (insertImagesError) {
          throw insertImagesError;
        }
      }
    }

    return NextResponse.json({
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'An error occurred while updating the product',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not initialized.');
      return NextResponse.json(
        { error: 'Internal Server Error: Database client not configured.' },
        { status: 500 }
      );
    }
    const id = params.id;

    // Check if product exists
    const { data: existingProduct, error: checkError } = await supabaseAdmin
      .from('products')
      .select('products_id')
      .eq('products_id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      throw checkError;
    }

    // Delete product (product_images will be deleted via ON DELETE CASCADE)
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('products_id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'An error occurred while deleting the product',
      },
      { status: 500 }
    );
  }
}
