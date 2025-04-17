import { z } from 'zod';

export const testimonialFormSchema = z.object({
  product_id: z.string().min(1, { message: 'Please select a product' }), // Required, comes as string from select
  customer_name: z
    .string()
    .min(2, { message: 'Customer name must be at least 2 characters' }),
  testimonial_text: z
    .string()
    .min(10, { message: 'Testimonial text must be at least 10 characters' }),
  rating: z.coerce // Use coerce to handle string input from form elements
    .number()
    .min(1, { message: 'Rating must be at least 1' })
    .max(5, { message: 'Rating must be at most 5' })
    .int({ message: 'Rating must be a whole number' })
    .optional()
    .nullable(), // Allow rating to be optional
  customer_image_url: z
    .string()
    .url({ message: 'Please enter a valid URL' })
    .optional()
    .or(z.literal('')) // Allow empty string
    .nullable(), // Allow null
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

// Type for data fetched from the DB (includes id, created_at etc)
export type CustomerTestimonial = Omit<TestimonialFormValues, 'product_id'> & {
  id: number;
  product_id: number; // Correct type for DB data
  created_at: string;
  updated_at: string;
  // For display, we might fetch product name
  products?: { name: string }[] | null; // For joined data (might be an array)
};
