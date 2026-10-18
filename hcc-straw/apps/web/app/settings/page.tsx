"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { userApi, type UserProfileUpdate } from '@/services/user.service';
import { useToast } from '@/hooks/useToast';
import type { Profile, User } from '@/types';

const EMPTY_FORM: Required<Pick<UserProfileUpdate, 'firstName' | 'lastName' | 'bio' | 'website' | 'location'>> = {
  firstName: '',
  lastName: '',
  bio: '',
  website: '',
  location: '',
};

function profileToForm(profile?: Profile | null): typeof EMPTY_FORM {
  return {
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    bio: profile?.bio ?? '',
    website: profile?.website ?? '',
    location: profile?.location ?? '',
  };
}

function navbarUser(user: User, profile?: Profile | null): { name: string; avatar?: string } {
  const active = profile ?? user.profile;
  const fullName = [active?.firstName, active?.lastName].filter(Boolean).join(' ').trim();
  return {
    name: fullName || user.username || user.email,
    avatar: active?.avatarUrl,
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, updateUser } = useAuth();
  const { success, error: showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [resolvedProfile, setResolvedProfile] = useState<Profile | null>(null);
  const dirtyRef = useRef(false);
  const boundUserId = useRef<string | null>(null);
  const hydrateVersion = useRef(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?callbackUrl=%2Fsettings');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    const identityChanged = boundUserId.current !== user.id;
    if (identityChanged) {
      dirtyRef.current = false;
      boundUserId.current = user.id;
      setHydrated(false);
      setResolvedProfile(null);
      setFormData(EMPTY_FORM);
    } else if (hydrated || dirtyRef.current) {
      return;
    }

    const version = ++hydrateVersion.current;
    let cancelled = false;

    void (async () => {
      let profile: Profile | null | undefined = user.profile;
      try {
        const result = await userApi.getProfile();
        if (result.success) profile = result.data;
      } catch {
        // Keep the session-embedded profile when the profile read fails.
      }
      if (cancelled || version !== hydrateVersion.current || dirtyRef.current) return;
      const next = profile ?? null;
      setResolvedProfile(next);
      setFormData(profileToForm(next));
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, isLoading, user]);

  const ready = !isLoading && isAuthenticated && !!user && hydrated;

  const handleChange =
    (field: keyof typeof EMPTY_FORM) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      dirtyRef.current = true;
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || saving) return;

    setSaving(true);
    try {
      const result = await userApi.updateProfile(formData);
      if (result.success && result.data) {
        updateUser({ profile: result.data });
        setResolvedProfile(result.data);
        setFormData(profileToForm(result.data));
        dirtyRef.current = false;
        success('Profile updated successfully');
      } else {
        showError(result.error?.message || 'Failed to update profile');
      }
    } catch {
      showError('An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || (isAuthenticated && !hydrated)) {
    return (
      <div className="min-h-screen">
        <Navbar user={user ? navbarUser(user, resolvedProfile) : null} />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12">
            <p className="text-muted-foreground" role="status">
              Loading settings...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen">
        <Navbar user={null} />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12">
            <p className="text-muted-foreground" role="status">
              Redirecting to login...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar user={navbarUser(user, resolvedProfile)} />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="bg-card p-8 rounded-xl border border-border">
              <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>

              <form onSubmit={handleSubmit} className="space-y-6" aria-busy={saving}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange('firstName')}
                      disabled={!ready || saving}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange('lastName')}
                      disabled={!ready || saving}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange('bio')}
                    rows={4}
                    disabled={!ready || saving}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange('website')}
                    disabled={!ready || saving}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange('location')}
                    disabled={!ready || saving}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="City, Country"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={!ready || saving}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={saving}
                    className="px-6 py-2 bg-secondary rounded-lg hover:bg-secondary/80 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 bg-card p-8 rounded-xl border border-border">
              <h2 className="text-xl font-semibold mb-6">Account Information</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-medium">{user.username || 'Not set'}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-medium capitalize">{user.role}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Email Verified</span>
                  <span className="font-medium">
                    {user.emailVerified ? (
                      <span className="text-green-600">Verified</span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
