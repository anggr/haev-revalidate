'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import AdminLayout from '@/components/admin-layout';

interface Category {
  categories_id: number;
  name: string;
  slug: string | null;
  created_at: string;
  status: string;
  display_order: number;
  long_banner_url?: string;
  short_banner_url?: string;
  subcategories?: Pick<Subcategory, 'id' | 'name' | 'display_order'>[];
}

interface Subcategory {
  id: number;
  name: string;
  slug: string | null;
  category_id: number; // Foreign key to categories table
  created_at: string;
  status: string;
  display_order: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);

      // Check if Supabase is properly initialized
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        throw new Error('Missing Supabase environment variables');
      }

      console.log('Attempting to fetch categories...');

      // Fetch all categories with specific fields and related subcategories
      const { data, error } = await supabase
        .from('categories')
        .select(
          `
          categories_id,
          name,
          slug,
          created_at,
          status,
          display_order,
          long_banner_url,
          short_banner_url,
          subcategories ( id, name, display_order ) 
        `
        )
        .order('display_order', { ascending: true });

      // Log the response for debugging
      console.log('Supabase response:', { data, error });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data received from the server');
      }

      setCategories(data);
    } catch (error: any) {
      // Log detailed error information
      console.error(
        '[CategoriesPage:useEffect:FetchCategories] Error fetching categories:',
        {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error,
          stack: error.stack,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? 'Set'
            : 'Not set',
        }
      );

      let errorMessage = 'Failed to fetch categories';
      if (error.message) errorMessage = error.message;
      if (error.hint) errorMessage += ` (${error.hint})`;

      toast({
        variant: 'destructive',
        title: 'Error fetching categories',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    try {
      // Add debug logging
      console.log('Attempting to delete category:', id);

      // Check if category has products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('products_id')
        .eq('category_id', id);

      if (productsError) {
        console.error(
          '[CategoriesPage:handleDelete:ProductCheck] Error checking for products:',
          {
            categoryId: id,
            message: productsError.message,
            code: productsError.code,
            details: productsError.details,
            hint: productsError.hint,
          }
        );
        throw productsError;
      }

      console.log('Products check result:', products);

      if (products && products.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Cannot delete category',
          description:
            'This category has products. Please reassign or delete them first.',
        });
        return;
      }

      // Delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('categories_id', id);

      if (error) {
        console.error(
          '[CategoriesPage:handleDelete:DeleteCategory] Error deleting category:',
          {
            categoryId: id,
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        );
        throw error;
      }

      // Update the categories list
      setCategories(
        categories.filter((category) => category.categories_id !== id)
      );

      toast({
        title: 'Category deleted',
        description: 'The category has been deleted successfully.',
      });
    } catch (error: any) {
      console.error(
        '[CategoriesPage:handleDelete:CatchBlock] General error deleting category:',
        {
          categoryId: id,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        }
      );
      toast({
        variant: 'destructive',
        title: 'Error Deleting Category',
        description:
          error.message ||
          'An unexpected error occurred while deleting the category.',
      });
    } finally {
      setDeleteCategoryId(null);
    }
  }

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'display_order',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Display Order
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('display_order')}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Category Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const categoryName = row.getValue('name') as string;
        return <div className="font-medium">{categoryName}</div>;
      },
    },
    {
      id: 'subcategories',
      header: 'Subcategories',
      cell: ({ row }) => {
        const subcategories = row.original.subcategories || [];
        // Sort subcategories by display_order before rendering
        const sortedSubcategories = [...subcategories].sort(
          (a, b) => a.display_order - b.display_order
        );

        return sortedSubcategories.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {sortedSubcategories.map((sub) => (
              <Badge key={sub.id} variant="outline" className="text-xs">
                {sub.name}
              </Badge>
            ))}
          </div>
        ) : (
          '-'
        );
      },
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => <div>{row.getValue('slug') || '-'}</div>,
    },
    {
      accessorKey: 'short_banner_url',
      header: 'Short Banner',
      cell: ({ row }) => {
        const url = row.getValue('short_banner_url') as string | undefined;
        const [isOpen, setIsOpen] = useState(false);

        return url ? (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <PopoverTrigger asChild>
                <img
                  src={url}
                  alt="Short Banner"
                  className="h-10 w-auto cursor-pointer object-contain transition-transform duration-200 hover:scale-105"
                />
              </PopoverTrigger>
            </div>
            {isOpen && (
              <PopoverContent className="w-auto p-0">
                <img
                  src={url}
                  alt="Short Banner Preview"
                  className="max-h-64 w-auto rounded-md object-contain"
                />
              </PopoverContent>
            )}
          </Popover>
        ) : (
          '-'
        );
      },
    },
    {
      accessorKey: 'long_banner_url',
      header: 'Long Banner',
      cell: ({ row }) => {
        const url = row.getValue('long_banner_url') as string | undefined;
        const [isOpen, setIsOpen] = useState(false);

        return url ? (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <PopoverTrigger asChild>
                <img
                  src={url}
                  alt="Long Banner"
                  className="h-10 w-auto cursor-pointer object-contain transition-transform duration-200 hover:scale-105"
                />
              </PopoverTrigger>
            </div>
            {isOpen && (
              <PopoverContent className="w-auto p-0">
                <img
                  src={url}
                  alt="Long Banner Preview"
                  className="max-h-64 w-auto rounded-md object-contain"
                />
              </PopoverContent>
            )}
          </Popover>
        ) : (
          '-'
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant={status === 'active' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {status}
          </Badge>
        );
      },
    },
    // {
    //   accessorKey: 'created_at',
    //   header: ({ column }) => (
    //     <Button
    //       variant="ghost"
    //       onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    //     >
    //       Created At
    //       <ArrowUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    //   cell: ({ row }) => {
    //     const date = new Date(row.getValue('created_at'));
    //     return <div>{date.toLocaleDateString()}</div>;
    //   },
    // },

    {
      id: 'actions',
      cell: ({ row }) => {
        const category = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/categories/${category.categories_id}`)
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/categories/${category.categories_id}/edit`)
                }
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteCategoryId(category.categories_id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">
              Manage your product categories
            </p>
          </div>
          <Button asChild>
            <Link href="/categories/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={categories}
          searchColumn="name"
          searchPlaceholder="Search categories..."
        />

        <AlertDialog
          open={!!deleteCategoryId}
          onOpenChange={() => setDeleteCategoryId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                category.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteCategoryId && handleDeleteCategory(deleteCategoryId)
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
