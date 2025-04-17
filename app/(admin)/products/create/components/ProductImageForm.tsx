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
import { Card, CardContent } from '@/components/ui/card';
import { ImageUploader } from '@/components/image-uploader'; // Ensure this path is correct

interface ProductImageFormProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductImageForm({ form }: ProductImageFormProps) {
  const { control } = form;

  return (
    <Card>
      <CardContent className="pt-6">
        <FormField
          control={control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Images</FormLabel>
              <FormControl>
                {/* Ensure ImageUploader receives the correct props */}
                <ImageUploader
                  value={field.value || []} // Ensure value is always an array
                  onChange={field.onChange}
                  // Pass any other necessary props required by ImageUploader
                />
              </FormControl>
              <FormDescription>
                Upload up to 5 images. The first image will be the primary one.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
