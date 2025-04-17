'use client';

import type React from 'react';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { X, Upload, Loader2, LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  bucketName?: string;
  folderPath?: string;
}

export function ImageUploader({
  value = [],
  onChange,
  maxImages = 5,
  bucketName = 'product-images',
  folderPath = 'products',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed the max number of images
    if (value.length + files.length > maxImages) {
      toast({
        variant: 'destructive',
        title: 'Too many images',
        description: `You can only upload a maximum of ${maxImages} images.`,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const newUrls: string[] = [];
    let completedUploads = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Create a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExt}`;
        const filePath = `${folderPath}/${fileName}`;

        // Upload the file to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);

        // Update progress
        completedUploads++;
        setUploadProgress(Math.round((completedUploads / files.length) * 100));
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: error.message || 'Failed to upload image',
        });
      }
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsUploading(false);
    setUploadProgress(0);

    // Update the value with new URLs
    onChange([...value, ...newUrls]);
  };

  const handleUrlInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
  };

  const handleAddUrl = () => {
    // Validate URL
    const urlSchema = z.string().url({ message: 'Please enter a valid URL.' });
    const validationResult = urlSchema.safeParse(urlInput);

    if (!validationResult.success) {
      toast({
        variant: 'destructive',
        title: 'Invalid URL',
        description: validationResult.error.errors[0].message,
      });
      return;
    }

    if (value.length >= maxImages) {
      toast({
        variant: 'destructive',
        title: 'Maximum images reached',
        description: `You cannot add more than ${maxImages} images.`,
      });
      return;
    }

    // Add the validated URL
    onChange([...value, validationResult.data]);
    setUrlInput(''); // Clear the input
    toast({
      title: 'Image URL added',
      description: 'The image URL has been successfully added.',
    });
  };

  const handleRemoveImage = async (urlToRemove: string) => {
    // Check if it's a Supabase URL before attempting deletion
    let isSupabaseUrl = false;
    try {
      const urlObj = new URL(urlToRemove);
      isSupabaseUrl = urlObj.hostname.endsWith('supabase.co'); // Adjust if your Supabase domain is different
    } catch (e) {
      // If it's not a valid URL, it's definitely not a Supabase URL we manage
      isSupabaseUrl = false;
    }

    if (isSupabaseUrl) {
      try {
        const urlObj = new URL(urlToRemove);
        const pathMatch = urlObj.pathname.match(
          new RegExp(`/storage/v1/object/public/${bucketName}/(.+)$`)
        ); // Updated regex for common Supabase path

        if (pathMatch && pathMatch[1]) {
          const filePath = pathMatch[1];

          // Delete the file from storage
          const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);
          if (error) {
            console.error(
              '[ImageUploader:handleRemoveImage:StorageDelete] Error removing file from storage:',
              error
            );
            toast({
              variant: 'destructive',
              title: 'Error removing image',
              description: error.message || 'Failed to remove image',
            });
          }
        } else {
          console.warn(
            'Could not extract file path from Supabase URL:',
            urlToRemove
          );
        }
      } catch (error) {
        console.error(
          '[ImageUploader:handleRemoveImage:UrlProcessing] Error processing Supabase URL for removal:',
          error
        );

        // Type check for the error object
        let errorMessage = 'Failed to process image URL';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        toast({
          variant: 'destructive',
          title: 'Error processing image URL',
          description: errorMessage,
        });
      }
    }

    // Update the value by removing the URL
    onChange(value.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {value.map((url, index) => (
          <div
            key={index}
            className="group relative h-24 w-24 overflow-hidden rounded-md border"
          >
            <Image
              src={url || '/placeholder.svg'}
              alt={`Product image ${index + 1}`}
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(url)}
              className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
        disabled={isUploading || value.length >= maxImages}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        {/* File Upload Button */}
        <div className="flex-grow">
          <p className="text-xs text-muted-foreground mb-1">
            Upload from device:
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || value.length >= maxImages}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {value.length > 0 ? 'Upload More' : 'Upload Images'}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1 sm:hidden">
            Up to {maxImages} images. PNG, JPG, GIF up to 5MB each.
          </p>
        </div>

        {/* URL Input */}
        <div className="flex-grow">
          <p className="text-xs text-muted-foreground mb-1">
            Or add image URL:
          </p>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={handleUrlInputChange}
              disabled={isUploading || value.length >= maxImages}
              className="h-9 flex-grow"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddUrl}
              disabled={isUploading || !urlInput || value.length >= maxImages}
              className="h-9 px-3"
            >
              <LinkIcon className="h-4 w-4" />
              <span className="ml-2">Add URL</span>
            </Button>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground hidden sm:block">
        Upload up to {maxImages} images. PNG, JPG, GIF up to 5MB each.
      </p>
    </div>
  );
}
