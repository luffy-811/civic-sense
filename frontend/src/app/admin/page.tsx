/**
 * Admin Dashboard Page
 * Professional overview statistics and recent issues
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { statsAPI, issuesAPI } from '@/lib/api';
import { Issue, CATEGORY_LABELS, STATUS_LABELS, SEVERITY_LABELS } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface StatsOverview {
  totalIssues: number;
  pendingIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  verifiedIssues: number;
  averageResolutionTime: number;
  issuesByCategory: { _id: string; count: number }[];
  issuesBySeverity: { _id: string; count: number }[];
  issuesByStatus: { _id: string; count: number }[];
  recentIssues: Issue[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, issuesRes] = await Promise.all([
        statsAPI.getOverview(),
        issuesAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (issuesRes.data.success) {
        setRecentIssues(issuesRes.data.data.issues);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Issues',
      value: stats?.totalIssues || 0,
      icon: ExclamationCircleIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Pending',
      value: stats?.pendingIssues || 0,
      icon: ClockIcon,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      gradient: 'from-amber-500 to-amber-600',
    },
    {
      name: 'In Progress',
      value: stats?.inProgressIssues || 0,
      icon: ArrowTrendingUpIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Resolved',
      value: stats?.resolvedIssues || 0,
      icon: CheckCircleIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      gradient: 'from-emerald-500 to-emerald-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">Overview of civic issues and statistics</p>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div 
            key={stat.name} 
            className={clsx(
              'relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border transition-all duration-200 hover:shadow-md',
              stat.borderColor
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={clsx('p-3 rounded-xl', stat.bgColor)}>
                <stat.icon className={clsx('w-6 h-6', stat.color)} />
              </div>
            </div>
            {/* Decorative gradient bar */}
            <div className={clsx('absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r', stat.gradient)} />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Issues by Category */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Issues by Category</h2>
          <div className="space-y-4">
            {stats?.issuesByCategory?.map((cat) => (
              <div key={cat._id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {CATEGORY_LABELS[cat._id as keyof typeof CATEGORY_LABELS] || cat._id}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {cat.count}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(cat.count / (stats.totalIssues || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-sm">No data available</p>
            )}
          </div>
        </div>

        {/* Issues by Severity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Issues by Severity</h2>
          <div className="space-y-4">
            {stats?.issuesBySeverity?.map((sev) => {
              const colorConfig = {
                low: { bg: 'bg-emerald-100', bar: 'from-emerald-400 to-emerald-500', text: 'text-emerald-700' },
                medium: { bg: 'bg-amber-100', bar: 'from-amber-400 to-amber-500', text: 'text-amber-700' },
                high: { bg: 'bg-orange-100', bar: 'from-orange-400 to-orange-500', text: 'text-orange-700' },
                critical: { bg: 'bg-red-100', bar: 'from-red-400 to-red-500', text: 'text-red-700' }
              };
              const config = colorConfig[sev._id as keyof typeof colorConfig] || { bg: 'bg-gray-100', bar: 'from-gray-400 to-gray-500', text: 'text-gray-700' };
              
              return (
                <div key={sev._id} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx('text-sm font-medium px-2 py-0.5 rounded-md', config.bg, config.text)}>
                      {SEVERITY_LABELS[sev._id as keyof typeof SEVERITY_LABELS] || sev._id}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {sev.count}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-500', config.bar)}
                      style={{
                        width: `${(sev.count / (stats.totalIssues || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              );
            }) || (
              <p className="text-gray-500 text-sm">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Issues Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Issues</h2>
              <p className="text-sm text-gray-500 mt-1">Latest reported civic issues</p>
            </div>
            <Link 
              href="/admin/issues" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
            >
              View all
              <EyeIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reported
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentIssues.length > 0 ? (
                recentIssues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={issue.imageUrl}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover mr-4 ring-1 ring-gray-200"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {issue.description?.slice(0, 50) || 'No description'}...
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {issue.address?.slice(0, 30) || issue.location?.address?.slice(0, 30) || 'Location not specified'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700">
                        {CATEGORY_LABELS[issue.category]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge badge-severity-${issue.severity}`}>
                        {SEVERITY_LABELS[issue.severity]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge badge-status-${issue.status}`}>
                        {STATUS_LABELS[issue.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No issues found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
