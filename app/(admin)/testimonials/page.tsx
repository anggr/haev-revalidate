'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  PlusCircle,
  Star,
  Image as ImageIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { CustomerTestimonial } from './schema'; // Assuming schema is in the same directory
import { format } from 'date-fns';
import Image from 'next/image';

// Helper to display stars
const StarRating = ({ rating }: { rating: number | null | undefined }) => {
  if (rating === null || rating === undefined) {
    return <span className="text-muted-foreground text-xs">No rating</span>;
  }
  return (
    <div className="flex items-center">
      {[...Array(rating)].map((_, i) => (
        <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      ))}
      {[...Array(5 - rating)].map((_, i) => (
        <Star key={i + rating} className="h-4 w-4 text-muted-foreground" />
      ))}
    </div>
  );
};

export default function TestimonialsListPage() {
  const [testimonials, setTestimonials] = useState<CustomerTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_testimonials')
      .select(
        `
        id,
        customer_name,
        testimonial_text,
        rating,
        customer_image_url,
        created_at,
        updated_at,
        product_id,
        products ( name )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error(
        '[TestimonialsPage:useEffect:FetchTestimonials] Error fetching testimonials:',
        error
      );
      toast({
        variant: 'destructive',
        title: 'Failed to fetch testimonials',
        description: error.message,
      });
    } else {
      // Type should now match after schema update
      setTestimonials(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }
    const { error } = await supabase
      .from('customer_testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete testimonial',
        description: error.message,
      });
    } else {
      toast({
        title: 'Testimonial Deleted',
        description: 'The testimonial was successfully deleted.',
      });
      // Refresh the list after deletion
      setTestimonials(testimonials.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Customer Testimonials
        </h1>
        <Link href="/testimonials/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Testimonial
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Testimonials</CardTitle>
          <CardDescription>
            View, edit, or delete customer testimonials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading testimonials...</p>
          ) : testimonials.length === 0 ? (
            <p>No testimonials found. Add one!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Testimonial</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.map((testimonial) => (
                  <TableRow key={testimonial.id}>
                    <TableCell className="font-medium">
                      {testimonial.customer_name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {testimonial.testimonial_text}
                    </TableCell>
                    <TableCell>
                      <StarRating rating={testimonial.rating} />
                    </TableCell>
                    <TableCell>
                      {format(new Date(testimonial.created_at), 'PP')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            // onClick={() => router.push(`/testimonials/${testimonial.id}/edit`)}
                            // Add edit functionality later if needed
                            disabled // Disable edit for now
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDelete(testimonial.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
