'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineNotice } from '@/components/ui/inline-notice';
import { apiFetch } from '@/lib/rest-client';

type ExerciseDraft = {
  name: string;
  description: string;
  sets: string;
  reps: string;
  durationSeconds: string;
  restSeconds: string;
  libraryExerciseId?: string | null;
};

type LibraryExercise = {
  id: string;
  name: string;
  description: string | null;
};

const difficultyOptions = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export default function NewWorkoutTemplatePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [difficulty, setDifficulty] = useState<(typeof difficultyOptions)[number]>('BEGINNER');
  const [exerciseDraft, setExerciseDraft] = useState<ExerciseDraft>({
    name: '',
    description: '',
    sets: '',
    reps: '',
    durationSeconds: '',
    restSeconds: '',
  });
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  const [creatingLibrary, setCreatingLibrary] = useState(false);
  const [libraryDraft, setLibraryDraft] = useState({ name: '', description: '' });

  useEffect(() => {
    const loadLibrary = async () => {
      if (!session?.user?.id) return;
      try {
        if (librarySearch) {
          const data = await apiFetch<LibraryExercise[]>(
            '/v1/exercise-library/search',
            {
              query: {
                query: librarySearch,
                userId: session.user.id,
              },
            }
          );
          setLibraryExercises(data || []);
          return;
        }
        const data = await apiFetch<LibraryExercise[]>(
          `/v1/exercise-library/available/${session.user.id}`
        );
        setLibraryExercises(data || []);
      } catch (error) {
        setNotice({ type: 'error', message: (error as Error).message });
      }
    };

    loadLibrary();
  }, [librarySearch, session?.user?.id]);

  const handleAddExercise = () => {
    if (!exerciseDraft.name) {
      setNotice({ type: 'info', message: 'Exercise name is required.' });
      return;
    }
    setExercises((prev) => [...prev, exerciseDraft]);
    setExerciseDraft({
      name: '',
      description: '',
      sets: '',
      reps: '',
      durationSeconds: '',
      restSeconds: '',
      libraryExerciseId: null,
    });
  };

  const handleAddFromLibrary = () => {
    if (!selectedLibraryId) {
      setNotice({ type: 'info', message: 'Select a library exercise.' });
      return;
    }
    const exercise = libraryExercises.find((item) => item.id === selectedLibraryId);
    if (!exercise) {
      setNotice({ type: 'error', message: 'Library exercise not found.' });
      return;
    }
    setExercises((prev) => [
      ...prev,
      {
        name: exercise.name,
        description: exercise.description || '',
        sets: '',
        reps: '',
        durationSeconds: '',
        restSeconds: '',
        libraryExerciseId: exercise.id,
      },
    ]);
  };

  const handleCreateLibraryExercise = async () => {
    if (!libraryDraft.name) {
      setNotice({ type: 'info', message: 'Library exercise name is required.' });
      return;
    }
    setCreatingLibrary(true);
    try {
      const response = await apiFetch<{ exerciseId?: string } | string>('/v1/exercise-library', {
        method: 'POST',
        body: {
          name: libraryDraft.name,
          description: libraryDraft.description || null,
          userId: session?.user?.id || null,
        },
      });
      setLibraryDraft({ name: '', description: '' });
      setLibrarySearch('');
      const newId = typeof response === 'string' ? response : response?.exerciseId;
      if (newId) {
        setSelectedLibraryId(newId);
      }
    } catch (error) {
      setNotice({ type: 'error', message: (error as Error).message });
    } finally {
      setCreatingLibrary(false);
    }
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateExercise = (index: number, patch: Partial<ExerciseDraft>) => {
    setExercises((prev) =>
      prev.map((exercise, idx) => (idx === index ? { ...exercise, ...patch } : exercise))
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.user?.id) {
      setNotice({ type: 'error', message: 'You must be logged in to create a template.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        userId: session.user.id,
        name,
        description: description || null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        difficulty,
        exercises: exercises.map((exercise, index) => ({
          name: exercise.name,
          description: exercise.description || null,
          sets: exercise.sets ? Number(exercise.sets) : null,
          reps: exercise.reps ? Number(exercise.reps) : null,
          durationSeconds: exercise.durationSeconds ? Number(exercise.durationSeconds) : null,
          restSeconds: exercise.restSeconds ? Number(exercise.restSeconds) : null,
          orderIndex: index,
          libraryExerciseId: exercise.libraryExerciseId || null,
        })),
      };

      const id = await apiFetch<string>('/workouts', {
        method: 'POST',
        body: payload,
      });

      setNotice({ type: 'success', message: 'Workout template created.' });
      router.push(`/dashboard/workouts/${id}`);
    } catch (error) {
      setNotice({ type: 'error', message: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}
      <Link href="/dashboard/workouts">
        <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white">
          ← Back to Workouts
        </Button>
      </Link>

      <Card className="border-white/10 bg-card/80">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Create Workout Template</CardTitle>
          <CardDescription>Define a workout plan and add exercises.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Template Name</label>
                <Input value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Difficulty</label>
                <Select value={difficulty} onValueChange={(value) => setDifficulty(value as any)}>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Description</label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Estimated Duration (minutes)</label>
              <Input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
              />
            </div>

            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-base text-white">Exercises</CardTitle>
                <CardDescription>Add exercises to the template.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Exercise Library</p>
                  <Input
                    placeholder="Search library"
                    value={librarySearch}
                    onChange={(event) => setLibrarySearch(event.target.value)}
                  />
                  <Select value={selectedLibraryId} onValueChange={setSelectedLibraryId}>
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue placeholder="Select an exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      {libraryExercises.map((exercise) => (
                        <SelectItem key={exercise.id} value={exercise.id}>
                          {exercise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddFromLibrary}>
                    Add From Library
                  </Button>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="New library exercise"
                      value={libraryDraft.name}
                      onChange={(event) =>
                        setLibraryDraft((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                    <Input
                      placeholder="Description"
                      value={libraryDraft.description}
                      onChange={(event) =>
                        setLibraryDraft((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={handleCreateLibraryExercise} disabled={creatingLibrary}>
                    {creatingLibrary ? 'Creating...' : 'Create Library Exercise'}
                  </Button>
                </div>

                {exercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No exercises added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {exercises.map((exercise, index) => (
                      <div
                        key={`${exercise.name}-${index}`}
                        className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{exercise.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {exercise.sets || '0'} sets • {exercise.reps || '0'} reps
                            </p>
                            {exercise.libraryExerciseId ? (
                              <p className="text-xs uppercase tracking-[0.2em] text-primary">
                                Library linked
                              </p>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white"
                            onClick={() => handleRemoveExercise(index)}
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <Input
                            placeholder="Exercise name"
                            value={exercise.name}
                            onChange={(event) =>
                              handleUpdateExercise(index, { name: event.target.value })
                            }
                          />
                          <Input
                            placeholder="Description"
                            value={exercise.description}
                            onChange={(event) =>
                              handleUpdateExercise(index, { description: event.target.value })
                            }
                          />
                          <Input
                            placeholder="Sets"
                            value={exercise.sets}
                            onChange={(event) =>
                              handleUpdateExercise(index, { sets: event.target.value })
                            }
                          />
                          <Input
                            placeholder="Reps"
                            value={exercise.reps}
                            onChange={(event) =>
                              handleUpdateExercise(index, { reps: event.target.value })
                            }
                          />
                          <Input
                            placeholder="Duration (sec)"
                            value={exercise.durationSeconds}
                            onChange={(event) =>
                              handleUpdateExercise(index, { durationSeconds: event.target.value })
                            }
                          />
                          <Input
                            placeholder="Rest (sec)"
                            value={exercise.restSeconds}
                            onChange={(event) =>
                              handleUpdateExercise(index, { restSeconds: event.target.value })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Exercise name"
                    value={exerciseDraft.name}
                    onChange={(event) =>
                      setExerciseDraft((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Description"
                    value={exerciseDraft.description}
                    onChange={(event) =>
                      setExerciseDraft((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Sets"
                    value={exerciseDraft.sets}
                    onChange={(event) =>
                      setExerciseDraft((prev) => ({ ...prev, sets: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Reps"
                    value={exerciseDraft.reps}
                    onChange={(event) =>
                      setExerciseDraft((prev) => ({ ...prev, reps: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Duration (sec)"
                    value={exerciseDraft.durationSeconds}
                    onChange={(event) =>
                      setExerciseDraft((prev) => ({ ...prev, durationSeconds: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Rest (sec)"
                    value={exerciseDraft.restSeconds}
                    onChange={(event) =>
                      setExerciseDraft((prev) => ({ ...prev, restSeconds: event.target.value }))
                    }
                  />
                </div>
                <Button type="button" onClick={handleAddExercise}>
                  Add Exercise
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                disabled={saving || !name}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? 'Saving...' : 'Create Template'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
