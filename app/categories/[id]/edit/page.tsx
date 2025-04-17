'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, X, Trash2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Category {
  categories_id: number;
  name: string;
  slug: string | null;
  created_at: string;
  status: 'active' | 'draft';
  display_order: number;
  long_banner_url?: string | null;
  short_banner_url?: string | null;
}

interface Subcategory {
  id: number;
  name: string;
  slug: string | null;
  category_id: number;
  created_at: string;
  status: 'active' | 'draft';
  display_order: number;
}

interface ManagedSubcategory extends Subcategory {
  tempId: string;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

async function uploadFileToSupabase(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    console.error(
      'Error getting public URL for path:',
      path,
      'Data:',
      publicUrlData
    );
    throw new Error('Failed to get public URL for uploaded file.');
  }

  return publicUrlData.publicUrl;
}

async function deleteFileFromSupabase(
  bucket: string,
  path: string
): Promise<void> {
  const urlParts = path.split('/');
  const filePathInBucket = urlParts
    .slice(urlParts.indexOf(bucket) + 1)
    .join('/');

  console.log(
    `Attempting to delete file from bucket '${bucket}' at path: '${filePathInBucket}'`
  );

  if (!filePathInBucket) {
    console.warn('Could not extract file path from URL:', path);
    return;
  }

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePathInBucket]);
    if (error) {
      console.error(
        `Error deleting file '${filePathInBucket}' from bucket '${bucket}':`,
        error
      );
    } else {
      console.log(
        `Successfully deleted file '${filePathInBucket}' from bucket '${bucket}'`
      );
    }
  } catch (catchError) {
    console.error(
      `Caught exception while deleting file '${filePathInBucket}' from bucket '${bucket}':`,
      catchError
    );
  }
}

const BUCKET_NAME = 'haev-ecommerce-files';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const categoryFormSchema = z
  .object({
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug must be at least 2 characters'),
    status: z.enum(['active', 'draft']),
    display_order: z
      .number()
      .int()
      .min(0, 'Display order must be 0 or greater')
      .default(0),
    short_banner_file: z
      .instanceof(File)
      .optional()
      .nullable()
      .refine(
        (file) => !file || file.size <= MAX_FILE_SIZE,
        `Max image size is 5MB.`
      )
      .refine(
        (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
        'Only .jpg, .jpeg, .png and .webp formats are supported.'
      ),
    long_banner_file: z
      .instanceof(File)
      .optional()
      .nullable()
      .refine(
        (file) => !file || file.size <= MAX_FILE_SIZE,
        `Max image size is 5MB.`
      )
      .refine(
        (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
        'Only .jpg, .jpeg, .png and .webp formats are supported.'
      ),
    short_banner_url: z
      .string()
      .url({ message: 'Please enter a valid URL.' })
      .optional()
      .or(z.literal(''))
      .nullable(),
    long_banner_url: z
      .string()
      .url({ message: 'Please enter a valid URL.' })
      .optional()
      .or(z.literal(''))
      .nullable(),
  })
  .refine((data) => {
    return true;
  }, {});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function makeUniqueCategorySlug(
  baseSlug: string,
  categoryIdToExclude?: number
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    let query = supabase.from('categories').select('slug').eq('slug', slug);

    if (categoryIdToExclude) {
      query = query.neq('categories_id', categoryIdToExclude);
    }

    const { data } = await query.maybeSingle();

    if (!data) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  return slug;
}

async function makeUniqueSubcategorySlug(
  baseSlug: string,
  categoryId: number,
  subcategoryIdToExclude?: number
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    let query = supabase
      .from('subcategories')
      .select('slug')
      .eq('slug', slug)
      .eq('category_id', categoryId);

    if (subcategoryIdToExclude) {
      query = query.neq('id', subcategoryIdToExclude);
    }

    const { data } = await query.maybeSingle();

    if (!data) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  return slug;
}

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const categoryId = parseInt(id, 10);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [shortBannerPreview, setShortBannerPreview] = useState<string | null>(
    null
  );
  const [longBannerPreview, setLongBannerPreview] = useState<string | null>(
    null
  );
  const [originalShortBannerUrl, setOriginalShortBannerUrl] = useState<
    string | null
  >(null);
  const [originalLongBannerUrl, setOriginalLongBannerUrl] = useState<
    string | null
  >(null);

  const [subcategories, setSubcategories] = useState<ManagedSubcategory[]>([]);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryOrder, setNewSubcategoryOrder] = useState(0);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      status: 'draft',
      display_order: 0,
      short_banner_file: undefined,
      long_banner_file: undefined,
      short_banner_url: '',
      long_banner_url: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    async function fetchCategoryAndSubcategories() {
      if (isNaN(categoryId)) {
        toast({ title: 'Invalid Category ID', variant: 'destructive' });
        setIsFetching(false);
        router.push('/categories');
        return;
      }
      setIsFetching(true);
      try {
        console.log('Fetching category and subcategories for ID:', categoryId);

        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select(
            'categories_id, name, slug, status, display_order, short_banner_url, long_banner_url'
          )
          .eq('categories_id', categoryId)
          .single();

        if (categoryError || !categoryData) {
          console.error(
            '[EditCategoryPage:Fetch] Error fetching category or category not found:',
            { categoryId, error: categoryError }
          );
          toast({
            title: 'Error Fetching Category',
            description: categoryError?.message || 'Category not found.',
            variant: 'destructive',
          });
          router.push('/categories');
          return;
        }

        console.log('Category data fetched:', categoryData);

        form.reset({
          name: categoryData.name,
          slug: categoryData.slug || '',
          status: categoryData.status as 'active' | 'draft',
          display_order: categoryData.display_order,
          short_banner_url: categoryData.short_banner_url || '',
          long_banner_url: categoryData.long_banner_url || '',
          short_banner_file: undefined,
          long_banner_file: undefined,
        });
        setOriginalShortBannerUrl(categoryData.short_banner_url);
        setOriginalLongBannerUrl(categoryData.long_banner_url);
        setShortBannerPreview(categoryData.short_banner_url);
        setLongBannerPreview(categoryData.long_banner_url);

        const { data: subcategoryData, error: subcategoryError } =
          await supabase
            .from('subcategories')
            .select('*')
            .eq('category_id', categoryId)
            .order('display_order', { ascending: true });

        if (subcategoryError) {
          console.error(
            '[EditCategoryPage:Fetch] Error fetching subcategories:',
            { categoryId, error: subcategoryError }
          );
          toast({
            title: 'Warning',
            description: 'Could not load existing subcategories.',
            variant: 'default',
          });
          setSubcategories([]);
        } else {
          console.log('Subcategories fetched:', subcategoryData);
          const managedSubs = subcategoryData.map(
            (sub): ManagedSubcategory => ({
              ...sub,
              status: sub.status as 'active' | 'draft',
              tempId: crypto.randomUUID(),
              isNew: false,
              isModified: false,
              isDeleted: false,
            })
          );
          setSubcategories(managedSubs);
        }
      } catch (error: any) {
        console.error('[EditCategoryPage:Fetch] General fetch error:', error);
        toast({
          title: 'Error Loading Page',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
        router.push('/categories');
      } finally {
        setIsFetching(false);
      }
    }

    fetchCategoryAndSubcategories();
  }, [categoryId, form, router, toast]);

  const handleSubcategoryChange = (
    tempId: string,
    field: keyof Omit<
      ManagedSubcategory,
      'tempId' | 'id' | 'category_id' | 'created_at'
    >,
    value: any
  ) => {
    setSubcategories((currentSubs) =>
      currentSubs.map((sub) => {
        if (sub.tempId === tempId) {
          let updatedValue = value;
          if (field === 'display_order') {
            updatedValue = parseInt(value, 10) || 0;
          }
          return { ...sub, [field]: updatedValue, isModified: !sub.isNew };
        }
        return sub;
      })
    );
  };

  const handleDeleteExistingSubcategory = (tempId: string) => {
    setSubcategories((currentSubs) =>
      currentSubs.map((sub) =>
        sub.tempId === tempId
          ? { ...sub, isDeleted: true, isModified: true }
          : sub
      )
    );
    toast({
      title: 'Subcategory marked for deletion',
      description: 'Changes will be saved upon submitting the form.',
    });
  };

  const handleAddNewSubcategory = () => {
    if (newSubcategoryName.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Subcategory name required',
      });
      return;
    }
    const newSub: ManagedSubcategory = {
      id: 0,
      name: newSubcategoryName.trim(),
      slug: null,
      category_id: categoryId,
      created_at: new Date().toISOString(),
      status: form.getValues('status'),
      display_order: newSubcategoryOrder,
      tempId: crypto.randomUUID(),
      isNew: true,
      isModified: false,
      isDeleted: false,
    };
    setSubcategories([...subcategories, newSub]);
    setNewSubcategoryName('');
    setNewSubcategoryOrder(0);
  };

  const handleRemoveNewSubcategory = (tempId: string) => {
    setSubcategories(subcategories.filter((sub) => sub.tempId !== tempId));
  };

  async function onSubmit(data: CategoryFormValues) {
    setIsLoading(true);
    try {
      console.log('Submitting category update for ID:', categoryId);
      console.log('Form data:', data);
      console.log('Subcategory state:', subcategories);

      let finalSlug = data.slug;
      const originalCategory = await supabase
        .from('categories')
        .select('slug, name')
        .eq('categories_id', categoryId)
        .single();

      if (!originalCategory.data)
        throw new Error('Original category not found during submit.');

      if (data.name !== originalCategory.data.name || !data.slug) {
        const baseSlug = generateSlug(data.name);
        finalSlug = await makeUniqueCategorySlug(baseSlug, categoryId);
        console.log(`Generated new unique slug: ${finalSlug}`);
      } else if (data.slug !== originalCategory.data.slug) {
        finalSlug = await makeUniqueCategorySlug(data.slug, categoryId);
        if (finalSlug !== data.slug) {
          console.log(`Manual slug changed to unique: ${finalSlug}`);
        }
      }

      let finalShortBannerUrl: string | null = originalShortBannerUrl;
      let finalLongBannerUrl: string | null = originalLongBannerUrl;
      const filesToDelete: string[] = [];

      if (data.short_banner_file) {
        if (originalShortBannerUrl) filesToDelete.push(originalShortBannerUrl);
        const file = data.short_banner_file;
        const filePath = `category-banners/${finalSlug}-short-${Date.now()}.${file.name.split('.').pop()}`;
        finalShortBannerUrl = await uploadFileToSupabase(
          file,
          BUCKET_NAME,
          filePath
        );
      } else if (data.short_banner_url !== originalShortBannerUrl) {
        if (
          originalShortBannerUrl &&
          originalShortBannerUrl !== data.short_banner_url
        ) {
          filesToDelete.push(originalShortBannerUrl);
        }
        finalShortBannerUrl = data.short_banner_url || null;
      }

      if (data.long_banner_file) {
        if (originalLongBannerUrl) filesToDelete.push(originalLongBannerUrl);
        const file = data.long_banner_file;
        const filePath = `category-banners/${finalSlug}-long-${Date.now()}.${file.name.split('.').pop()}`;
        finalLongBannerUrl = await uploadFileToSupabase(
          file,
          BUCKET_NAME,
          filePath
        );
      } else if (data.long_banner_url !== originalLongBannerUrl) {
        if (
          originalLongBannerUrl &&
          originalLongBannerUrl !== data.long_banner_url
        ) {
          filesToDelete.push(originalLongBannerUrl);
        }
        finalLongBannerUrl = data.long_banner_url || null;
      }

      const { error: updateError } = await supabase
        .from('categories')
        .update({
          name: data.name,
          slug: finalSlug,
          status: data.status,
          display_order: data.display_order,
          short_banner_url: finalShortBannerUrl,
          long_banner_url: finalLongBannerUrl,
        })
        .eq('categories_id', categoryId);

      if (updateError) {
        console.error('Error updating category:', updateError);
        throw new Error(`Category update failed: ${updateError.message}`);
      }
      console.log('Category updated successfully.');

      if (filesToDelete.length > 0) {
        console.log('Deleting old banner files:', filesToDelete);
        const deletionResults = await Promise.allSettled(
          filesToDelete.map((url) => deleteFileFromSupabase(BUCKET_NAME, url))
        );
        deletionResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(
              `Failed to delete banner ${filesToDelete[index]}:`,
              result.reason
            );
          }
        });
      }

      const subcategoryPromises: Promise<any>[] = [];
      const subcategoryErrors: string[] = [];

      for (const sub of subcategories) {
        try {
          if (sub.isNew && !sub.isDeleted) {
            console.log('Creating new subcategory:', sub.name);
            const baseSlug = generateSlug(sub.name);
            const uniqueSlug = await makeUniqueSubcategorySlug(
              baseSlug,
              categoryId
            );
            const { error } = await supabase.from('subcategories').insert({
              name: sub.name,
              slug: uniqueSlug,
              category_id: categoryId,
              display_order: sub.display_order,
              status: sub.status,
            });
            if (error)
              throw new Error(
                `Create failed for '${sub.name}': ${error.message}`
              );
          } else if (sub.isModified && !sub.isNew && !sub.isDeleted) {
            console.log('Updating existing subcategory ID:', sub.id);
            let subSlug = sub.slug;

            const { data: originalSub, error: fetchError } = await supabase
              .from('subcategories')
              .select('name, slug')
              .eq('id', sub.id)
              .single();

            if (fetchError) {
              console.warn(
                `Could not fetch original data for subcategory ID ${sub.id}: ${fetchError.message}`
              );
            } else if (originalSub && sub.name !== originalSub.name) {
              const baseSlug = generateSlug(sub.name);
              subSlug = await makeUniqueSubcategorySlug(
                baseSlug,
                categoryId,
                sub.id
              );
              console.log(`Subcategory ${sub.id} slug updated to: ${subSlug}`);
            }

            const { error: updateSubError } = await supabase
              .from('subcategories')
              .update({
                name: sub.name,
                slug: subSlug,
                display_order: sub.display_order,
                status: sub.status,
              })
              .eq('id', sub.id);
            if (updateSubError)
              throw new Error(
                `Update failed for '${sub.name}' (ID: ${sub.id}): ${updateSubError.message}`
              );
          } else if (sub.isDeleted && !sub.isNew) {
            console.log('Deleting existing subcategory ID:', sub.id);
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('products_id')
              .eq('subcategory_id', sub.id)
              .limit(1);

            if (productsError) {
              throw new Error(
                `Failed to check products for subcategory '${sub.name}': ${productsError.message}`
              );
            }
            if (products && products.length > 0) {
              throw new Error(
                `Cannot delete subcategory '${sub.name}' as it has associated products.`
              );
            }

            const { error: deleteSubError } = await supabase
              .from('subcategories')
              .delete()
              .eq('id', sub.id);
            if (deleteSubError)
              throw new Error(
                `Delete failed for '${sub.name}' (ID: ${sub.id}): ${deleteSubError.message}`
              );
          }
        } catch (subError: any) {
          console.error(
            `Error processing subcategory '${sub.name}':`,
            subError
          );
          subcategoryErrors.push(
            subError.message ||
              'An unknown error occurred processing a subcategory.'
          );
        }
      }

      if (subcategoryErrors.length > 0) {
        toast({
          title: `Category Updated, but ${subcategoryErrors.length} Subcategory Error(s) Occurred`,
          description: `Please review the subcategories. Errors: ${subcategoryErrors.join('; ')}`,
          variant: 'destructive',
          duration: 9000,
        });
      } else {
        toast({
          title: 'Category Updated',
          description: 'Category and subcategories saved successfully.',
        });
      }

      router.push('/categories');
      router.refresh();
    } catch (error: any) {
      console.error(
        '[EditCategoryPage:onSubmit] Main Catch Block Error:',
        error
      );
      toast({
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
          <p className="text-muted-foreground">Update your category details</p>
        </div>

        <div className="max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of your category as it will appear in your store.
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
                      <Input placeholder="enter-category-slug" {...field} />
                    </FormControl>
                    <FormDescription>
                      The URL-friendly version of the category name. Cannot be
                      changed after products are added.
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The status of the category in your store.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter display order (0 or greater)"
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(
                            e.target.value === ''
                              ? 0
                              : parseInt(e.target.value, 10)
                          );
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Controls the order categories appear in lists. Lower
                      numbers appear first.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium">Short Banner</h3>
                <p className="text-sm text-muted-foreground">
                  Current:{' '}
                  {originalShortBannerUrl ? (
                    <a
                      href={originalShortBannerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline truncate max-w-xs inline-block"
                    >
                      {originalShortBannerUrl}
                    </a>
                  ) : (
                    'None'
                  )}
                  . Provide a file OR URL to replace. Upload takes precedence.
                  Clear both to remove.
                </p>
                <FormField
                  control={form.control}
                  name="short_banner_file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Replace with File (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          ref={field.ref}
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            field.onChange(file ?? null);
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setShortBannerPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                              form.setValue('short_banner_url', '');
                            } else {
                              setShortBannerPreview(
                                form.getValues('short_banner_url') ||
                                  originalShortBannerUrl
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="short_banner_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Or Replace with URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/banner.jpg"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e);
                            const urlValue = e.target.value;
                            setShortBannerPreview(
                              urlValue ||
                                (form.getValues('short_banner_file')
                                  ? shortBannerPreview
                                  : null)
                            );
                            if (urlValue) {
                              field.onChange(e);
                              setShortBannerPreview(urlValue);
                              form.setValue('short_banner_file', null);
                            } else {
                              field.onChange(e);
                              const currentFile =
                                form.getValues('short_banner_file');
                              if (!currentFile) {
                                setShortBannerPreview(null);
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {shortBannerPreview && (
                  <div className="relative group mt-2">
                    <p className="text-sm font-medium mb-1">Preview:</p>
                    <img
                      src={shortBannerPreview}
                      alt="Banner Preview"
                      className="h-16 w-auto object-contain rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        form.setValue('short_banner_file', null);
                        form.setValue('short_banner_url', '');
                        setShortBannerPreview(null);
                      }}
                      aria-label="Remove short banner"
                      title="Remove banner (clears file and URL)"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium">Long Banner</h3>
                <p className="text-sm text-muted-foreground">
                  Current:{' '}
                  {originalLongBannerUrl ? (
                    <a
                      href={originalLongBannerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline truncate max-w-xs inline-block"
                    >
                      {originalLongBannerUrl}
                    </a>
                  ) : (
                    'None'
                  )}
                  . Provide a file OR URL to replace. Upload takes precedence.
                  Clear both to remove.
                </p>
                <FormField
                  control={form.control}
                  name="long_banner_file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Replace with File (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          ref={field.ref}
                          name={field.name}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            field.onChange(file ?? null);
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setLongBannerPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                              form.setValue('long_banner_url', '');
                            } else {
                              setLongBannerPreview(
                                form.getValues('long_banner_url') ||
                                  originalLongBannerUrl
                              );
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="long_banner_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Or Replace with URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/long_banner.png"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e);
                            const urlValue = e.target.value;
                            if (urlValue) {
                              setLongBannerPreview(urlValue);
                              form.setValue('long_banner_file', null);
                            } else {
                              const currentFile =
                                form.getValues('long_banner_file');
                              if (!currentFile) {
                                setLongBannerPreview(null);
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {longBannerPreview && (
                  <div className="relative group mt-2">
                    <p className="text-sm font-medium mb-1">Preview:</p>
                    <img
                      src={longBannerPreview}
                      alt="Banner Preview"
                      className="h-16 w-auto object-contain rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-0 right-0 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        form.setValue('long_banner_file', null);
                        form.setValue('long_banner_url', '');
                        setLongBannerPreview(null);
                      }}
                      aria-label="Remove long banner"
                      title="Remove banner (clears file and URL)"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* --- Subcategories Management --- */}
              <Separator className="my-6" />
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Manage Subcategories</h3>

                {/* Existing Subcategories */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">
                    Existing Subcategories
                  </h4>
                  {subcategories.filter((sub) => !sub.isNew && !sub.isDeleted)
                    .length > 0 ? (
                    subcategories
                      .filter((sub) => !sub.isNew && !sub.isDeleted)
                      .sort((a, b) => a.display_order - b.display_order) // Keep sorted by display order
                      .map((sub, index) => (
                        <div
                          key={sub.tempId}
                          className="flex items-start space-x-4 rounded-md border p-4"
                        >
                          <span className="pt-2 text-sm font-medium text-gray-500">
                            #{index + 1}
                          </span>
                          <div className="flex-grow space-y-2">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              {/* Name Input */}
                              <div>
                                <Label htmlFor={`sub-name-${sub.tempId}`}>
                                  Name
                                </Label>
                                <Input
                                  id={`sub-name-${sub.tempId}`}
                                  value={sub.name}
                                  onChange={(e) =>
                                    handleSubcategoryChange(
                                      sub.tempId,
                                      'name',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Subcategory Name"
                                />
                              </div>
                              {/* Display Order Input */}
                              <div>
                                <Label htmlFor={`sub-order-${sub.tempId}`}>
                                  Display Order
                                </Label>
                                <Input
                                  id={`sub-order-${sub.tempId}`}
                                  type="number"
                                  value={sub.display_order}
                                  onChange={(e) =>
                                    handleSubcategoryChange(
                                      sub.tempId,
                                      'display_order',
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                  className="w-24"
                                />
                              </div>
                              {/* Status Select */}
                              <div>
                                <Label htmlFor={`sub-status-${sub.tempId}`}>
                                  Status
                                </Label>
                                <Select
                                  value={sub.status}
                                  onValueChange={(value) =>
                                    handleSubcategoryChange(
                                      sub.tempId,
                                      'status',
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    id={`sub-status-${sub.tempId}`}
                                  >
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">
                                      Active
                                    </SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Slug: {sub.slug || 'Will be generated'} | ID:{' '}
                              {sub.id}
                            </p>
                          </div>
                          {/* Delete Button for Existing */}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() =>
                              handleDeleteExistingSubcategory(sub.tempId)
                            }
                            className="mt-6" // Align roughly with inputs
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Subcategory</span>
                          </Button>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No existing subcategories found for this category.
                    </p>
                  )}
                  {/* Display subcategories marked for deletion */}
                  {subcategories.filter((sub) => sub.isDeleted).length > 0 && (
                    <div className="mt-4 space-y-2 rounded-md border border-dashed border-destructive p-3">
                      <p className="text-sm font-medium text-destructive">
                        Marked for Deletion:
                      </p>
                      <ul className="list-disc pl-5 text-sm text-muted-foreground">
                        {subcategories
                          .filter((sub) => sub.isDeleted)
                          .map((sub) => (
                            <li key={sub.tempId}>
                              {sub.name} (ID: {sub.id})
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Add New Subcategory Section */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Add New Subcategory</h4>
                  {/* Display newly added (unsaved) subcategories */}
                  {subcategories.filter((sub) => sub.isNew).length > 0 && (
                    <div className="mb-4 space-y-2">
                      <Label>
                        New Subcategories Added (will be saved on submit):
                      </Label>
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {subcategories
                          .filter((sub) => sub.isNew)
                          .map((sub) => (
                            <li
                              key={sub.tempId}
                              className="flex items-center justify-between"
                            >
                              <span>
                                {sub.name} (Order: {sub.display_order}, Status:{' '}
                                {sub.status})
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleRemoveNewSubcategory(sub.tempId)
                                }
                              >
                                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                <span className="sr-only">
                                  Remove new subcategory
                                </span>
                              </Button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {/* Form to add a new one */}
                  <div className="flex items-end space-x-2 rounded-md border p-4">
                    <div className="flex-grow">
                      <Label htmlFor="new-subcategory-name">
                        New Subcategory Name
                      </Label>
                      <Input
                        id="new-subcategory-name"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        placeholder="e.g., Hoodies"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-subcategory-order">
                        Display Order
                      </Label>
                      <Input
                        id="new-subcategory-order"
                        type="number"
                        value={newSubcategoryOrder}
                        onChange={(e) =>
                          setNewSubcategoryOrder(
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        min="0"
                        className="w-20"
                      />
                    </div>
                    <Button type="button" onClick={handleAddNewSubcategory}>
                      Add Subcategory
                    </Button>
                  </div>
                </div>
              </div>
              <Separator className="my-6" />

              {/* Submit Button */}
              <Button type="submit" disabled={isLoading || isFetching}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Changes
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}
