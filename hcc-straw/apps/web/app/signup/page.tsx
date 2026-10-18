"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodFormResolver } from '@/lib/zod-form-resolver';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and number'
  ),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { register, isLoading, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodFormResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      termsAccepted: false,
    },
  });

  // Form-level pending only — auth init must not show "Creating account..."
  const pending = isSubmitting;
  const submitBlocked = isLoading || isSubmitting;

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    try {
      const result = await register({
        email: data.email,
        password: data.password,
        username: data.username,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
      });

      if (result.success && result.data) {
        router.push('/dashboard');
      } else {
        setError(result.error?.message || 'Registration failed');
      }
    } catch {
      setError('An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient">Create an account</h1>
          <p className="mt-2 text-muted-foreground">
            Start building with AUTARCH today
          </p>
        </div>

        <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
              className={cn(
                'flex items-center gap-2 p-4 text-red-800 bg-red-50 border border-red-300 rounded-lg',
                !error && 'hidden'
              )}
            >
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span className="text-sm">{error}</span>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  aria-invalid={errors.username ? true : undefined}
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  {...registerForm('username')}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all',
                    errors.username ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="johndoe"
                />
              </div>
              {errors.username && (
                <p id="username-error" className="mt-1 text-sm text-red-800" role="alert">
                  {errors.username.message}
                </p>
              )}
            </div>

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
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...registerForm('email')}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all',
                    errors.email ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-800" role="alert">
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
                  autoComplete="new-password"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={errors.password ? 'password-error password-hint' : 'password-hint'}
                  {...registerForm('password')}
                  className={cn(
                    'w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all',
                    errors.password ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-800" role="alert">
                  {errors.password.message}
                </p>
              )}
              <p id="password-hint" className="mt-1 text-xs text-muted-foreground">
                Must be 8+ characters with uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-invalid={errors.confirmPassword ? true : undefined}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  {...registerForm('confirmPassword')}
                  className={cn(
                    'w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all',
                    errors.confirmPassword ? 'border-red-500' : 'border-border'
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-sm text-red-800" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <input
                id="termsAccepted"
                type="checkbox"
                aria-invalid={errors.termsAccepted ? true : undefined}
                aria-describedby={errors.termsAccepted ? 'termsAccepted-error' : undefined}
                {...registerForm('termsAccepted')}
                className="w-4 h-4 mt-0.5 text-primary border-border rounded focus:ring-primary"
              />
              <label htmlFor="termsAccepted" className="ml-2 text-sm text-muted-foreground">
                I agree to the{' '}
                <Link href="/signup/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/signup/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.termsAccepted && (
              <p id="termsAccepted-error" className="text-sm text-red-800" role="alert">
                {errors.termsAccepted.message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitBlocked}
              aria-busy={pending || undefined}
              className="w-full py-3 px-4 text-white font-medium bg-primary rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our{' '}
          <Link href="/signup/terms" className="text-primary hover:underline">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/signup/privacy" className="text-primary hover:underline">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
