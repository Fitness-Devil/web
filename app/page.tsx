'use client';

import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 pb-10">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Training OS
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Become a{" "}
            <span className="text-primary">Fitness Devil</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            A focused command center for workouts, meal planning, and progress analytics.
            Designed for consistency, built for momentum.
          </p>

          {session ? (
            <div className="rounded-2xl border border-white/10 bg-card/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Welcome back
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {session.user?.name || session.user?.email}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your personalized dashboard is ready to go.
              </p>
              {session.user?.roles && session.user.roles.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {session.user.roles.map((role: string) => (
                    <span
                      key={role}
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-200"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4">
              <p className="text-sm text-muted-foreground">
                Get started by creating an account or signing in.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/auth/signup"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-7 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                  Get Started
                </a>
                <a
                  href="/auth/signin"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 bg-white/5 px-7 text-sm font-medium text-white shadow-sm hover:bg-white/10"
                >
                  Sign In
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-card/70 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Today
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Push Day</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                AI recommended • 90 mins • Strength focus
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Target
              </p>
              <p className="mt-1 text-lg font-semibold text-primary">90</p>
              <p className="text-xs text-muted-foreground">mins</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              { title: 'Bench Press', info: '4 sets • 6-8 reps', tag: 'Compound' },
              { title: 'Incline Dumbbell', info: '3 sets • 10 reps', tag: 'Accessory' },
              { title: 'Tricep Dips', info: '3 sets • 12 reps', tag: 'Volume' },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.info}</p>
                </div>
                <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="h-11 flex-1 rounded-md bg-primary text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
              Start Workout
            </button>
            <button className="h-11 flex-1 rounded-md border border-white/10 bg-white/5 text-sm font-medium text-white hover:bg-white/10">
              View Details
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Keycloak Auth',
            description: 'Enterprise-grade identity with role-based access control.',
          },
          {
            title: 'GraphQL API',
            description: 'Unified data layer powered by Quarkus services.',
          },
          {
            title: 'Fitness Tracking',
            description: 'Workouts, nutrition, and analytics in one workspace.',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-white/10 bg-card/70 p-5"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {item.title}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
