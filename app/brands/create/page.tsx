'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

// Initialize all form fields with default values
const defaultValues: BrandFormValues = {
  name: '',
  slug: '',
  logo_url: '',
  long_banner_url: '',
  short_banner_url: '',
  status: 'draft',
};

export default function CreateBrandPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  async function onSubmit(data: BrandFormValues) {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        logo_url: data.logo_url || null,
        long_banner_url: data.long_banner_url || null,
        short_banner_url: data.short_banner_url || null,
      };

      const response = await fetch('/api/brands/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create brand');
      }

      toast({
        title: 'Brand created',
        description: `Brand "${data.name}" created successfully.`,
      });

      // Redirect to the brands list page after successful creation
      router.push('/brands');
      // router.refresh(); // Re-fetching is less critical now due to revalidation
    } catch (error: any) {
      console.error(
        '[CreateBrandPage:onSubmit:CatchBlock] Error creating brand:',
        error
      );
      toast({
        variant: 'destructive',
        title: 'Error Creating Brand',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Brand</h1>
          <p className="text-muted-foreground">Add a new brand to your store</p>
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
                Create Brand
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}
