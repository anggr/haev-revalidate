import { UseFormReturn, useFieldArray, Control } from 'react-hook-form';
import {
  ProductFormValues,
  ProductPageTestimonialValues,
} from '@/app/(admin)/products/schema';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, PlusCircle } from 'lucide-react';

interface ProductCustomerTestimonialsFormProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductCustomerTestimonialsForm({
  form,
}: ProductCustomerTestimonialsFormProps) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customer_testimonials',
  });

  const defaultTestimonial: ProductPageTestimonialValues = {
    customer_name: '',
    testimonial_text: '',
    rating: null,
    customer_image_url: '',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Testimonials</CardTitle>
        <FormDescription>
          Add or manage customer testimonials specific to this product.
        </FormDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-4 rounded-md border p-4 relative"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
              aria-label="Remove testimonial"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <FormField
              control={control}
              name={`customer_testimonials.${index}.customer_name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`customer_testimonials.${index}.testimonial_text`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Testimonial Text</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Testimonial content..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`customer_testimonials.${index}.customer_image_url`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Picture URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`customer_testimonials.${index}.rating`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (0-5)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      max={5}
                      placeholder="e.g. 4.5"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? null : parseFloat(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}

        {fields.length > 0 && <Separator />}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(defaultTestimonial)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Testimonial
        </Button>
      </CardContent>
    </Card>
  );
}
