'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import {
  productFormSchema,
  ProductFormValues,
  Category,
  Subcategory,
  Brand,
  ProductVariantValues,
  VariantAttributeValues,
  VariantFeatureValues,
} from '@/app/(admin)/products/schema';
import { ProductGeneralForm } from '../../create/components/ProductGeneralForm';
import { ProductPricingInventoryForm } from '../../create/components/ProductPricingInventoryForm';
import { ProductShippingForm } from '../../create/components/ProductShippingForm';
import { ProductImageForm } from '../../create/components/ProductImageForm';
import { ProductSeoForm } from '../../create/components/ProductSeoForm';
import { ProductFeaturesForm } from '@/app/(admin)/products/create/components/ProductFeaturesForm';
import { ProductVariantsForm } from '@/app/(admin)/products/create/components/ProductVariantsForm';
import { ProductTestimonialVideoForm } from '../../create/components/ProductTestimonialVideoForm';
import { ProductCustomerTestimonialsForm } from '../../create/components/ProductCustomerTestimonialsForm';
import { ProductFaqForm } from '../../create/components/ProductFaqForm';
import { UseFormReturn, Control, UseFormWatch } from 'react-hook-form';

// Define the type for tags fetched from Supabase
interface ProductTag {
  tag_text: string;
}

// Define type for Variant Feature with icon
interface VariantFeatureWithIcon {
  id: number;
  feature_text: string;
  icon_url?: string | null; // Added icon_url
}

// Define type for Variant Attribute
interface VariantAttribute {
  id: number;
  name: string;
  value: string;
}

// Define type for Variant with icon and nested data
interface ProductVariantWithDetails {
  id: number;
  name: string;
  price?: number | null;
  compare_at_price?: number | null;
  sku?: string | null;
  quantity?: number | null;
  image_url?: string | null;
  icon_url?: string | null; // Added icon_url
  variant_attributes: VariantAttribute[];
  variant_features: VariantFeatureWithIcon[];
}

interface EditProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productId, setProductId] = useState<number | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      short_description: '',
      sku: '',
      category_id: undefined,
      subcategory_id: undefined,
      brand_id: undefined,
      price: 0,
      compare_at_price: undefined,
      cost_price: undefined,
      currency_code: 'USD',
      initial_stock: undefined,
      track_inventory: true,
      quantity: 0,
      backorderable: false,
      low_stock_threshold: 5,
      reserved_quantity: 0,
      max_stock: undefined,
      weight: undefined,
      weight_unit: 'kg',
      dimensions_length: undefined,
      dimensions_width: undefined,
      dimensions_height: undefined,
      dimensions_unit: 'cm',
      shipping_required: true,
      shipping_class: '',
      status: 'draft',
      mark: null,
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      images: [],
      rating_average: undefined,
      rating_count: undefined,
      features: [],
      variants: [],
      testimonial_videos: [],
      customer_testimonials: [],
      tags: [],
      faqs: [],
    },
  });

  const watchedCategoryId = form.watch('category_id');

  // Fetch Categories, Subcategories, Brands (similar to create page)
  useEffect(() => {
    const fetchDropdownData = async () => {
      let categoriesError: any = null; // Declare outside
      let subcategoriesError: any = null; // Declare outside
      let brandsError: any = null; // Declare outside
      try {
        // Combine fetches for efficiency
        const [
          { data: categoriesData, error: catError },
          { data: subcategoriesData, error: subCatError },
          { data: brandsData, error: brandError },
        ] = await Promise.all([
          supabase
            .from('categories')
            .select('categories_id, name')
            .eq('status', 'active')
            .order('name'),
          supabase
            .from('subcategories')
            .select('id, name, category_id')
            .order('name'),
          supabase
            .from('brands')
            .select('brands_id, name')
            .eq('status', 'active')
            .order('name'),
        ]);

        // Assign errors to the outer variables
        categoriesError = catError;
        subcategoriesError = subCatError;
        brandsError = brandError;

        if (categoriesError) throw categoriesError;
        if (subcategoriesError) throw subcategoriesError;
        if (brandsError) throw brandsError;

        setCategories(categoriesData || []);
        setSubcategories(subcategoriesData || []);
        setBrands(brandsData || []);
      } catch (error: any) {
        console.error(
          '[EditProductPage:useEffect:FetchDropdownData] Error fetching dropdown data:',
          error // Log the primary error that caused the catch
        );
        // Log specific underlying errors if they exist
        if (categoriesError)
          console.error(
            'Categories fetch error:',
            JSON.stringify(categoriesError, null, 2)
          );
        if (subcategoriesError)
          console.error(
            'Subcategories fetch error:',
            JSON.stringify(subcategoriesError, null, 2)
          );
        if (brandsError)
          console.error(
            'Brands fetch error:',
            JSON.stringify(brandsError, null, 2)
          );

        toast({
          variant: 'destructive',
          title: 'Failed to load selection data',
          description:
            error.message ||
            'There was an error loading categories, subcategories and brands.',
        });
      }
    };

    fetchDropdownData();
  }, [toast]);

  // Fetch Product Data based on Slug
  useEffect(() => {
    const fetchProduct = async () => {
      if (!resolvedParams.slug) {
        console.error(
          '[EditProductPage:useEffect:FetchProduct] No slug provided'
        );
        return;
      }

      setIsLoading(true);
      try {
        console.log(
          '[EditProductPage:useEffect:FetchProduct] Starting fetch for slug:',
          resolvedParams.slug
        );
        console.log(
          '[EditProductPage:useEffect:FetchProduct] Categories:',
          categories.length
        );
        console.log(
          '[EditProductPage:useEffect:FetchProduct] Subcategories:',
          subcategories.length
        );
        console.log(
          '[EditProductPage:useEffect:FetchProduct] Brands:',
          brands.length
        );

        // First check if we can connect to Supabase
        const { data: testData, error: testError } = await supabase
          .from('products')
          .select('products_id')
          .limit(1);

        if (testError) {
          console.error(
            '[EditProductPage:useEffect:FetchProduct] Database connection test failed:',
            testError
          );
          throw new Error(`Database connection failed: ${testError.message}`);
        }

        console.log(
          '[EditProductPage:useEffect:FetchProduct] Database connection test successful'
        );

        // Now proceed with the actual product fetch
        console.log(
          '[EditProductPage:useEffect:FetchProduct] Attempting to fetch product with slug:',
          resolvedParams.slug
        );

        const { data: productData, error } = await supabase
          .from('products')
          .select(
            `
            *,
            mark,
            product_features ( id, feature_text ),
            product_variants (
              *,
              icon_url,
              variant_attributes(id, name, value),
              variant_features(id, feature_text, icon_url)
            ),
            product_images(id, url, is_primary, sort_order),
            product_testimonial_videos(id, video_url, title, description, uploader_name),
            customer_testimonials(id, customer_name, testimonial_text, rating, customer_image_url),
            product_tags ( tag_text ),
            product_faqs ( faq_id, question, answer )
          `
          )
          .eq('slug', resolvedParams.slug)
          .maybeSingle(); // Changed from .single() to .maybeSingle()

        if (error) {
          console.error(
            '[EditProductPage:useEffect:FetchProduct] Database error:',
            {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            }
          );
          throw error;
        }

        if (!productData) {
          console.error(
            '[EditProductPage:useEffect:FetchProduct] Product not found with slug:',
            resolvedParams.slug
          );
          toast({
            variant: 'destructive',
            title: 'Product Not Found',
            description: `Could not find a product with the slug "${resolvedParams.slug}". The product may have been deleted or the URL might be incorrect.`,
          });
          router.push('/products');
          return;
        }

        console.log(
          '[EditProductPage:useEffect:FetchProduct] Product found successfully:',
          {
            id: productData.products_id || productData.id,
            name: productData.name,
            slug: productData.slug,
          }
        );

        // Ensure we're using the correct ID field
        const productId = productData.products_id || productData.id;
        if (!productId) {
          console.error(
            '[EditProductPage:useEffect:FetchProduct] No product ID found in data:',
            productData
          );
          throw new Error('Product ID not found');
        }
        setProductId(productId);

        // Fetch tags separately if needed or rely on the joined data
        const fetchedTags: string[] =
          productData.product_tags?.map((tag: ProductTag) => tag.tag_text) ||
          [];

        const formData = {
          ...productData,
          category_id: productData.category_id?.toString() || undefined,
          subcategory_id: productData.subcategory_id?.toString() || undefined,
          brand_id: productData.brand_id?.toString() || undefined,
          mark: productData.mark ?? null,
          seo_keywords: productData.seo_keywords?.join(', ') || '',
          initial_stock: productData.initial_stock ?? undefined,
          rating_average: productData.rating_average ?? undefined,
          rating_count: productData.rating_count ?? undefined,
          // Handle shipping fields based on shipping_required
          shipping_class: productData.shipping_required
            ? productData.shipping_class
            : null,
          weight: productData.shipping_required ? productData.weight : null,
          weight_unit: productData.shipping_required
            ? productData.weight_unit
            : null,
          dimensions_length: productData.shipping_required
            ? productData.dimensions_length
            : null,
          dimensions_width: productData.shipping_required
            ? productData.dimensions_width
            : null,
          dimensions_height: productData.shipping_required
            ? productData.dimensions_height
            : null,
          dimensions_unit: productData.shipping_required
            ? productData.dimensions_unit
            : null,
          images:
            productData.product_images
              ?.sort(
                (a: { sort_order?: number }, b: { sort_order?: number }) =>
                  (a.sort_order ?? 0) - (b.sort_order ?? 0)
              )
              .map((img: { url: string }) => img.url) || [],
          features:
            productData.product_features?.map(
              (f: { id: number; feature_text: string }) => ({
                id: f.id,
                feature_text: f.feature_text,
              })
            ) || [],
          variants:
            productData.product_variants?.map((v: any) => ({
              id: v.id,
              name: v.name || '',
              price: v.price ?? undefined,
              compare_at_price: v.compare_at_price ?? undefined,
              sku: v.sku ?? undefined,
              quantity: v.quantity ?? undefined,
              image_url: v.image_url ?? null,
              icon_url: v.icon_url ?? null,
              attributes:
                v.variant_attributes?.map((attr: any) => ({
                  id: attr.id,
                  name: attr.name || '',
                  value: attr.value || '',
                })) || [],
              variant_features:
                v.variant_features?.map((feat: any) => ({
                  id: feat.id,
                  feature_text: feat.feature_text || '',
                  icon_url: feat.icon_url ?? null,
                })) || [],
            })) || [],
          testimonial_videos:
            productData.product_testimonial_videos?.map((video: any) => ({
              id: video.id,
              video_url: video.video_url,
              title: video.title || '',
              description: video.description || '',
              uploader_name: video.uploader_name || '',
            })) || [],
          customer_testimonials:
            productData.customer_testimonials?.map((test: any) => ({
              id: test.id,
              customer_name: test.customer_name || '',
              testimonial_text: test.testimonial_text || '',
              rating: test.rating ?? null,
              customer_image_url: test.customer_image_url || null,
            })) || [],
          tags: fetchedTags,
          faqs:
            productData.product_faqs?.map((faq: any) => ({
              id: faq.faq_id,
              question: faq.question || '',
              answer: faq.answer || '',
            })) || [],
        };

        console.log(
          '[EditProductPage:useEffect:FetchProduct] Form data prepared:',
          formData
        );

        form.reset(formData);

        if (formData.category_id) {
          const categoryIdNum = parseInt(formData.category_id);
          setFilteredSubcategories(
            subcategories.filter((sub) => sub.category_id === categoryIdNum)
          );
        } else {
          setFilteredSubcategories([]);
        }
      } catch (error: any) {
        console.error(
          '[EditProductPage:useEffect:FetchProduct] Error fetching product:',
          error,
          '\nStack trace:',
          error.stack
        );
        toast({
          variant: 'destructive',
          title: 'Failed to load product data',
          description: error.message || 'Product not found or error fetching.',
        });
        router.push('/products');
      } finally {
        setIsLoading(false);
      }
    };

    if (
      categories.length > 0 &&
      subcategories.length > 0 &&
      brands.length > 0
    ) {
      console.log(
        '[EditProductPage:useEffect] All required data is loaded, fetching product'
      );
      fetchProduct();
    } else {
      console.log('[EditProductPage:useEffect] Waiting for required data:', {
        categories: categories.length,
        subcategories: subcategories.length,
        brands: brands.length,
      });
    }
  }, [
    resolvedParams.slug,
    categories,
    subcategories,
    brands,
    form,
    router,
    toast,
    supabase,
  ]);

  useEffect(() => {
    if (watchedCategoryId) {
      const categoryIdNum = parseInt(watchedCategoryId);
      setFilteredSubcategories(
        subcategories.filter((sub) => sub.category_id === categoryIdNum)
      );
      const currentSubId = form.getValues('subcategory_id');
      if (currentSubId) {
        const currentSub = subcategories.find(
          (s) => s.id.toString() === currentSubId
        );
        if (currentSub && currentSub.category_id !== categoryIdNum) {
          form.setValue('subcategory_id', undefined, { shouldValidate: true });
        }
      }
    } else {
      setFilteredSubcategories([]);
      form.setValue('subcategory_id', undefined, { shouldValidate: true });
    }
  }, [watchedCategoryId, subcategories, form]);

  const generateSlug = (name: string) => {
    // Convert to lowercase and remove special characters except hyphens
    let slug = name
      .toLowerCase()
      .trim()
      // Replace any special characters (except letters, numbers, spaces, and hyphens) with empty string
      .replace(/[^\w\s-]/g, '')
      // Replace multiple spaces or hyphens with a single hyphen
      .replace(/[\s_-]+/g, '-')
      // Remove any leading or trailing hyphens
      .replace(/^-+|-+$/g, '');

    return slug;
  };

  // Watch product name to auto-generate slug
  useEffect(() => {
    const name = form.watch('name');
    const currentSlug = form.watch('slug');

    // Only auto-generate slug if the slug field is empty or hasn't been manually edited
    if (name && (!currentSlug || currentSlug === '')) {
      const generatedSlug = generateSlug(name);
      form.setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [form.watch('name')]);

  // Function to ensure slug uniqueness
  const ensureUniqueSlug = async (
    baseSlug: string,
    currentProductId?: number
  ) => {
    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('products_id')
        .eq('slug', slug)
        .neq('products_id', currentProductId || 0)
        .maybeSingle();

      if (!existingProduct) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    return slug;
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!productId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Product ID is missing. Cannot update.',
      });
      return;
    }

    setIsSubmitting(true);

    // Apply generateSlug to ensure the slug is correctly formatted if name changed
    if (form.formState.dirtyFields.name) {
      values.slug = generateSlug(values.name);
    } else {
      values.slug = form.getValues('slug'); // Keep original slug if name didn't change
    }

    // Prepare payload, ensuring correct types and including product ID
    const payload = {
      ...values,
      products_id: productId, // Include the product ID
      price: Number(values.price) || 0,
      compare_at_price: values.compare_at_price
        ? Number(values.compare_at_price)
        : null,
      cost_price: values.cost_price ? Number(values.cost_price) : null,
      initial_stock: values.initial_stock ? Number(values.initial_stock) : null,
      quantity: Number(values.quantity) || 0,
      low_stock_threshold: values.low_stock_threshold
        ? Number(values.low_stock_threshold)
        : null,
      reserved_quantity: values.reserved_quantity
        ? Number(values.reserved_quantity)
        : null,
      max_stock: values.max_stock ? Number(values.max_stock) : null,
      weight: values.weight ? Number(values.weight) : null,
      dimensions_length: values.dimensions_length
        ? Number(values.dimensions_length)
        : null,
      dimensions_width: values.dimensions_width
        ? Number(values.dimensions_width)
        : null,
      dimensions_height: values.dimensions_height
        ? Number(values.dimensions_height)
        : null,
      category_id: values.category_id ? parseInt(values.category_id, 10) : null,
      subcategory_id: values.subcategory_id
        ? parseInt(values.subcategory_id, 10)
        : null,
      brand_id: values.brand_id ? parseInt(values.brand_id, 10) : null,
      // Remove fields not meant for direct update or calculated fields
    };

    // Remove fields that shouldn't be sent in the update
    delete payload.rating_average;
    delete payload.rating_count;
    // Add any other fields that are managed separately or read-only

    try {
      // Call the internal API endpoint
      const response = await fetch('/api/products/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to update product';
        const errorDetails = result.details
          ? `: ${JSON.stringify(result.details)}`
          : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      toast({
        title: 'Product updated successfully',
        description: `Product "${values.name}" has been updated.`,
      });

      // If the slug changed, we might need to redirect to the new slug URL
      const updatedSlug = result.updatedProduct?.slug || values.slug;
      if (resolvedParams.slug !== updatedSlug) {
        router.push(`/products/${updatedSlug}/edit`);
      } else {
        // Optionally refresh data if staying on the same page
        // router.refresh();
      }
    } catch (error: any) {
      console.error(
        '[EditProductPage:onSubmit] Error submitting product update:',
        error
      );
      toast({
        variant: 'destructive',
        title: 'Error updating product',
        description:
          error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">
            Update the details for this product
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>

      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="testimonial_videos">
                Testimonial Videos
              </TabsTrigger>
              <TabsTrigger value="customer_testimonials">
                Customer Testimonials
              </TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <ProductGeneralForm
                form={form}
                categories={categories}
                filteredSubcategories={filteredSubcategories}
                brands={brands}
                isLoading={isLoading}
                generateSlug={generateSlug}
                watchedCategoryId={watchedCategoryId ?? undefined}
              />
            </TabsContent>

            <TabsContent value="variants" className="space-y-6">
              <ProductVariantsForm form={form} />
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <ProductFeaturesForm form={form} />
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <ProductPricingInventoryForm form={form} />
            </TabsContent>

            <TabsContent value="shipping" className="space-y-6">
              <ProductShippingForm form={form} />
            </TabsContent>

            <TabsContent value="images" className="space-y-6">
              <ProductImageForm form={form} />
            </TabsContent>

            <TabsContent value="testimonial_videos" className="space-y-6">
              <ProductTestimonialVideoForm form={form} />
            </TabsContent>

            <TabsContent value="customer_testimonials" className="space-y-6">
              <ProductCustomerTestimonialsForm form={form} />
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <ProductSeoForm form={form} />
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <ProductFaqForm form={form} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
