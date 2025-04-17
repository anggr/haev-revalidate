import { UseFormReturn } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import {
  ProductFormValues,
  Category,
  Subcategory,
  Brand,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

interface ProductGeneralFormProps {
  form: UseFormReturn<ProductFormValues>;
  categories: Category[];
  filteredSubcategories: Subcategory[];
  brands: Brand[];
  isLoading: boolean;
  generateSlug: (name: string) => string;
  watchedCategoryId?: string;
}

export function ProductGeneralForm({
  form,
  categories,
  filteredSubcategories,
  brands,
  isLoading,
  generateSlug,
  watchedCategoryId,
}: ProductGeneralFormProps) {
  const { control, getValues, setValue } = form;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter product name"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!getValues('slug')) {
                        setValue('slug', generateSlug(e.target.value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="product-slug" {...field} />
                </FormControl>
                <FormDescription>
                  Used in the URL. Auto-generated from name if empty.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input
                    placeholder="SKU123"
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value === 'none' ? undefined : value);
                  }}
                  value={field.value ?? 'none'}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      <em>None</em>
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.categories_id}
                        value={category.categories_id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="subcategory_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategory</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value === 'none' ? undefined : value);
                  }}
                  value={field.value ?? 'none'}
                  disabled={
                    isLoading ||
                    !watchedCategoryId ||
                    filteredSubcategories.length === 0
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !watchedCategoryId
                            ? 'Select category first'
                            : filteredSubcategories.length === 0
                              ? 'No subcategories available'
                              : 'Select subcategory'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      <em>None</em>
                    </SelectItem>
                    {filteredSubcategories.map((subcategory) => (
                      <SelectItem
                        key={subcategory.id}
                        value={subcategory.id.toString()}
                      >
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  {filteredSubcategories.length === 0 && watchedCategoryId
                    ? 'No subcategories found for selected category.'
                    : ''}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="brand_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value === 'none' ? undefined : value);
                  }}
                  value={field.value ?? 'none'}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">
                      <em>None</em>
                    </SelectItem>
                    {brands.map((brand) => (
                      <SelectItem
                        key={brand.brands_id}
                        value={brand.brands_id.toString()}
                      >
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="mark"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Mark</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === 'none' ? null : value)
                  }
                  value={field.value ?? 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a mark (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="selling fast">Selling Fast</SelectItem>
                    <SelectItem value="Trending now">Trending Now</SelectItem>
                    <SelectItem value="Must Have">Must Have</SelectItem>
                    <SelectItem value="Loved by Many">Loved by Many</SelectItem>
                    <SelectItem value="best seller">Best Seller</SelectItem>
                    <SelectItem value="limited edition">
                      Limited Edition
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Optional badge to display on the product.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="rating_average"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating Average</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="e.g., 4.5"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Manual rating average (0.0 to 5.0).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="rating_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating Count</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g., 120"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined
                      )
                    }
                  />
                </FormControl>
                <FormDescription>Manual rating count.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="short_description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Short Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of the product"
                    className="resize-none"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Full Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detailed description of the product"
                    className="min-h-[200px]"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter comma-separated tags"
                    defaultValue={field.value ? field.value.join(', ') : ''}
                    onChange={(e) => {
                      const tagsArray = e.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter((tag) => tag !== '');
                      field.onChange(tagsArray);
                    }}
                    name={field.name}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    disabled={field.disabled}
                  />
                </FormControl>
                <FormDescription>
                  Separate tags with commas. e.g., sale, new, featured
                </FormDescription>
                <div className="mt-2 flex flex-wrap gap-1">
                  {field.value?.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
