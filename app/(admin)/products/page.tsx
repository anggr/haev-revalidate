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

interface Product {
  products_id: number;
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
  status: 'active' | 'draft';
  mark:
    | 'selling fast'
    | 'Trending now'
    | 'Must Have'
    | 'Loved by Many'
    | 'best seller'
    | 'limited edition'
    | null;
  category_id: number | null;
  brand_id: number | null;
  subcategory_id: number | null;
  slug: string;
  categories: { name: string } | null;
  brands: { name: string } | null;
  subcategories: { name: string } | null;
  category_name?: string;
  brand_name?: string;
  subcategory_name?: string;
  product_images?: { url: string; is_primary: boolean; sort_order: number }[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);

      // Fetch products with category and brand names
      const { data, error } = (await supabase
        .from('products')
        .select(
          `
          products_id, 
          name, 
          sku, 
          price, 
          quantity, 
          status,
          mark,
          category_id,
          brand_id,
          subcategory_id,
          slug,
          categories(name),
          brands(name),
          subcategories(name),
          product_images(url, is_primary, sort_order)
        `
        )
        .order('products_id', { ascending: false })) as unknown as {
        data: Omit<
          Product,
          'category_name' | 'brand_name' | 'subcategory_name'
        >[];
        error: any;
      };

      if (error) {
        throw error;
      }

      // Transform the data to include category and brand names
      const transformedData = data.map((product) => ({
        ...product,
        category_name: product.categories?.name || 'Uncategorized',
        brand_name: product.brands?.name || 'No Brand',
        subcategory_name: product.subcategories?.name || 'No Subcategory',
      }));

      setProducts(transformedData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching products',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(id: number) {
    try {
      // Call the internal API endpoint instead of Supabase directly
      const response = await fetch('/api/products/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      // Remove the product from the local state
      setProducts(products.filter((product) => product.products_id !== id));

      toast({
        title: 'Product deleted',
        description: 'The product has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting product',
        description: error.message,
      });
    } finally {
      setDeleteProductId(null);
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'product_images',
      header: 'Image',
      cell: ({ row }) => {
        const productImages = row.getValue(
          'product_images'
        ) as Product['product_images'];
        const primaryImage =
          productImages?.find((img) => img.is_primary) || productImages?.[0];
        const [isOpen, setIsOpen] = useState(false);

        if (!primaryImage) {
          return (
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
              -
            </div>
          );
        }

        return (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
              className="relative h-16 w-16"
            >
              <PopoverTrigger asChild>
                <img
                  src={primaryImage.url}
                  alt={row.getValue('name') as string}
                  className="h-full w-full cursor-pointer rounded-md object-cover transition-transform duration-200 hover:scale-105"
                />
              </PopoverTrigger>
            </div>
            {isOpen && (
              <PopoverContent
                side="right"
                sideOffset={5}
                className="w-auto p-0"
              >
                <img
                  src={primaryImage.url}
                  alt={`${row.getValue('name') as string} preview`}
                  className="max-h-96 w-auto rounded-md object-contain"
                />
              </PopoverContent>
            )}
          </Popover>
        );
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-base">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => <div>{row.getValue('sku') || '-'}</div>,
    },
    {
      accessorKey: 'category_name',
      header: 'Category',
    },
    {
      accessorKey: 'subcategory_name',
      header: 'Subcategory',
      cell: ({ row }) => {
        const subcategory = row.getValue('subcategory_name') as string;
        return subcategory === 'No Subcategory' ? (
          <div>-</div>
        ) : (
          <Badge variant="outline">{subcategory}</Badge>
        );
      },
    },
    {
      accessorKey: 'brand_name',
      header: 'Brand',
    },
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const price = Number.parseFloat(row.getValue('price'));
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(price);
        return <div>{formatted}</div>;
      },
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue('quantity')}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Product['status'];
        let variant: 'default' | 'secondary' | 'outline' = 'outline';

        switch (status) {
          case 'active':
            variant = 'default';
            break;
          case 'draft':
            variant = 'secondary';
            break;
          default:
            variant = 'outline';
        }

        return (
          <Badge variant={variant}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'mark',
      header: 'Mark',
      cell: ({ row }) => {
        const mark = row.getValue('mark') as Product['mark'];

        if (!mark) {
          return <div>-</div>; // Or return null if you prefer no output
        }

        // Customize badge appearance based on mark if needed
        // For now, using 'secondary' for all marks
        return (
          <Badge variant="secondary">
            {mark.charAt(0).toUpperCase() + mark.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original;

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
                onClick={() => router.push(`/products/${product.slug}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/products/${product.slug}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteProductId(product.products_id)}
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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-lg">
            Manage your product catalog
          </p>
        </div>
        <Button asChild>
          <Link href="/products/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        searchColumn="name"
        searchPlaceholder="Search products..."
      />

      <AlertDialog
        open={!!deleteProductId}
        onOpenChange={() => setDeleteProductId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteProductId && handleDeleteProduct(deleteProductId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
