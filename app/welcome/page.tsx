'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-orange-50 to-red-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold text-2xl mb-8 shadow-xl">
            FD
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Transform Your Body,
            </span>
            <br />
            <span className="text-zinc-900 dark:text-zinc-100">
              Elevate Your Life
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl">
            Join thousands of fitness enthusiasts tracking their journey with
            Fitness Devil - the ultimate platform for achieving your goals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/auth/signup">
              <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 w-full mt-8">
            <Card className="border-2 hover:border-orange-200 dark:hover:border-orange-900 transition-all">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="font-bold text-lg mb-2">Track Progress</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Monitor your workouts, nutrition, and body metrics in real-time
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-200 dark:hover:border-orange-900 transition-all">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="font-bold text-lg mb-2">Set Goals</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Create personalized fitness goals and track your achievements
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-orange-200 dark:hover:border-orange-900 transition-all">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="font-bold text-lg mb-2">Stay Motivated</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Join challenges, earn badges, and compete with friends
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 py-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 text-center">
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                10,000+
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Active Users
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                1M+
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Workouts Logged
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                4.9⭐
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                User Rating
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          Ready to Start Your Journey?
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          Join Fitness Devil today and take control of your fitness future.
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="h-14 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
            Get Started Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
