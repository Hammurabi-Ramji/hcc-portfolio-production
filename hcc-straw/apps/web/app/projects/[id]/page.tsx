"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { projectApi } from '@/services/project.service';
import { useToast } from '@/hooks/useToast';
import type { Project } from '@/types';

type DetailState = 'loading' | 'ready' | 'error';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { error: showError } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [state, setState] = useState<DetailState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fetchGeneration = useRef(0);

  const navbarUser = user
    ? { name: user.username || user.email || 'User', avatar: user.profile?.avatarUrl }
    : null;

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setState('error');
      setErrorMessage('Project not found');
      return;
    }

    const generation = ++fetchGeneration.current;
    setState('loading');
    setErrorMessage(null);
    try {
      const result = await projectApi.getProjectById(projectId);
      if (generation !== fetchGeneration.current) return;

      if (!result.success || !result.data) {
        const message = result.success === false
          ? (result.error?.message || 'Failed to load project')
          : 'Failed to load project';
        setProject(null);
        setErrorMessage(message);
        setState('error');
        showError(message);
        return;
      }

      setProject(result.data);
      setState('ready');
    } catch {
      if (generation !== fetchGeneration.current) return;
      const message = 'Failed to load project';
      setProject(null);
      setErrorMessage(message);
      setState('error');
      showError(message);
    }
  }, [projectId, showError]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?callbackUrl=/projects/${encodeURIComponent(projectId)}`);
      return;
    }
    void loadProject();
    return () => {
      ++fetchGeneration.current;
    };
  }, [authLoading, isAuthenticated, loadProject, projectId, router]);

  if (authLoading || (!isAuthenticated && state === 'loading')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar user={navbarUser} />

      <main className="pt-20">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Link href="/projects" className="text-primary hover:underline text-sm">
            ← Back to projects
          </Link>

          {state === 'loading' ? (
            <div className="flex items-center justify-center py-12" role="status" aria-label="Loading project">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : state === 'error' ? (
            <div className="text-center py-12" role="alert">
              <p className="text-destructive mb-4">{errorMessage || 'Failed to load project'}</p>
              <button
                type="button"
                onClick={() => void loadProject()}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          ) : project ? (
            <article className="mt-6 bg-card p-8 rounded-xl border border-border">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary shrink-0">
                  {project.status}
                </span>
              </div>
              {project.description ? (
                <p className="text-muted-foreground mb-6">{project.description}</p>
              ) : null}
              <dl className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">Created</dt>
                  <dd>{new Date(project.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Updated</dt>
                  <dd>{new Date(project.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
            </article>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
