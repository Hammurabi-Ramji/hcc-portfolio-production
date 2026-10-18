"use client";

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  Users,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { projectApi } from '@/services/project.service';
import { userApi } from '@/services/user.service';
import { formatDate } from '@/lib/utils';
import type { ProjectDto } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [projectTotal, setProjectTotal] = useState(0);
  const [activeTotal, setActiveTotal] = useState<number | null>(null);
  const [directoryTotal, setDirectoryTotal] = useState<number | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectDto[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : menuButtonRef.current;
    setSidebarOpen(true);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) {
      const target = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (target) {
        target.focus();
      }
      return;
    }

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSidebar();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen, closeSidebar]);

  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;

    setDataLoading(true);
    setDataError(null);
    setDirectoryError(null);

    try {
      const [projectsResponse, activeResponse] = await Promise.all([
        projectApi.getProjects({ page: 1, limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' }),
        projectApi.getProjects({ page: 1, limit: 1, status: 'active' }),
      ]);

      if (!projectsResponse.success) {
        setDataError(projectsResponse.error.message);
        setProjectTotal(0);
        setActiveTotal(null);
        setRecentProjects([]);
      } else {
        setProjectTotal(projectsResponse.data.meta.total);
        setRecentProjects(projectsResponse.data.data);
        setActiveTotal(activeResponse.success ? activeResponse.data.meta.total : null);
        if (!activeResponse.success) {
          setDataError((current) => current ?? activeResponse.error.message);
        }
      }

      if (user?.role === 'admin') {
        const usersResponse = await userApi.listUsers({ page: 1, limit: 1 });
        if (usersResponse.success) {
          setDirectoryTotal(usersResponse.data.meta.total);
        } else {
          setDirectoryTotal(null);
          setDirectoryError(usersResponse.error.message);
        }
      } else {
        setDirectoryTotal(null);
      }
    } catch {
      setDataError('Dashboard data could not be loaded.');
      setProjectTotal(0);
      setActiveTotal(null);
      setRecentProjects([]);
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void loadDashboardData();
    }
  }, [isLoading, isAuthenticated, loadDashboardData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p role="status">Loading dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: FileText, label: 'Projects', href: '/projects' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const activityEmpty = !dataLoading && !dataError && recentProjects.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={{ name: user?.username || user?.email || 'User', avatar: user?.profile?.avatarUrl }} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        id={sidebarId}
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Dashboard navigation"
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gradient">AUTARCH</h1>
              <button
                ref={closeButtonRef}
                type="button"
                className="lg:hidden p-1"
                onClick={closeSidebar}
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1" aria-label="Primary">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary transition-colors"
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.username || user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="sticky top-16 z-30 bg-background/80 backdrop-blur-lg border-b border-border lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={openSidebar}
              className="p-2 rounded-lg hover:bg-secondary"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              aria-controls={sidebarId}
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <div className="w-10" />
          </div>
        </header>

        <div className="p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back{user?.username ? `, ${user.username}` : ''}. Project totals come from the local API; revenue and analytics endpoints are not implemented.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              disabled={dataLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-500" aria-hidden="true" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">
                {dataLoading ? '—' : dataError && projectTotal === 0 ? '—' : projectTotal}
              </h3>
              <p className="text-sm text-muted-foreground">Total projects</p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <LayoutDashboard className="w-6 h-6 text-green-500" aria-hidden="true" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">
                {dataLoading ? '—' : activeTotal === null ? '—' : activeTotal}
              </h3>
              <p className="text-sm text-muted-foreground">Active projects</p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-500" aria-hidden="true" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-1">
                {user?.role === 'admin'
                  ? dataLoading
                    ? '—'
                    : directoryError
                      ? '—'
                      : directoryTotal ?? '—'
                  : 'N/A'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user?.role === 'admin'
                  ? 'Directory users (admin total)'
                  : 'Directory users (admin only)'}
              </p>
              {user?.role === 'admin' && directoryError && (
                <p className="mt-2 text-xs text-red-600" role="alert">{directoryError}</p>
              )}
            </div>
          </div>

          {dataError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              <p>{dataError}</p>
              <button
                type="button"
                onClick={() => void loadDashboardData()}
                className="mt-2 font-medium underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Recent project activity</h3>
              {dataLoading ? (
                <p role="status" className="text-sm text-muted-foreground">Loading activity...</p>
              ) : dataError && recentProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Activity unavailable until the project list loads.</p>
              ) : activityEmpty ? (
                <p className="text-sm text-muted-foreground">No projects yet. Create one from Projects.</p>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-start space-x-3 pb-4 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.status} · updated {formatDate(project.updatedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Quick actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/projects"
                  className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <FileText className="w-6 h-6 mb-2" aria-hidden="true" />
                  <span className="text-sm font-medium">New Project</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Settings className="w-6 h-6 mb-2" aria-hidden="true" />
                  <span className="text-sm font-medium">Settings</span>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Add User and View Reports are omitted until dedicated authorized screens exist.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
