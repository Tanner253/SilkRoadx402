'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Log {
  _id: string;
  type: string;
  message: string;
  wallet?: string;
  ip?: string;
  createdAt: Date;
}

interface LogsPanelProps {
  autoRefresh: boolean;
  lastUpdated: Date;
  onUpdate: () => void;
}

export function LogsPanel({ autoRefresh, lastUpdated, onUpdate }: LogsPanelProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await axios.get('/api/admin/logs', {
        params: {
          type: logTypeFilter,
          limit: 50,
        },
      });

      if (response.data.success) {
        setLogs(response.data.logs);
        if (!silent) onUpdate();
      }
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [logTypeFilter]);

  // Auto-refresh polling (silent updates)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, logTypeFilter]);

  // Manual refresh trigger from parent
  useEffect(() => {
    if (lastUpdated) {
      fetchLogs(true);
    }
  }, [lastUpdated]);

  // Format timestamp
  const formatTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleString();
  };

  // Determine log type color
  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'error':
      case 'txn_failure':
      case 'admin_fail':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
      case 'listing_approved':
      case 'admin_action':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'listing_created':
      case 'listing_purchased':
      case 'comment_posted':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      case 'listing_rejected':
      case 'report_submitted':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950';
      case 'info':
      default:
        return 'text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900';
    }
  };

  return (
    <>
      {/* Log Type Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          'all',
          'listing_created',
          'listing_purchased',
          'listing_approved',
          'listing_rejected',
          'report_submitted',
          'comment_posted',
          'info',
          'error',
          'admin_action',
          'txn_failure',
          'admin_fail'
        ].map((type) => (
          <button
            key={type}
            onClick={() => setLogTypeFilter(type)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              logTypeFilter === type
                  ? 'bg-green-600 text-white'
                : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            {type === 'all' ? 'All' : type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
        </div>
      )}

      {/* Logs Display */}
      {!loading && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
              No logs found
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log._id}
                className={`rounded-lg border p-4 ${getLogTypeColor(log.type)} border-current border-opacity-20`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-current bg-opacity-10">
                      {log.type}
                    </span>
                    {log.wallet && (
                      <span className="text-xs font-mono">
                        {log.wallet.slice(0, 4)}...{log.wallet.slice(-4)}
                      </span>
                    )}
                    {log.ip && (
                      <span className="text-xs opacity-60">
                        {log.ip}
                      </span>
                    )}
                  </div>
                  <span className="text-xs opacity-60">
                    {formatTime(log.createdAt)}
                  </span>
                </div>
                <p className="text-sm">
                  {log.message}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}

