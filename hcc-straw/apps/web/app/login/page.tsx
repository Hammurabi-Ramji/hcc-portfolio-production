"use client";

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodFormResolver } from '@/lib/zod-form-resolver';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { safeCallback } from './safe-callback';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState('/dashboard');
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const formErrorId = useId();
  const recoveryNoticeId = useId();
  const rememberHintId = useId();

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('callbackUrl');
    setCallbackUrl(safeCallback(raw));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodFormResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Redirect only after auth settle and the in-flight submit has finished.
  // Prevents navigating away while a delayed failure can still surface.
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isSubmitting) {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, isAuthenticated, isLoading, isSubmitting, router]);

  const pending = isSubmitting;
  const fieldsLocked = pending || (isLoading && !isAuthenticated);

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setRecoveryNotice(null);

    try {
      // Await owns submission lifetime; RHF keeps isSubmitting true until this settles.
      const result = await login(data.email, data.password, Boolean(data.rememberMe));

      if (result.success && result.data) {
        // Navigation is deferred to the effect so pending UI clears first
        // and a superseded/failed response never races a premature replace.
        return;
      }

      setError(result.error?.message || 'Login failed');
    } catch {
      setError('An unexpected error occurred');
    }
  };

  const onRecoveryClick = () => {
    setError(null);
    setRecoveryNotice(
      'Password recovery is unavailable: no email transport is configured on this local build (HTTP 501 UNSUPPORTED).'
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {error && (
              <div
                id={formErrorId}
                role="alert"
                aria-live="assertive"
                className="flex items-center gap-2 p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {recoveryNotice && (
              <div
                id={recoveryNoticeId}
                role="status"
                aria-live="polite"
                className="flex items-center gap-2 p-4 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm">{recoveryNotice}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={fieldsLocked}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? emailErrorId : undefined}
                  {...register('email')}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-60',
                    errors.email ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p id={emailErrorId} role="alert" className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={fieldsLocked}
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? passwordErrorId : undefined}
                  {...register('password')}
                  className={cn(
                    'w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:opacity-60',
                    errors.password ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={fieldsLocked}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-60"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id={passwordErrorId} role="alert" className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    disabled={fieldsLocked}
                    aria-describedby={rememberHintId}
                    {...register('rememberMe')}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary disabled:opacity-60"
                  />
                  <span className="ml-2 text-sm">Remember me</span>
                </label>
                <p id={rememberHintId} className="mt-1 text-xs text-muted-foreground max-w-[14rem]">
                  Off: browser session cookie (~8 hours). On: persistent cookie (up to 30 days). Honored by the local auth API.
                </p>
              </div>
              <button
                type="button"
                onClick={onRecoveryClick}
                disabled={fieldsLocked}
                aria-describedby={recoveryNotice ? recoveryNoticeId : undefined}
                className="text-sm text-primary hover:underline disabled:opacity-60 shrink-0"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={fieldsLocked}
              aria-busy={pending || undefined}
              className="w-full py-3 px-4 text-white font-medium bg-primary rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Account options</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center" role="note">
              Google and GitHub sign-in are not available in this local build. Use email and password, or{' '}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                create an account
              </Link>
              .
            </p>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
