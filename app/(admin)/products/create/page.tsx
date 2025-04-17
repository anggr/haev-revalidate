'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUploader } from '@/components/image-uploader';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { UseFormReturn, Control, UseFormWatch } from 'react-hook-form';
import { ProductGeneralForm } from './components/ProductGeneralForm';
import { ProductPricingInventoryForm } from './components/ProductPricingInventoryForm';
import { ProductShippingForm } from './components/ProductShippingForm';
import { ProductImageForm } from './components/ProductImageForm';
import { ProductSeoForm } from './components/ProductSeoForm';
import { ProductFeaturesForm } from './components/ProductFeaturesForm';
import { ProductVariantsForm } from './components/ProductVariantsForm';
import { ProductTestimonialVideoForm } from './components/ProductTestimonialVideoForm';
import { ProductCustomerTestimonialsForm } from './components/ProductCustomerTestimonialsForm';
import { ProductFaqForm } from './components/ProductFaqForm';
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

export default function CreateProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: null,
      short_description: null,
      sku: null,
      category_id: null,
      subcategory_id: null,
      brand_id: null,
      price: 0,
      compare_at_price: null,
      cost_price: null,
      currency_code: 'USD',
      initial_stock: null,
      track_inventory: true,
      quantity: 0,
      backorderable: false,
      low_stock_threshold: 5,
      reserved_quantity: 0,
      max_stock: null,
      weight: null,
      weight_unit: 'kg',
      dimensions_length: null,
      dimensions_width: null,
      dimensions_height: null,
      dimensions_unit: 'cm',
      shipping_required: true,
      shipping_class: null,
      status: 'draft',
      mark: null,
      seo_title: null,
      seo_description: null,
      seo_keywords: null,
      images: [],
      features: [],
      variants: [],
      testimonial_videos: [],
      rating_average: null,
      rating_count: null,
      customer_testimonials: [],
      featured_in_collection_slug: null,
      tags: [],
      faqs: [],
    },
  });

  const watchedCategoryId = form.watch('category_id');

  useEffect(() => {
    if (watchedCategoryId) {
      const categoryIdNum = parseInt(watchedCategoryId);
      setFilteredSubcategories(
        subcategories.filter((sub) => sub.category_id === categoryIdNum)
      );
      if (form.getValues('subcategory_id')) {
        const currentSub = subcategories.find(
          (s) => s.id.toString() === form.getValues('subcategory_id')
        );
        if (currentSub?.category_id !== categoryIdNum) {
          form.resetField('subcategory_id');
        }
      }
    } else {
      setFilteredSubcategories([]);
      form.resetField('subcategory_id');
    }
  }, [watchedCategoryId, subcategories, form]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('categories_id, name')
          .eq('status', 'active')
          .order('name');

        if (categoriesError) {
          console.error(
            '[CreateProductPage:useEffect:FetchData] Error fetching categories:',
            categoriesError
          );
          throw categoriesError;
        }
        setCategories(categoriesData || []);

        const { data: subcategoriesData, error: subcategoriesError } =
          await supabase
            .from('subcategories')
            .select('id, name, category_id')
            .order('name');

        if (subcategoriesError) {
          console.error(
            '[CreateProductPage:useEffect:FetchData] Error fetching subcategories:',
            subcategoriesError
          );
          throw subcategoriesError;
        }
        setSubcategories(subcategoriesData || []);

        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('brands_id, name')
          .eq('status', 'active')
          .order('name');

        if (brandsError) {
          console.error(
            '[CreateProductPage:useEffect:FetchData] Error fetching brands:',
            brandsError
          );
          throw brandsError;
        }
        setBrands(brandsData || []);
      } catch (error: any) {
        console.error(
          '[CreateProductPage:useEffect:FetchData] General error fetching initial data:',
          error
        );
        toast({
          variant: 'destructive',
          title: 'Failed to load data',
          description:
            error.message ||
            'There was an error loading categories, subcategories and brands.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);

    // Basic client-side validation or transformations can remain if needed
    const formattedSlug = generateSlug(values.name);
    values.slug = formattedSlug;

    // Ensure numeric fields that can be null/undefined are handled
    const payload = {
      ...values,
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
      // Remove fields not expected by the backend API if necessary
      // (e.g., rating_average, rating_count might be calculated)
    };

    // Remove calculated/read-only fields before sending
    delete payload.rating_average;
    delete payload.rating_count;

    try {
      // Call the internal API endpoint
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Use error details from the API response if available
        const errorMessage = result.error || 'Failed to create product';
        const errorDetails = result.details
          ? `: ${JSON.stringify(result.details)}`
          : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      toast({
        title: 'Product created successfully',
        description: `Product "${values.name}" has been added.`,
      });

      // Optionally redirect to the new product's edit page or the product list
      // Using the slug returned from the API if needed
      const newProductSlug = result.product?.slug || values.slug;
      router.push(`/products/${newProductSlug}/edit`); // Redirect to edit page
      // router.push('/products'); // Or redirect to list page
    } catch (error: any) {
      console.error(
        '[CreateProductPage:onSubmit] Error submitting product:',
        error
      );
      toast({
        variant: 'destructive',
        title: 'Error creating product',
        description:
          error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    return (
      name
        .trim() // Remove leading and trailing whitespace
        .toLowerCase()
        // Normalize the string to decompose accented characters into their base characters plus accents,
        // then remove the accents.
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Remove any character that is not a word character, whitespace, or dash.
        .replace(/[^\w\s-]/g, '')
        // Replace one or more whitespace characters with a single dash.
        .replace(/\s+/g, '-')
        // Collapse multiple consecutive dashes into a single dash.
        .replace(/-+/g, '-')
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
          <p className="text-muted-foreground">
            Add a new product to your catalog
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
                watchedCategoryId={watchedCategoryId || undefined}
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

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/products')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Product
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
