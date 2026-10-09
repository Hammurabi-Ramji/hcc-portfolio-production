"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: Users, label: 'Users', href: '/dashboard/users' },
    { icon: FileText, label: 'Projects', href: '/dashboard/projects' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={{ name: user?.username || user?.email || 'User', avatar: user?.profile?.avatarUrl }} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gradient">AUTARCH</h1>
              <button
                className="lg:hidden p-1"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-secondary transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
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
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-16 z-30 bg-background/80 backdrop-blur-lg border-b border-border lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your projects.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stat Card 1 */}
            <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-green-600">+12%</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">1,234</h3>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-500" />
                </div>
                <span className="text-sm font-medium text-green-600">+8%</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">56</h3>
              <p className="text-sm text-muted-foreground">Active Projects</p>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-sm font-medium text-green-600">+24%</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">$12,456</h3>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>

            {/* Stat Card 4 */}
            <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Bell className="w-6 h-6 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-gray-500">0</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">3</h3>
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Activity Feed */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start space-x-3 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">New project created</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                  <FileText className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">New Project</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                  <Users className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Add User</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                  <BarChart3 className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">View Reports</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                  <Settings className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
