import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '@/app/(admin)/products/schema'; // Import from central schema
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
import { Card, CardContent } from '@/components/ui/card';

interface ProductSeoFormProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductSeoForm({ form }: ProductSeoFormProps) {
  const { control } = form;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="seo_title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>SEO Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="SEO optimized title (defaults to product name if empty)"
                    {...field}
                    value={field.value || ''} // Handle null/undefined
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="seo_description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>SEO Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="SEO meta description"
                    className="resize-none"
                    {...field}
                    value={field.value || ''} // Handle null/undefined
                  />
                </FormControl>
                <FormDescription>
                  Recommended length: 150-160 characters
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="seo_keywords"
          render={({ field }) => (
            <FormItem className="mt-6">
              <FormLabel>SEO Keywords</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., keyword1, keyword2, keyword3"
                  {...field}
                  value={field.value || ''} // Handle null/undefined
                  rows={2}
                />
              </FormControl>
              <FormDescription>
                Comma-separated keywords for search engines.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
