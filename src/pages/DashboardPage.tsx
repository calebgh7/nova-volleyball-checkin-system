import { useState, useEffect, useCallback } from 'react';
import { Users, Calendar, TrendingUp, CheckCircle, AlertTriangle, RefreshCw, Activity } from 'lucide-react';
import { api } from '../lib/api';
import type { CheckInStats, CheckIn } from '../types';
import { formatDateTime } from '../lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsResponse, checkinsResponse] = await Promise.all([
        api.get('/checkins/stats/overview'),
        api.get('/checkins/today')
      ]);
      
      setStats(statsResponse.data.stats);
      setRecentCheckIns(checkinsResponse.data.checkins);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-nova-purple/30"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-nova-purple absolute top-0 left-0"></div>
          </div>
          <p className="text-white font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/70 mt-1">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-nova-purple/20 hover:bg-nova-purple/30 text-white rounded-xl border border-nova-purple/30 transition-all duration-300 hover:scale-105 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Enhanced Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
          <div className="glass rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-nova-cyan/20 to-nova-cyan/10 rounded-xl backdrop-blur-sm border border-nova-cyan/30 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-6 w-6 text-nova-cyan" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-white/70">Today's Check-ins</p>
                  <p className="text-3xl font-bold text-white">{stats.today}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/50">vs yesterday</div>
                <div className="text-sm font-semibold text-green-400">+12%</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-400/10 rounded-xl backdrop-blur-sm border border-green-400/30 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-white/70">This Week</p>
                  <p className="text-3xl font-bold text-white">{stats.thisWeek}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/50">vs last week</div>
                <div className="text-sm font-semibold text-green-400">+8%</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-nova-purple/20 to-nova-purple/10 rounded-xl backdrop-blur-sm border border-nova-purple/30 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-nova-purple" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-white/70">Total Check-ins</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/50">all time</div>
                <div className="text-sm font-semibold text-nova-cyan">∞</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/20 hover:scale-105 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-400/10 rounded-xl backdrop-blur-sm border border-red-400/30 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-white/70">Waiver Issues</p>
                  <p className="text-3xl font-bold text-white">{stats.waiverNotValidated}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/50">need attention</div>
                <div className="text-sm font-semibold text-red-400">!</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Waiver Status Summary */}
      {stats && (
        <div className="glass rounded-3xl p-8 border border-white/20 animate-fade-in-up animation-delay-400">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <div className="w-2 h-8 bg-gradient-to-b from-nova-cyan to-nova-purple rounded-full mr-3"></div>
            Waiver Status Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center p-6 bg-gradient-to-r from-green-500/20 to-green-400/10 rounded-2xl backdrop-blur-sm border border-green-400/30 hover:scale-105 transition-all duration-300">
              <CheckCircle className="h-8 w-8 text-green-400 mr-4" />
              <div>
                <p className="text-lg font-semibold text-white">{stats.waiverValidated} Valid Waivers</p>
                <p className="text-sm text-white/70">Athletes with current waivers</p>
              </div>
            </div>
            <div className="flex items-center p-6 bg-gradient-to-r from-red-500/20 to-red-400/10 rounded-2xl backdrop-blur-sm border border-red-400/30 hover:scale-105 transition-all duration-300">
              <AlertTriangle className="h-8 w-8 text-red-400 mr-4" />
              <div>
                <p className="text-lg font-semibold text-white">{stats.waiverNotValidated} Issues</p>
                <p className="text-sm text-white/70">Need waiver validation</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="glass rounded-3xl p-8 border border-white/20 animate-fade-in-up animation-delay-600">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Activity className="h-6 w-6 mr-3 text-nova-cyan" />
          Recent Activity
        </h2>
        {recentCheckIns.length > 0 ? (
          <div className="space-y-4">
            {recentCheckIns.slice(0, 5).map((checkIn) => (
              <div key={checkIn.id} className="flex items-center p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-nova-cyan/30 to-nova-purple/30 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {checkIn.firstName?.[0]}{checkIn.lastName?.[0]}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-white font-medium">
                    {checkIn.firstName} {checkIn.lastName}
                  </p>
                  <p className="text-white/70 text-sm">
                    Checked into {checkIn.eventName} • {formatDateTime(checkIn.checkInTime)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    checkIn.waiverValidated
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {checkIn.waiverValidated ? 'Valid' : 'Invalid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/50">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
