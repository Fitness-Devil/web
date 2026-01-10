'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function ExerciseLibraryPage() {
  const { data: session } = useSession();
  const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );
  const [draft, setDraft] = useState({ name: '', description: '' });

  const loadLibrary = async () => {
    if (!session?.user?.id) {
      setLibraryExercises([]);
      return;
    }
    setLoading(true);
    try {
      if (search) {
        const data = await apiFetch<LibraryExercise[]>(
          '/v1/exercise-library/search',
          {
            query: {
              query: search,
              userId: session.user.id,
            },
          }
        );
        setLibraryExercises(data || []);
      } else {
        const data = await apiFetch<LibraryExercise[]>(
          `/v1/exercise-library/available/${session.user.id}`
        );
        setLibraryExercises(data || []);
      }
    } catch (error) {
      setNotice({ type: 'error', message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [search]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name) {
      setNotice({ type: 'info', message: 'Exercise name is required.' });
      return;
    }

    setSaving(true);
    try {
      await apiFetch('/v1/exercise-library', {
        method: 'POST',
        body: {
          name: draft.name,
          description: draft.description || null,
          userId: session?.user?.id || null,
        },
      });
      setDraft({ name: '', description: '' });
      await loadLibrary();
      setNotice({ type: 'success', message: 'Exercise added to library.' });
    } catch (error) {
      setNotice({ type: 'error', message: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-6xl flex-col gap-8 overflow-hidden">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Exercise Library</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Reusable Exercises</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create and manage exercises shared across templates.
        </p>
      </div>

      <Card className="border-white/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-white">Create Exercise</CardTitle>
          <CardDescription className="text-muted-foreground">
            Add a new reusable exercise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreate}>
            <Input
              placeholder="Exercise name"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <Textarea
              placeholder="Description (optional)"
              value={draft.description}
              onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            />
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add to Library'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col border-white/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-white">Library</CardTitle>
          <CardDescription className="text-muted-foreground">
            Search and browse your saved exercises.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col space-y-4">
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="py-6 text-sm text-muted-foreground">Loading exercises...</div>
            ) : libraryExercises.length === 0 ? (
              <div className="py-6 text-sm text-muted-foreground">No exercises found.</div>
            ) : (
              <div className="space-y-3">
                {libraryExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{exercise.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {exercise.description || 'No description'}
                      </p>
                    </div>
                    <Link href={`/dashboard/exercises/${exercise.id}/edit`}>
                      <Button
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white"
                      >
                        Edit
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
