'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
  lowStockProducts: number;
  loading: boolean;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalBrands: 0,
    lowStockProducts: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        // Fetch total products
        const { count: totalProducts } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Fetch total categories
        const { count: totalCategories } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });

        // Fetch total brands
        const { count: totalBrands } = await supabase
          .from('brands')
          .select('*', { count: 'exact', head: true });

        // Fetch low stock products
        const { data: lowStockData } = await supabase
          .from('products')
          .select('id')
          .lt('quantity', 'low_stock_threshold');

        setStats({
          totalProducts: totalProducts || 0,
          totalCategories: totalCategories || 0,
          totalBrands: totalBrands || 0,
          lowStockProducts: lowStockData?.length || 0,
          loading: false,
        });
      } catch (error) {
        console.error(
          '[DashboardPage:useEffect:FetchStats] Error fetching dashboard stats:',
          error
        );
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchDashboardStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your HAEV Admin dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              +2.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">+3.1%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brands</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBrands}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500">+0.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Products
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockProducts}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
              <span className="text-red-500">+12.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent product management activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New product added</p>
                  <p className="text-xs text-muted-foreground">
                    Premium Leather Jacket was added to inventory
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">2h ago</div>
              </div>
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Category updated</p>
                  <p className="text-xs text-muted-foreground">
                    Outerwear category description was updated
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">5h ago</div>
              </div>
              <div className="flex items-center">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Brand added</p>
                  <p className="text-xs text-muted-foreground">
                    New brand "Urban Styles" was added
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">1d ago</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
            <CardDescription>
              Overview of your product inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div>In Stock</div>
                  <div className="font-medium">78%</div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: '78%' }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div>Low Stock</div>
                  <div className="font-medium">15%</div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: '15%' }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div>Out of Stock</div>
                  <div className="font-medium">7%</div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-red-500" style={{ width: '7%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
