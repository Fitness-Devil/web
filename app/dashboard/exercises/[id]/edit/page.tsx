'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { InlineNotice } from '@/components/ui/inline-notice';
import { apiFetch } from '@/lib/rest-client';

type LibraryExercise = {
  id: string;
  name: string;
  description: string | null;
};

export default function EditExercisePage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.id as string;
  const [exercise, setExercise] = useState<LibraryExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<LibraryExercise>(`/v1/exercise-library/${exerciseId}`);
        setExercise(data);
        setName(data?.name || '');
        setDescription(data?.description || '');
      } catch (error) {
        setNotice({ type: 'error', message: (error as Error).message });
      } finally {
        setLoading(false);
      }
    };

    if (exerciseId) {
      load();
    }
  }, [exerciseId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/v1/exercise-library/${exerciseId}`, {
        method: 'PUT',
        body: {
          name,
          description: description || null,
        },
      });
      setNotice({ type: 'success', message: 'Exercise updated.' });
      router.push('/dashboard/exercises');
    } catch (error) {
      setNotice({ type: 'error', message: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading exercise...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-white">Exercise Not Found</CardTitle>
            <CardDescription className="text-destructive">
              {notice?.message || 'Unable to load exercise.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/exercises">
              <Button variant="outline" className="border-white/10 bg-white/5 text-white">
                Back to Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}
      <Link href="/dashboard/exercises">
        <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white">
          ← Back to Library
        </Button>
      </Link>

      <Card className="border-white/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Edit Exercise</CardTitle>
          <CardDescription>Update exercise details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description (optional)"
            />
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
