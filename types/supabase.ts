export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: string;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          role: string;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: string;
          created_at?: string;
          last_login?: string | null;
        };
      };
      products: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          short_description: string | null;
          sku: string | null;
          category_id: number | null;
          brand_id: number | null;
          price: number;
          compare_at_price: number | null;
          cost_price: number | null;
          currency_code: string;
          track_inventory: boolean;
          quantity: number;
          backorderable: boolean;
          low_stock_threshold: number;
          reserved_quantity: number;
          max_stock: number | null;
          weight: number | null;
          weight_unit: string;
          dimensions_length: number | null;
          dimensions_width: number | null;
          dimensions_height: number | null;
          dimensions_unit: string;
          shipping_required: boolean;
          shipping_class: string | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string[] | null;
          rating_average: number;
          rating_count: number;
          status: string;
          is_limited_edition: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          description?: string | null;
          short_description?: string | null;
          sku?: string | null;
          category_id?: number | null;
          brand_id?: number | null;
          price: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          currency_code?: string;
          track_inventory?: boolean;
          quantity?: number;
          backorderable?: boolean;
          low_stock_threshold?: number;
          reserved_quantity?: number;
          max_stock?: number | null;
          weight?: number | null;
          weight_unit?: string;
          dimensions_length?: number | null;
          dimensions_width?: number | null;
          dimensions_height?: number | null;
          dimensions_unit?: string;
          shipping_required?: boolean;
          shipping_class?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          rating_average?: number;
          rating_count?: number;
          status?: string;
          is_limited_edition?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          description?: string | null;
          short_description?: string | null;
          sku?: string | null;
          category_id?: number | null;
          brand_id?: number | null;
          price?: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          currency_code?: string;
          track_inventory?: boolean;
          quantity?: number;
          backorderable?: boolean;
          low_stock_threshold?: number;
          reserved_quantity?: number;
          max_stock?: number | null;
          weight?: number | null;
          weight_unit?: string;
          dimensions_length?: number | null;
          dimensions_width?: number | null;
          dimensions_height?: number | null;
          dimensions_unit?: string;
          shipping_required?: boolean;
          shipping_class?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          rating_average?: number;
          rating_count?: number;
          status?: string;
          is_limited_edition?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: number;
          product_id: number;
          url: string;
          alt: string | null;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          product_id: number;
          url: string;
          alt?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          product_id?: number;
          url?: string;
          alt?: string | null;
          is_primary?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      product_attributes: {
        Row: {
          id: number;
          product_id: number;
          name: string;
          value: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          product_id: number;
          name: string;
          value: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          product_id?: number;
          name?: string;
          value?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          short_description: string | null;
          image: string | null;
          banner: string | null;
          parent_id: number | null;
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string[] | null;
          status: string;
          display_order: number;
          include_in_menu: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          description?: string | null;
          short_description?: string | null;
          image?: string | null;
          banner?: string | null;
          parent_id?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          status?: string;
          display_order?: number;
          include_in_menu?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          description?: string | null;
          short_description?: string | null;
          image?: string | null;
          banner?: string | null;
          parent_id?: number | null;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          status?: string;
          display_order?: number;
          include_in_menu?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          long_banner_url: string | null;
          short_banner_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          long_banner_url?: string | null;
          short_banner_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          long_banner_url?: string | null;
          short_banner_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
