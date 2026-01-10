'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineNotice } from '@/components/ui/inline-notice';
import { apiFetch } from '@/lib/rest-client';

interface MealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MealPlannerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMealPlans = useCallback(async () => {
    if (!session?.user?.id) {
      setMealPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<MealPlan[] | MealPlan>(`/meal-plans/user/${session.user.id}`);
      setMealPlans(Array.isArray(data) ? data : []);
      setError(null);
    } catch (fetchError) {
      setError(fetchError as Error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  const handleDelete = async (planId: string, planName: string) => {
    if (confirm(`Are you sure you want to delete "${planName}"? This action cannot be undone.`)) {
      setDeleting(true);
      try {
        await apiFetch<boolean>(`/meal-plans/${planId}`, { method: 'DELETE' });
        await fetchMealPlans();
      } catch (deleteError) {
        setNotice({
          type: 'error',
          message: `Failed to delete meal plan: ${(deleteError as Error).message}`,
        });
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleActivate = async (planId: string) => {
    // First, deactivate all other plans
    setUpdating(true);
    try {
      const updatePromises = mealPlans
        .filter(p => p.isActive && p.id !== planId)
        .map(p =>
          apiFetch(`/meal-plans/${p.id}`, {
            method: 'PUT',
            body: {
              isActive: false,
            },
          })
        );

      await Promise.all(updatePromises);

      // Then activate the selected plan
      await apiFetch(`/meal-plans/${planId}`, {
        method: 'PUT',
        body: {
          isActive: true,
        },
      });

      await fetchMealPlans();
    } catch (updateError) {
      setNotice({
        type: 'error',
        message: `Failed to update meal plan: ${(updateError as Error).message}`,
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDuplicate = async (plan: MealPlan) => {
    if (!session?.user?.id) {
      setNotice({ type: 'error', message: 'You must be logged in to duplicate a meal plan.' });
      return;
    }

    const today = new Date();
    const duration = new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime();
    const durationDays = Math.ceil(duration / (1000 * 60 * 60 * 24));

    const newStartDate = today.toISOString().split('T')[0];
    const newEndDate = new Date(today.getTime() + duration).toISOString().split('T')[0];

    setDuplicating(true);
    try {
      const data = await apiFetch<MealPlan>('/meal-plans', {
        method: 'POST',
        body: {
          userId: session.user.id,
          name: `${plan.name} (Copy)`,
          startDate: newStartDate,
          endDate: newEndDate,
        },
      });
      await fetchMealPlans();
      router.push(`/dashboard/meal-planner/${data.id}`);
    } catch (createError) {
      setNotice({
        type: 'error',
        message: `Failed to duplicate meal plan: ${(createError as Error).message}`,
      });
    } finally {
      setDuplicating(false);
    }
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading meal plans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Error Loading Meal Plans</CardTitle>
            <CardDescription className="text-destructive">
              {error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}
      {/* Header */}
      <div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Meal Planner</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Meal Planner</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create and manage your custom meal plans.
            </p>
          </div>
          <Link href="/dashboard/meal-planner/new">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Create New Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Plan */}
      {mealPlans.filter(p => p.isActive).map((plan) => (
        <Card key={plan.id} className="border-white/10 bg-card/80">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    ACTIVE
                  </span>
                </div>
                <CardDescription className="text-base">
                  {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Duration</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {calculateDays(plan.startDate, plan.endDate)} days
                </p>
              </div>
              <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4">
                <Link href={`/dashboard/meal-planner/${plan.id}`}>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    View & Edit Plan
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Past Plans */}
      <div>
        <h2 className="text-xl font-semibold text-white">Past Meal Plans</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mealPlans.filter(p => !p.isActive).map((plan) => (
          <Card key={plan.id} className="border-white/10 bg-card/70">
            <CardHeader>
              <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
              <CardDescription>
                {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Duration</span>
                  <span className="font-medium text-white">
                    {calculateDays(plan.startDate, plan.endDate)} days
                  </span>
                </div>
                <div className="space-y-2 mt-4">
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                    onClick={() => handleActivate(plan.id)}
                    disabled={updating}
                  >
                    {updating ? 'Activating...' : 'Set as Active'}
                  </Button>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/meal-planner/${plan.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white" size="sm">
                        View
                      </Button>
                    </Link>
                    <Button
                      className="flex-1 bg-white/10 text-white hover:bg-white/20"
                      size="sm"
                      onClick={() => handleDuplicate(plan)}
                      disabled={duplicating}
                    >
                      {duplicating ? 'Duplicating...' : 'Duplicate'}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    size="sm"
                    onClick={() => handleDelete(plan.id, plan.name)}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {mealPlans.length === 0 && (
        <Card className="border-white/10 bg-card/70">
          <CardHeader>
            <CardTitle className="text-white">No Meal Plans Yet</CardTitle>
            <CardDescription>
              Create your first meal plan to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/meal-planner/new">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Create Your First Plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
