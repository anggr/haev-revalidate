'use client';

import { UseFormReturn, useFieldArray, Control } from 'react-hook-form';
import {
  ProductFormValues,
  ProductTestimonialVideoValues,
} from '@/app/(admin)/products/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';

interface ProductTestimonialVideoFormProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductTestimonialVideoForm({
  form,
}: ProductTestimonialVideoFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'testimonial_videos',
  });

  const addVideo = () => {
    append({ video_url: '', title: '', description: '', uploader_name: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testimonial Videos</CardTitle>
        <CardDescription>
          Add URLs for testimonial videos related to this product.
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
              className="absolute top-2 right-2 text-destructive hover:text-destructive-foreground hover:bg-destructive"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <FormField
              control={form.control}
              name={`testimonial_videos.${index}.video_url`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`testimonial_videos.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Customer Testimonial"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`testimonial_videos.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the video..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`testimonial_videos.${index}.uploader_name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uploader Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addVideo}>
          Add Testimonial Video
        </Button>
      </CardContent>
    </Card>
  );
}
