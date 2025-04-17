import { UseFormReturn, useFieldArray, Control } from 'react-hook-form';
import { ProductFormValues } from '@/app/(admin)/products/schema';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, PlusCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/image-uploader';

interface ProductVariantsFormProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductVariantsForm({ form }: ProductVariantsFormProps) {
  const { control } = form;
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: 'variants',
  });

  // Default values for a new variant
  const defaultVariant = {
    name: '',
    price: null,
    compare_at_price: null,
    sku: null,
    quantity: null,
    image_url: '',
    icon_url: '',
    attributes: [{ name: '', value: '' }],
    variant_features: [],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Variants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {variantFields.map((variantField, variantIndex) => (
          <div
            key={variantField.id}
            className="space-y-4 rounded-md border p-4 relative"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeVariant(variantIndex)}
              className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
              aria-label="Remove variant"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <h4 className="font-medium text-lg mb-4">
              Variant #{variantIndex + 1}
            </h4>

            {/* ADDED: Variant Name Field */}
            <FormField
              control={control}
              name={`variants.${variantIndex}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Large Red Shirt"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this specific variant (e.g., "Large",
                    "Red").
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variant Attributes (Name/Value Pairs) */}
            <VariantAttributesSubForm
              variantIndex={variantIndex}
              control={control}
            />

            {/* Optional Overrides (Price, SKU, Quantity, Image) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {/* --- Price Field --- */}
              <FormField
                control={control}
                name={`variants.${variantIndex}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Variant price"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* --- Compare At Price Field --- */}
              <FormField
                control={control}
                name={`variants.${variantIndex}.compare_at_price`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compare Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Optional compare price"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* --- SKU Field --- */}
              <FormField
                control={control}
                name={`variants.${variantIndex}.sku`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Variant SKU"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* --- Quantity Field --- */}
              <FormField
                control={control}
                name={`variants.${variantIndex}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Variant quantity"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* --- Image URL Field --- */}
              <FormField
                control={control}
                name={`variants.${variantIndex}.image_url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://.../image.jpg"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional URL for the variant image.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ADDED: Variant Icon URL Field */}
            <FormField
              control={control}
              name={`variants.${variantIndex}.icon_url`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Icon URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://.../icon.png"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional URL for the variant icon.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variant-Specific Features */}
            <VariantFeaturesSubForm
              variantIndex={variantIndex}
              control={control}
            />
          </div>
        ))}

        {variantFields.length > 0 && <Separator />}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendVariant(defaultVariant)}
        >
          Add Variant
        </Button>
        <FormDescription>
          Add variants for different options (e.g., size, color). Define
          attributes and optionally override price/SKU/quantity. Add features
          specific to this variant group.
        </FormDescription>
      </CardContent>
    </Card>
  );
}

// --- Helper Sub-component for Variant Attributes ---
interface VariantAttributesSubFormProps {
  variantIndex: number;
  control: Control<ProductFormValues>;
}

function VariantAttributesSubForm({
  variantIndex,
  control,
}: VariantAttributesSubFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variants.${variantIndex}.attributes`,
  });

  return (
    <div className="space-y-4 rounded-md border border-dashed p-4">
      <h5 className="font-medium text-md mb-2">Variant Attributes</h5>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-end space-x-2">
          <FormField
            control={control}
            name={`variants.${variantIndex}.attributes.${index}.name`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Attribute Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Color" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`variants.${variantIndex}.attributes.${index}.value`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Attribute Value</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Red" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            className="text-destructive hover:bg-destructive/10 mb-1"
            aria-label="Remove variant attribute"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex justify-start">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ name: '', value: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Attribute
        </Button>
      </div>
    </div>
  );
}

// --- Helper Sub-component for Variant Features ---
interface VariantFeaturesSubFormProps {
  variantIndex: number;
  control: Control<ProductFormValues>;
}

function VariantFeaturesSubForm({
  variantIndex,
  control,
}: VariantFeaturesSubFormProps) {
  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray({
    control,
    name: `variants.${variantIndex}.variant_features`,
  });

  // Default values for a new variant feature
  const defaultFeature = {
    feature_text: '',
    icon_url: '',
  };

  return (
    <div className="space-y-4 rounded-md border border-dashed p-4">
      <h5 className="font-medium text-md mb-2">Variant-Specific Features</h5>
      {featureFields.map((field, featureIndex) => (
        <div key={field.id} className="flex items-end space-x-2">
          <FormField
            control={control}
            name={`variants.${variantIndex}.variant_features.${featureIndex}.feature_text`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Feature Text</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Material: 100% Cotton"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ADDED: Variant Feature Icon URL Field */}
          <FormField
            control={control}
            name={`variants.${variantIndex}.variant_features.${featureIndex}.icon_url`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Feature Icon URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://.../feature-icon.png"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeFeature(featureIndex)}
            className="text-destructive hover:bg-destructive/10 mb-1"
            aria-label="Remove variant feature"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex justify-start">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendFeature(defaultFeature)}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Feature
        </Button>
      </div>
    </div>
  );
}
