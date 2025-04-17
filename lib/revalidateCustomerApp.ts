import { getSupabaseAdmin } from './supabase';

// Define the type for the payload expected by the customer app's API
interface RevalidationPayload {
  path?: string;
  paths?: string[];
}

/**
 * Triggers on-demand revalidation in one or more customer applications.
 *
 * @param payload - An object containing either a single `path` or an array of `paths` to revalidate.
 * @returns {Promise<void>} A promise that resolves when all revalidation requests have been attempted.
 */
export async function revalidateCustomerApp(
  payload: RevalidationPayload
): Promise<void> {
  const customerAppBaseUrlsString = process.env.CUSTOMER_APP_BASE_URLS; // Use the new plural variable
  const revalidationSecret = process.env.REVALIDATION_SECRET;

  if (!customerAppBaseUrlsString) {
    console.error(
      'Error: CUSTOMER_APP_BASE_URLS environment variable is not set or empty.'
    );
    return;
  }

  if (!revalidationSecret) {
    console.error(
      'Error: REVALIDATION_SECRET environment variable is not set.'
    );
    return;
  }

  // Split the comma-separated string into an array of URLs
  const customerAppBaseUrls = customerAppBaseUrlsString
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url);

  if (customerAppBaseUrls.length === 0) {
    console.warn(
      'CUSTOMER_APP_BASE_URLS environment variable contains no valid URLs after trimming.'
    );
    return;
  }

  const requests = customerAppBaseUrls.map(async (baseUrl) => {
    const revalidateUrl = `${baseUrl}/api/revalidate`;
    console.log(
      `Attempting to revalidate customer app paths: ${JSON.stringify(payload)} at ${revalidateUrl}`
    );

    try {
      const response = await fetch(revalidateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${revalidationSecret}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Revalidation failed for ${baseUrl} with status ${response.status}: ${errorBody}`
        );
      }

      const result = await response.json();
      console.log(
        `Customer app revalidation successful for ${baseUrl}:`,
        result
      );
      return { status: 'fulfilled', url: baseUrl, result };
    } catch (error: any) {
      console.error(`Error triggering revalidation for ${baseUrl}:`, error);
      // Return error information
      return { status: 'rejected', url: baseUrl, error: error.message };
    }
  });

  // Wait for all requests to settle (either succeed or fail)
  const results = await Promise.allSettled(requests);

  results.forEach((result) => {
    if (result.status === 'rejected') {
      // Log the reason for rejection if the promise itself failed (e.g., network error before catch block)
      console.error(
        `Revalidation request promise rejected for one URL: ${result.reason}`
      );
    }
    // Successful fetches (even with non-2xx status) or caught errors are handled within the map function logging
  });

  console.log(
    'Finished attempting revalidation for all configured customer apps.'
  );
}

/**
 * Helper function to get category/brand slugs for revalidation paths.
 * This assumes category/brand pages follow a '/category/[slug]' or '/brand/[slug]' pattern.
 * Adjust the path construction if the customer app uses different URL structures.
 *
 * @param productId - The ID of the product.
 * @returns {Promise<{categoryPath: string | null, brandPath: string | null}>} Paths for category and brand pages.
 */
export async function getProductRelatedPaths(
  productId: number
): Promise<{ categoryPath: string | null; brandPath: string | null }> {
  const supabase = getSupabaseAdmin(); // Use admin client for server-side access
  if (!supabase) {
    console.error('Failed to get Supabase admin client.');
    return { categoryPath: null, brandPath: null };
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      categories ( slug ),
      brands ( slug )
    `
    )
    .eq('products_id', productId)
    .single();

  if (error) {
    console.error(
      'Error fetching product category/brand slugs for revalidation:',
      error
    );
    return { categoryPath: null, brandPath: null };
  }

  // Access the first element if the relationship is inferred as an array
  const category = Array.isArray(data?.categories)
    ? data.categories[0]
    : data?.categories;
  const brand = Array.isArray(data?.brands) ? data.brands[0] : data?.brands;

  const categoryPath = category?.slug ? `/category/${category.slug}` : null;
  const brandPath = brand?.slug ? `/brand/${brand.slug}` : null;

  return { categoryPath, brandPath };
}
