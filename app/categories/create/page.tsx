'use client';

import { useState, useEffect } from 'react';
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
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';

// Define the structure for a subcategory being added
interface SubcategoryToAdd {
  id: string; // Temporary ID for list key
  name: string;
  display_order: number;
}

// Helper function to upload file to Supabase Storage
async function uploadFileToSupabase(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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
    // File Upload fields (remain optional)
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
    // URL Input fields
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
    // Add subcategories field to the schema
    subcategories: z
      .array(
        z.object({
          id: z.string(), // Keep temp ID for schema, won't be submitted to DB
          name: z.string().min(1, 'Subcategory name cannot be empty.'),
          display_order: z
            .number()
            .int()
            .min(0, 'Display order must be 0 or greater')
            .default(0),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      // Ensure that if a file is provided, the URL field is treated as secondary
      if (data.short_banner_file && data.short_banner_url) {
        // We could clear data.short_banner_url here, but it's easier to handle in onSubmit
        // Validation passes, onSubmit will prioritize the file
      }
      if (data.long_banner_file && data.long_banner_url) {
        // Validation passes, onSubmit will prioritize the file
      }
      return true;
    },
    {
      // No specific message needed here as logic is handled in submit
      // path: ['short_banner_file'], // or another relevant path if needed
    }
  );

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function makeUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const { data } = await supabase
      .from('categories')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (!data) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return slug;
}

// Add helper for unique subcategory slug
async function makeUniqueSubcategorySlug(
  baseSlug: string,
  categoryId: number
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const { data } = await supabase
      .from('subcategories')
      .select('slug')
      .eq('slug', slug)
      .eq('category_id', categoryId) // Check uniqueness within the parent category
      .single();

    if (!data) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return slug;
}

export default function CreateCategoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  // Add state for file previews
  const [shortBannerPreview, setShortBannerPreview] = useState<string | null>(
    null
  );
  const [longBannerPreview, setLongBannerPreview] = useState<string | null>(
    null
  );

  // State for managing subcategories before submission
  const [subcategoriesToAdd, setSubcategoriesToAdd] = useState<
    SubcategoryToAdd[]
  >([]);
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
      short_banner_url: '', // Initialize URL fields
      long_banner_url: '',
      subcategories: [], // Initialize subcategories array
    },
    mode: 'onChange', // Added for better reactivity if needed
  });

  // Watch subcategoriesToAdd and update form value
  useEffect(() => {
    form.setValue('subcategories', subcategoriesToAdd, {
      shouldValidate: true,
    });
  }, [subcategoriesToAdd, form]);

  // Auto-generate slug when name changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name') {
        const newSlug = generateSlug(value.name || '');
        form.setValue('slug', newSlug);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Function to add a subcategory to the temporary list
  const handleAddSubcategory = () => {
    if (newSubcategoryName.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Subcategory name required',
        description: 'Please enter a name for the subcategory.',
      });
      return;
    }
    const newSub: SubcategoryToAdd = {
      id: crypto.randomUUID(), // Simple unique ID for the list key
      name: newSubcategoryName.trim(),
      display_order: newSubcategoryOrder,
    };
    setSubcategoriesToAdd([...subcategoriesToAdd, newSub]);
    // Reset input fields
    setNewSubcategoryName('');
    setNewSubcategoryOrder(0);
  };

  // Function to remove a subcategory from the list
  const handleRemoveSubcategory = (idToRemove: string) => {
    setSubcategoriesToAdd(
      subcategoriesToAdd.filter((sub) => sub.id !== idToRemove)
    );
  };

  async function onSubmit(data: CategoryFormValues) {
    setIsLoading(true);
    let shortBannerUrl: string | null = data.short_banner_url || null;
    let longBannerUrl: string | null = data.long_banner_url || null;

    // --- File Upload Logic (needs to be adapted if moving to API route) ---
    // This logic currently happens client-side. For a pure API route approach,
    // you'd typically upload files *before* calling the create API,
    // or send FormData to the API route to handle uploads server-side.
    // For now, we assume URLs are obtained somehow and are in 'data' or manually set.
    // Example placeholder for uploaded URLs if file handling were done prior:
    // if (data.short_banner_file) shortBannerUrl = await handleFileUpload(data.short_banner_file, 'short_banner');
    // if (data.long_banner_file) longBannerUrl = await handleFileUpload(data.long_banner_file, 'long_banner');
    // --- End File Upload Logic Placeholder ---

    try {
      // Prepare payload for the API route
      const payload = {
        ...data,
        slug: generateSlug(data.slug || data.name), // Ensure slug is generated
        // Use potentially updated URLs from (placeholder) file upload logic
        image_url: shortBannerUrl, // Assuming short_banner maps to category image_url
        icon_url: null, // Assuming no icon URL in this form
        // We need to handle subcategories. Send them as part of the payload?
        // The API route needs to be updated to handle subcategory creation.
        // For now, sending minimal core data.
        // subcategories: subcategoriesToAdd, // This structure needs adjustment for API
      };

      // Remove fields not expected by the basic API schema (like files)
      delete payload.short_banner_file;
      delete payload.long_banner_file;
      delete payload.subcategories; // Remove until API handles it
      delete payload.short_banner_url; // Remove if image_url is used
      delete payload.long_banner_url; // Remove if not used in API schema

      const response = await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create category');
      }

      toast({
        title: 'Category created',
        description: `Category "${data.name}" created successfully.`,
      });

      // Redirect after successful creation
      router.push('/categories');
      // router.refresh();
    } catch (error: any) {
      console.error(
        '[CreateCategoryPage:onSubmit:CatchBlock] Error creating category:',
        error
      );
      toast({
        variant: 'destructive',
        title: 'Error Creating Category',
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
          <h1 className="text-3xl font-bold tracking-tight">Create Category</h1>
          <p className="text-muted-foreground">
            Add a new category to your store
          </p>
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
                      The URL-friendly version of the category name.
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
                      defaultValue={field.value}
                    >
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
                        value={field.value.toString()}
                        onChange={(e) => {
                          const value =
                            e.target.value === ''
                              ? 0
                              : parseInt(e.target.value, 10);
                          field.onChange(value);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Order in which this category should appear (lower numbers
                      appear first).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Banner Section --- */}
              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium">Short Banner</h3>
                <p className="text-sm text-muted-foreground">
                  Provide either a file upload OR a direct image URL. Upload
                  takes precedence.
                </p>
                {/* Short Banner Upload */}
                <FormField
                  control={form.control}
                  name="short_banner_file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload File (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            field.onChange(file ?? null);
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setShortBannerPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                              // Optionally clear the URL field if a file is selected
                              // form.setValue('short_banner_url', '');
                            } else {
                              setShortBannerPreview(null);
                            }
                          }}
                        />
                      </FormControl>
                      {shortBannerPreview && (
                        <div className="mt-2">
                          <img
                            src={shortBannerPreview}
                            alt="Short Banner Preview"
                            className="h-20 w-auto object-contain rounded-md border"
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Short Banner URL Input */}
                <FormField
                  control={form.control}
                  name="short_banner_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Or Enter Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/banner.jpg"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e);
                            if (e.target.value) {
                              setShortBannerPreview(e.target.value);
                              form.setValue(
                                'short_banner_file',
                                null
                              ); /* Clear file if URL typed*/
                            } else if (!form.getValues('short_banner_file')) {
                              setShortBannerPreview(null);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium">Long Banner</h3>
                <p className="text-sm text-muted-foreground">
                  Provide either a file upload OR a direct image URL. Upload
                  takes precedence.
                </p>
                {/* Long Banner Upload */}
                <FormField
                  control={form.control}
                  name="long_banner_file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload File (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            field.onChange(file ?? null);
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setLongBannerPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                              // Optionally clear the URL field if a file is selected
                              // form.setValue('long_banner_url', '');
                            } else {
                              setLongBannerPreview(null);
                            }
                          }}
                        />
                      </FormControl>
                      {longBannerPreview && (
                        <div className="mt-2">
                          <img
                            src={longBannerPreview}
                            alt="Long Banner Preview"
                            className="h-20 w-auto object-contain rounded-md border"
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Long Banner URL Input */}
                <FormField
                  control={form.control}
                  name="long_banner_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Or Enter Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/long_banner.png"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e);
                            if (e.target.value) {
                              setLongBannerPreview(e.target.value);
                              form.setValue(
                                'long_banner_file',
                                null
                              ); /* Clear file if URL typed*/
                            } else if (!form.getValues('long_banner_file')) {
                              setLongBannerPreview(null);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- End Banner Section --- */}

              {/* Subcategories Section */}
              <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-medium">Subcategories</h3>
                {/* List of subcategories to add */}
                {subcategoriesToAdd.length > 0 && (
                  <div className="space-y-2">
                    <FormLabel>Subcategories to Add:</FormLabel>
                    <ul className="list-disc space-y-1 pl-5 text-sm">
                      {subcategoriesToAdd.map((sub) => (
                        <li
                          key={sub.id}
                          className="flex items-center justify-between"
                        >
                          <span>
                            {sub.name} (Order: {sub.display_order})
                          </span>
                          <Button
                            type="button" // Prevent form submission
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSubcategory(sub.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remove subcategory</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Form to add a new subcategory */}
                <div className="flex items-end space-x-2">
                  <div className="flex-grow">
                    <Label htmlFor="new-subcategory-name">
                      New Subcategory Name
                    </Label>
                    <Input
                      id="new-subcategory-name"
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      placeholder="e.g., T-Shirts"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-subcategory-order">Display Order</Label>
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
                  <Button type="button" onClick={handleAddSubcategory}>
                    Add Subcategory
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Category
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </AdminLayout>
  );
}
