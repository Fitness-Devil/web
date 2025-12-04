'use client';

import Image from "next/image";
import { AuthButton } from "@/components/auth/auth-button";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-4xl space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                Fitness Devil
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Your personal fitness tracking application powered by Keycloak authentication
              and GraphQL backend.
            </p>
          </div>

          {session ? (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Welcome back, {session.user?.name || session.user?.email}!
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                You're successfully authenticated with Keycloak
              </p>
              {session.user?.roles && session.user.roles.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {session.user.roles.map((role: string) => (
                    <span
                      key={role}
                      className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/20 px-3 py-1 text-sm font-medium text-orange-800 dark:text-orange-200"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                Get started by creating an account or signing in
              </p>
              <div className="flex gap-4">
                <a
                  href="/auth/signup"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                  Get Started
                </a>
                <a
                  href="/auth/signin"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                >
                  Sign In
                </a>
              </div>
            </div>
          )}

          <div className="grid gap-4 pt-8 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Keycloak Auth
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Enterprise-grade authentication with role-based access control
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                GraphQL API
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Powered by Quarkus backend with type-safe queries
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Fitness Tracking
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Track your workouts, progress, and achieve your goals
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>Built with Next.js, Keycloak, and Quarkus</p>
        </div>
      </footer>
    </div>
  );
}
