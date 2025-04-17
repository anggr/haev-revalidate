'use client';

import { UseFormReturn, useFieldArray, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle } from 'lucide-react';
import { ProductFormValues } from '@/app/(admin)/products/schema'; // Adjust path if needed

interface ProductFaqFormProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductFaqForm({ form }: ProductFaqFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'faqs',
  });

  const {
    formState: { errors },
  } = form;

  // Helper to get nested errors
  const getFaqError = (index: number, field: 'question' | 'answer') => {
    return errors.faqs?.[index]?.[field]?.message;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
        <CardDescription>
          Add common questions and answers related to this product.
        </CardDescription>
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
              className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove FAQ</span>
            </Button>
            <div className="space-y-2">
              <Label htmlFor={`faqs.${index}.question`}>Question</Label>
              <Controller
                name={`faqs.${index}.question`}
                control={form.control}
                render={({ field }) => (
                  <Input
                    id={`faqs.${index}.question`}
                    placeholder="e.g., What is the warranty?"
                    {...field}
                  />
                )}
              />
              {getFaqError(index, 'question') && (
                <p className="text-sm text-destructive">
                  {getFaqError(index, 'question')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`faqs.${index}.answer`}>Answer</Label>
              <Controller
                name={`faqs.${index}.answer`}
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    id={`faqs.${index}.answer`}
                    placeholder="Provide a clear answer."
                    {...field}
                  />
                )}
              />
              {getFaqError(index, 'answer') && (
                <p className="text-sm text-destructive">
                  {getFaqError(index, 'answer')}
                </p>
              )}
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ question: '', answer: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add FAQ
        </Button>
      </CardContent>
    </Card>
  );
}
