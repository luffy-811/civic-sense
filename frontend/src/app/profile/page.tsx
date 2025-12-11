/**
 * User Profile Page
 * View profile info and user's reported issues
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuthStore, useHasHydrated } from '@/store/authStore';
import { issuesAPI } from '@/lib/api';
import { Issue, STATUS_LABELS, CATEGORY_LABELS, SEVERITY_LABELS } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'resolved'>('all');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    // Wait for hydration before making auth decisions
    if (!hasHydrated) return;
    
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router, hasHydrated]);

  // Fetch issues function
  const fetchMyIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (activeTab === 'pending') {
        params.status = 'pending,verified,in_progress';
      } else if (activeTab === 'resolved') {
        params.status = 'resolved';
      }

      const response = await issuesAPI.getMyIssues(params);

      if (response.data.success) {
        setIssues(response.data.data.issues);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch your issues');
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit]);

  // Fetch issues when page loads, tab changes, or page number changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyIssues();
    }
  }, [isAuthenticated, fetchMyIssues]);

  // Also refetch when window gains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated) {
        fetchMyIssues();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, fetchMyIssues]);

  // Show loading while hydrating or checking auth
  if (!hasHydrated || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const stats = {
    total: pagination.total,
    pending: issues.filter(i => ['pending', 'verified', 'in_progress'].includes(i.status)).length,
    resolved: issues.filter(i => i.status === 'resolved').length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserCircleIcon className="w-16 h-16 text-primary-600" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center text-gray-600 mt-1">
                <EnvelopeIcon className="w-4 h-4 mr-2" />
                {user.email}
              </div>
              {user.createdAt && (
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
                </div>
              )}
              <div className="mt-2">
                <span className={clsx(
                  'badge',
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  user.role === 'authority' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                )}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/report" className="btn-primary">
                <PlusIcon className="w-5 h-5 mr-2" />
                Report Issue
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <ExclamationCircleIcon className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Reports</p>
          </div>
          <div className="card p-4 text-center">
            <ClockIcon className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="card p-4 text-center">
            <CheckCircleIcon className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
            <p className="text-sm text-gray-500">Resolved</p>
          </div>
        </div>

        {/* Issues List */}
        <div className="card overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'all', label: 'All Issues' },
                { id: 'pending', label: 'Pending' },
                { id: 'resolved', label: 'Resolved' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className={clsx(
                    'flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : issues.length === 0 ? (
              <div className="p-8 text-center">
                <ExclamationCircleIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No issues found</p>
                <Link href="/report" className="btn-primary mt-4 inline-flex">
                  Report your first issue
                </Link>
              </div>
            ) : (
              issues.map((issue) => (
                <Link
                  key={issue._id}
                  href={`/issues/${issue._id}`}
                  className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={issue.imageUrl}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {issue.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {issue.location?.address || 'Location not available'}
                        </p>
                      </div>
                      <span className={`badge badge-status-${issue.status} ml-2 flex-shrink-0`}>
                        {STATUS_LABELS[issue.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">
                        {CATEGORY_LABELS[issue.category]}
                      </span>
                      <span className={`badge badge-severity-${issue.severity} text-xs`}>
                        {SEVERITY_LABELS[issue.severity]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="btn-secondary py-1 px-3 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="btn-secondary py-1 px-3 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
