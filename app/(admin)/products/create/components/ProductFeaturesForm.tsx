import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { ProductFormValues } from '@/app/(admin)/products/schema';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface ProductFeaturesFormProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductFeaturesForm({ form }: ProductFeaturesFormProps) {
  const { control, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'features',
  });

  const handleIconUpload = async (file: File, index: number) => {
    console.log(`Uploading icon for feature ${index}:`, file);
    const placeholderUrl = `/uploads/icons/${file.name}`;
    setValue(`features.${index}.icon_url`, placeholderUrl, {
      shouldValidate: true,
    });
    console.log(`Set icon_url for feature ${index} to: ${placeholderUrl}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2 p-4 border rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
              <FormField
                control={control}
                name={`features.${index}.feature_text`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feature Text</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Material, Color, Size"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Remove feature"
                className="self-end mb-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <FormField
                control={control}
                name={`features.${index}.icon_url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="https://example.com/icon.svg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Or Upload Icon</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/svg+xml, image/png, image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleIconUpload(file, index);
                      }
                    }}
                    className="cursor-pointer"
                  />
                </FormControl>
              </FormItem>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ feature_text: '', icon_url: null })}
        >
          Add Feature
        </Button>
      </CardContent>
    </Card>
  );
}
