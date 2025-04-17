'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, ArrowLeft, Star } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { testimonialFormSchema, TestimonialFormValues } from '../schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Interface for product dropdown
interface ProductOption {
  products_id: number;
  name: string;
}

export default function CreateTestimonialPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      product_id: '',
      customer_name: '',
      testimonial_text: '',
      rating: null,
      customer_image_url: '',
    },
  });

  // Fetch products for the dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('products_id, name')
        .order('name');

      if (error) {
        console.error(
          '[CreateTestimonialPage:useEffect:FetchProducts] Error fetching products:',
          error
        );
        toast({
          variant: 'destructive',
          title: 'Failed to load products',
          description: 'Could not load products for selection.',
        });
      } else {
        setProducts(data || []);
      }
      setLoadingProducts(false);
    };
    fetchProducts();
  }, [toast]);

  const onSubmit = async (values: TestimonialFormValues) => {
    setIsSubmitting(true);
    try {
      const testimonialInsertData = {
        customer_name: values.customer_name,
        testimonial_text: values.testimonial_text,
        rating: values.rating || null,
      };

      const { error } = await supabase
        .from('customer_testimonials')
        .insert(testimonialInsertData);

      if (error) {
        setIsSubmitting(false);
        console.error(
          '[CreateTestimonialPage:onSubmit:CreateTestimonial] Error creating testimonial:',
          {
            values,
            error: error,
          }
        );
        toast({
          variant: 'destructive',
          title: 'Error Saving Testimonial',
          description:
            error.message ||
            'An unexpected error occurred while saving the testimonial.',
        });
        return;
      }

      toast({
        title: 'Testimonial Created',
        description: 'New customer testimonial added successfully.',
      });
      router.push('/testimonials'); // Navigate back to the list page
      router.refresh(); // Refresh server components
    } catch (error: any) {
      console.error('Error creating testimonial:', error);
      toast({
        variant: 'destructive',
        title: 'Error Creating Testimonial',
        description:
          error.message || 'An error occurred while adding the testimonial.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Add Testimonial</h1>
          <p className="text-muted-foreground">
            Create a new customer testimonial.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/testimonials')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Testimonials
        </Button>
      </div>

      <Separator />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="customer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer's name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="testimonial_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Testimonial</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter the customer's testimonial text..."
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating (Optional)</FormLabel>
                <FormControl>
                  {/* Simple number input for rating */}
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    step="1"
                    placeholder="Enter rating (1-5)"
                    {...field}
                    // Ensure value is passed correctly, handle null/undefined
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? null : parseInt(value, 10));
                    }}
                  />
                  {/* Alternative: Star rating component could be implemented here */}
                </FormControl>
                <FormDescription>
                  Optional: Rate the experience from 1 to 5 stars.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/testimonials')}
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
                  Save Testimonial
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
