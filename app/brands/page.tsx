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

interface Brand {
  brands_id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  long_banner_url: string | null;
  short_banner_url: string | null;
  status: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteBrandId, setDeleteBrandId] = useState<number | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchBrands();
  }, [router]);

  async function fetchBrands() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      setBrands(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching brands',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBrand(id: number) {
    console.log('Attempting to delete brand with ID via API:', id);
    try {
      // Call the internal API endpoint
      const response = await fetch('/api/brands/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Display the specific error from the API (e.g., foreign key constraint)
        throw new Error(result.error || 'Failed to delete brand');
      }

      console.log('Brand deleted successfully via API.');

      toast({
        title: 'Brand deleted',
        description: 'The brand has been deleted successfully.',
      });

      router.refresh();
    } catch (error: any) {
      console.error(
        '[handleDeleteBrand:CatchBlock] Error deleting brand:',
        error
      );
      toast({
        variant: 'destructive',
        title: 'Error Deleting Brand',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setDeleteBrandId(null);
    }
  }

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Brand Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
    },
    {
      accessorKey: 'logo_url',
      header: 'Logo',
      cell: ({ row }) => {
        const logoUrl = row.getValue('logo_url') as string | null;
        const [isOpen, setIsOpen] = useState(false);
        return logoUrl ? (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
              className="relative h-8 w-8"
            >
              <PopoverTrigger asChild>
                <img
                  src={logoUrl || '/placeholder.svg'}
                  alt={`${row.getValue('name')} logo`}
                  className="h-full w-full cursor-pointer rounded-md object-contain transition-transform duration-200 hover:scale-105"
                />
              </PopoverTrigger>
            </div>
            {isOpen && (
              <PopoverContent className="w-auto p-0">
                <img
                  src={logoUrl || '/placeholder.svg'}
                  alt={`${row.getValue('name')} logo preview`}
                  className="max-h-64 w-auto rounded-md object-contain"
                />
              </PopoverContent>
            )}
          </Popover>
        ) : (
          <div className="text-muted-foreground">No logo</div>
        );
      },
    },
    {
      accessorKey: 'long_banner_url',
      header: 'Long Banner',
      cell: ({ row }) => {
        const bannerUrl = row.getValue('long_banner_url') as string | null;
        const [isOpen, setIsOpen] = useState(false);
        return bannerUrl ? (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
              className="relative h-8 w-16"
            >
              <PopoverTrigger asChild>
                <img
                  src={bannerUrl || '/placeholder.svg'}
                  alt={`${row.getValue('name')} long banner`}
                  className="h-full w-full cursor-pointer rounded-md object-contain transition-transform duration-200 hover:scale-105"
                />
              </PopoverTrigger>
            </div>
            {isOpen && (
              <PopoverContent className="w-auto p-0">
                <img
                  src={bannerUrl || '/placeholder.svg'}
                  alt={`${row.getValue('name')} long banner preview`}
                  className="max-h-64 w-auto rounded-md object-contain"
                />
              </PopoverContent>
            )}
          </Popover>
        ) : (
          <div className="text-muted-foreground">No banner</div>
        );
      },
    },
    {
      accessorKey: 'short_banner_url',
      header: 'Short Banner',
      cell: ({ row }) => {
        const bannerUrl = row.getValue('short_banner_url') as string | null;
        const [isOpen, setIsOpen] = useState(false);
        return bannerUrl ? (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <div
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
              className="relative h-8 w-8"
            >
              <PopoverTrigger asChild>
                <img
                  src={bannerUrl || '/placeholder.svg'}
                  alt={`${row.getValue('name')} short banner`}
                  className="h-full w-full cursor-pointer rounded-md object-contain transition-transform duration-200 hover:scale-105"
                />
              </PopoverTrigger>
            </div>
            {isOpen && (
              <PopoverContent className="w-auto p-0">
                <img
                  src={bannerUrl || '/placeholder.svg'}
                  alt={`${row.getValue('name')} short banner preview`}
                  className="max-h-64 w-auto rounded-md object-contain"
                />
              </PopoverContent>
            )}
          </Popover>
        ) : (
          <div className="text-muted-foreground">No banner</div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = (row.getValue('status') as string) || 'draft';
        return (
          <Badge
            variant={
              status === 'active'
                ? 'default'
                : status === 'draft'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const brand = row.original;

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
                onClick={() => router.push(`/brands/${brand.brands_id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/brands/${brand.brands_id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteBrandId(brand.brands_id)}
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
            <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
            <p className="text-muted-foreground">Manage your product brands</p>
          </div>
          <Button asChild>
            <Link href="/brands/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Link>
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={brands}
          searchColumn="name"
          searchPlaceholder="Search brands..."
        />

        <AlertDialog
          open={!!deleteBrandId}
          onOpenChange={() => setDeleteBrandId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                brand.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteBrandId && handleDeleteBrand(deleteBrandId)
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
