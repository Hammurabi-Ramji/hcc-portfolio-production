"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { projectApi, type CreateProject } from '@/services/project.service';
import { useToast } from '@/hooks/useToast';
import type { Project } from '@/types';

type ListState = 'loading' | 'ready' | 'empty' | 'error';

export default function ProjectsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [listState, setListState] = useState<ListState>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newProject, setNewProject] = useState<CreateProject>({
    name: '',
    description: '',
    status: 'active',
  });
  const fetchGeneration = useRef(0);

  const navbarUser = user
    ? { name: user.username || user.email || 'User', avatar: user.profile?.avatarUrl }
    : null;

  const fetchProjects = useCallback(async () => {
    const generation = ++fetchGeneration.current;
    setListState('loading');
    setLoadError(null);
    try {
      const result = await projectApi.getProjects();
      if (generation !== fetchGeneration.current) return;

      if (!result.success) {
        const message = result.error?.message || 'Failed to load projects';
        setProjects([]);
        setLoadError(message);
        setListState('error');
        showError(message);
        return;
      }

      // Canonical PaginatedResponse: ApiResponse.data = { data: Project[], meta }
      const items = result.data?.data ?? [];
      setProjects(items);
      setLoadError(null);
      setListState(items.length === 0 ? 'empty' : 'ready');
    } catch {
      if (generation !== fetchGeneration.current) return;
      const message = 'Failed to load projects';
      setProjects([]);
      setLoadError(message);
      setListState('error');
      showError(message);
    }
  }, [showError]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/login?callbackUrl=/projects');
      return;
    }
    void fetchProjects();
    return () => {
      ++fetchGeneration.current;
    };
  }, [authLoading, isAuthenticated, fetchProjects, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const result = await projectApi.createProject(newProject);

      if (result.success) {
        success('Project created successfully');
        setShowModal(false);
        setNewProject({ name: '', description: '', status: 'active' });
        await fetchProjects();
      } else {
        showError(result.error?.message || 'Failed to create project');
      }
    } catch {
      showError('An error occurred while creating project');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: Project['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status];
  };

  if (authLoading || (!isAuthenticated && listState === 'loading')) {
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
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Projects</h1>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              + New Project
            </button>
          </div>

          {listState === 'loading' ? (
            <div className="flex items-center justify-center py-12" role="status" aria-label="Loading projects">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : listState === 'error' ? (
            <div className="text-center py-12" role="alert">
              <p className="text-destructive mb-4">{loadError || 'Failed to load projects'}</p>
              <button
                type="button"
                onClick={() => void fetchProjects()}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          ) : listState === 'empty' ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects yet. Create your first project!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{project.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {project.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-primary hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-xl border border-border w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({ ...newProject, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={newProject.status}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      status: e.target.value as CreateProject['status'],
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating…' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-6 py-2 bg-secondary rounded-lg hover:bg-secondary/80 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
