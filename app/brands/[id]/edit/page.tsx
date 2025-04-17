'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { use } from 'react';

import AdminLayout from '@/components/admin-layout';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const brandFormSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  long_banner_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  short_banner_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'draft']),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;
export default function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params) as { id: string };
  const brandId = resolvedParams.id;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      logo_url: '',
      long_banner_url: '',
      short_banner_url: '',
      status: 'draft',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    async function fetchBrand() {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .eq('brands_id', brandId)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            name: data.name ?? '',
            slug: data.slug ?? '',
            logo_url: data.logo_url ?? '',
            long_banner_url: data.long_banner_url ?? '',
            short_banner_url: data.short_banner_url ?? '',
            status: data.status ?? 'draft',
          });
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error fetching brand',
          description: error.message,
        });
        router.push('/brands');
      } finally {
        setIsFetching(false);
      }
    }

    fetchBrand();
  }, [brandId, form, router, toast]);

  async function onSubmit(data: BrandFormValues) {
    setIsLoading(true);
    try {
      const payload = {
        brands_id: parseInt(brandId, 10), // Ensure ID is a number
        ...data,
        logo_url: data.logo_url || null,
        long_banner_url: data.long_banner_url || null,
        short_banner_url: data.short_banner_url || null,
      };

      const response = await fetch('/api/brands/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update brand');
      }

      toast({
        title: 'Brand updated',
        description: 'The brand has been updated successfully.',
      });

      // Redirect to the brands list page after successful update
      router.push('/brands');
      // router.refresh();
    } catch (error: any) {
      console.error(
        '[EditBrandPage:onSubmit:CatchBlock] Error updating brand:',
        error
      );
      toast({
        variant: 'destructive',
        title: 'Error Updating Brand',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Brand</h1>
          <p className="text-muted-foreground">Update brand information</p>
        </div>

        <div className="max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter brand name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of your brand as it will appear in your store.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="enter-brand-slug" {...field} />
                    </FormControl>
                    <FormDescription>
                      The URL-friendly version of the brand name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A direct URL to your brand&apos;s logo image (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="long_banner_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Long Banner URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/long_banner.png"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A direct URL to your brand&apos;s long banner image
                      (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="short_banner_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Banner URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/short_banner.png"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A direct URL to your brand&apos;s short banner image
                      (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set whether this brand is active or in draft mode.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Brand
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}
