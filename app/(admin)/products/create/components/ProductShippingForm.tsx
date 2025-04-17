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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProductShippingFormProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductShippingForm({ form }: ProductShippingFormProps) {
  const { control, watch } = form;
  const shippingRequired = watch('shipping_required');
  const weight = watch('weight');
  const length = watch('dimensions_length');
  const width = watch('dimensions_width');
  const height = watch('dimensions_height');
  const hasDimensions = length || width || height;

  return (
    <Card>
      <CardContent className="pt-6">
        <FormField
          control={control}
          name="shipping_required"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow mb-6">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Requires Shipping</FormLabel>
                <FormDescription>
                  Check if this product needs to be shipped.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="shipping_class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping Class</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., small, medium, heavy"
                    {...field}
                    value={field.value ?? ''} // Handle null/undefined
                    disabled={!shippingRequired}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-6" />
        <h3 className="text-lg font-medium mb-4">Weight & Dimensions</h3>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0" // Ensure non-negative
                    step="any"
                    placeholder="Optional"
                    {...field}
                    value={field.value ?? ''}
                    disabled={!shippingRequired}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="weight_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight Unit</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value} // Use value directly, defaultValue is for initial
                  disabled={!shippingRequired || !weight}
                  defaultValue="kg" // Keep default value
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                    <SelectItem value="oz">oz</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 mt-6 md:grid-cols-4">
          <FormField
            control={control}
            name="dimensions_length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0" // Ensure non-negative
                    step="any"
                    placeholder="Optional"
                    {...field}
                    value={field.value ?? ''}
                    disabled={!shippingRequired}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="dimensions_width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0" // Ensure non-negative
                    step="any"
                    placeholder="Optional"
                    {...field}
                    value={field.value ?? ''}
                    disabled={!shippingRequired}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="dimensions_height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0" // Ensure non-negative
                    step="any"
                    placeholder="Optional"
                    {...field}
                    value={field.value ?? ''}
                    disabled={!shippingRequired}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="dimensions_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dimensions Unit</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value} // Use value directly
                  disabled={!shippingRequired || !hasDimensions}
                  defaultValue="cm" // Keep default value
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                    <SelectItem value="ft">ft</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
