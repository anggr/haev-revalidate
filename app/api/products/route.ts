import { type NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase client not initialized');
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || null;
    const brand = searchParams.get('brand') || null;
    const status = searchParams.get('status') || null;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('products')
      .select(
        `
        *,
        categories(categories_id, name),
        brands(name),
        product_images(url, is_primary)
      `,
        { count: 'exact' }
      )
      .order('products_id', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (brand) {
      query = query.eq('brand_id', brand);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase client not initialized');
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug || body.price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, price' },
        { status: 400 }
      );
    }

    // Insert product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
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
      })
      .select('products_id')
      .single();

    if (productError) {
      throw productError;
    }

    // If we have images, add them to product_images
    if (body.images && body.images.length > 0 && product) {
      const productImages = body.images.map((url: string, index: number) => ({
        product_id: product.products_id,
        url,
        is_primary: index === 0, // First image is primary
        sort_order: index,
      }));

      const { error: imagesError } = await supabaseAdmin
        .from('product_images')
        .insert(productImages);

      if (imagesError) {
        throw imagesError;
      }
    }

    return NextResponse.json(
      {
        message: 'Product created successfully',
        id: product.products_id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'An error occurred while creating the product',
      },
      { status: 500 }
    );
  }
}
