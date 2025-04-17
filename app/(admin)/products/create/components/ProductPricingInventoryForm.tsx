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

interface ProductPricingInventoryFormProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductPricingInventoryForm({
  form,
}: ProductPricingInventoryFormProps) {
  const { control, watch } = form;
  const trackInventory = watch('track_inventory');

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="compare_at_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compare at Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Original price for showing a discount
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="cost_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Your cost for this product (not shown to customers)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="currency_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="track_inventory"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Track Inventory</FormLabel>
                  <FormDescription>
                    Enable inventory tracking for this product
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    {...field}
                    disabled={!trackInventory}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="initial_stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Stock (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter initial stock amount"
                    {...field}
                    value={field.value ?? ''}
                    disabled={!trackInventory}
                  />
                </FormControl>
                <FormDescription>
                  Set the very first stock quantity when adding this product.
                  This is useful if migrating data or setting a known starting
                  point.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="reserved_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reserved Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0" // Add min=0 for consistency
                    step="1" // Add step=1
                    {...field}
                    disabled={!trackInventory}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Quantity currently held in carts or orders.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="max_stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Optional"
                    min="0" // Add min=0
                    step="1" // Add step=1
                    {...field}
                    value={field.value ?? ''}
                    disabled={!trackInventory}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Maximum stock level allowed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="low_stock_threshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low Stock Threshold</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="5"
                    {...field}
                    disabled={!trackInventory}
                  />
                </FormControl>
                <FormDescription>
                  Quantity at which product is considered low stock
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="backorderable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!trackInventory}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Allow Backorders</FormLabel>
                  <FormDescription>
                    Allow customers to purchase when out of stock
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
