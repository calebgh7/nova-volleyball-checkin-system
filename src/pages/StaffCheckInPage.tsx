import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, UserPlus, CheckCircle, Calendar, ArrowLeft, RefreshCw, BarChart3 } from 'lucide-react';
import type { Athlete, Event, CheckIn, CheckInStats } from '../types';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';
import { api } from '../lib/api';

const checkInSchema = z.object({
  athleteId: z.string().min(1, 'Please select an athlete'),
  eventId: z.string().min(1, 'Please select an event'),
  notes: z.string().optional(),
});

type CheckInForm = z.infer<typeof checkInSchema>;

const newAthleteSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  emergencyContact: z.string().min(1, 'Emergency contact is required'),
  emergencyContactEmail: z.string().email('Invalid emergency contact email').optional().or(z.literal('')),
  emergencyPhone: z.string().min(1, 'Emergency phone is required'),
});

type NewAthleteForm = z.infer<typeof newAthleteSchema>;

export default function StaffCheckInPage() {
  const [activeTab, setActiveTab] = useState<'checkin' | 'recent' | 'events' | 'stats'>('checkin');
  const [events, setEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewAthleteForm, setShowNewAthleteForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckInForm>({
    resolver: zodResolver(checkInSchema),
  });

  const {
    register: registerNewAthlete,
    handleSubmit: handleSubmitNewAthlete,
    reset: resetNewAthlete,
    formState: { errors: newAthleteErrors, isSubmitting: isSubmittingNewAthlete },
  } = useForm<NewAthleteForm>({
    resolver: zodResolver(newAthleteSchema),
  });

  // Enhanced error logging for all API calls
  const logApiError = useCallback((label: string, error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response: { status: number; data: { error?: string } } };
      console.error(`[${label}] API error:`, apiError.response.status, apiError.response.data);
      setMessage({ 
        type: 'error', 
        text: `[${label}] ${apiError.response.data?.error || 'API error'} (${apiError.response.status})` 
      });
    } else {
      console.error(`[${label}] Error:`, error);
      setMessage({ 
        type: 'error', 
        text: `[${label}] ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }, []);

  const fetchTodayEvents = useCallback(async () => {
    try {
      const response = await api.get('/events/today');
      setEvents((response.data as { events: Event[] }).events);
    } catch (error) {
      logApiError('fetchTodayEvents', error);
    }
  }, [logApiError]);

  const fetchPastEvents = useCallback(async () => {
    try {
      const response = await api.get('/events/past');
      setPastEvents((response.data as { events: Event[] }).events);
    } catch (error) {
      logApiError('fetchPastEvents', error);
    }
  }, [logApiError]);

  const fetchRecentCheckIns = useCallback(async () => {
    try {
      const response = await api.get('/checkins/today');
      setRecentCheckIns((response.data as { checkins: CheckIn[] }).checkins);
    } catch (error) {
      logApiError('fetchRecentCheckIns', error);
    }
  }, [logApiError]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/checkins/stats/overview');
      setStats((response.data as { stats: CheckInStats }).stats);
    } catch (error) {
      logApiError('fetchStats', error);
    }
  }, [logApiError]);

  const searchAthletes = useCallback(async (query: string) => {
    if (query.length < 2) return;
    try {
      const response = await api.get(`/athletes/search?query=${encodeURIComponent(query)}`);
      setAthletes((response.data as { athletes: Athlete[] }).athletes);
    } catch (error) {
      logApiError('searchAthletes', error);
    }
  }, [logApiError]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTodayEvents(),
        fetchPastEvents(),
        fetchRecentCheckIns(),
        fetchStats()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchTodayEvents, fetchPastEvents, fetchRecentCheckIns, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchAthletes(searchQuery);
    } else {
      setAthletes([]);
    }
  }, [searchQuery, searchAthletes]);

  const onSubmitCheckIn = async (data: CheckInForm) => {
    try {
      setMessage(null);
      await api.post('/checkins', data);
      setMessage({ type: 'success', text: 'Check-in successful!' });
      reset();
      setSelectedAthlete(null);
      setSearchQuery('');
      fetchRecentCheckIns();
      fetchStats();
    } catch (error) {
      logApiError('checkIn', error);
    }
  };

  const onSubmitNewAthlete = async (data: NewAthleteForm) => {
    try {
      setMessage(null);
      await api.post('/athletes', data);
      setMessage({ type: 'success', text: 'Athlete registered successfully!' });
      resetNewAthlete();
      setShowNewAthleteForm(false);
    } catch (error) {
      logApiError('registerAthlete', error);
    }
  };

  const filteredAthletes = athletes.filter(athlete =>
    athlete.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Staff Check-In System</h1>
          <p className="text-white/70 mt-1">Enhanced check-in interface for staff members</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-nova-purple/20 hover:bg-nova-purple/30 text-white rounded-xl border border-nova-purple/30 transition-all duration-300 hover:scale-105 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-gradient-to-r from-nova-purple/20 to-nova-cyan/20 backdrop-blur-sm rounded-2xl p-1 sm:p-2 border border-nova-cyan/30 w-full max-w-2xl">
          <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-1 sm:gap-0">
            <button
              onClick={() => setActiveTab('checkin')}
              className={`flex items-center justify-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm ${
                activeTab === 'checkin'
                  ? 'bg-gradient-to-r from-nova-purple to-nova-cyan text-white shadow-lg'
                  : 'text-nova-cyan hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Check In</span>
              <span className="sm:hidden">Check</span>
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex items-center justify-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm ${
                activeTab === 'recent'
                  ? 'bg-gradient-to-r from-nova-purple to-nova-cyan text-white shadow-lg'
                  : 'text-nova-cyan hover:bg-white/10'
              }`}
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Recent Check-ins</span>
              <span className="sm:hidden">Recent</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center justify-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm ${
                activeTab === 'events'
                  ? 'bg-gradient-to-r from-nova-purple to-nova-cyan text-white shadow-lg'
                  : 'text-nova-cyan hover:bg-white/10'
              }`}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Events</span>
              <span className="sm:hidden">Events</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center justify-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-nova-purple to-nova-cyan text-white shadow-lg'
                  : 'text-nova-cyan hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Statistics</span>
              <span className="sm:hidden">Stats</span>
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl border backdrop-blur-sm ${
          message.type === 'success'
            ? 'bg-green-500/20 border-green-500/50 text-green-200'
            : 'bg-red-500/20 border-red-500/50 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'checkin' && (
        <div className="max-w-2xl mx-auto">
          {/* Check-In Form */}
          <div className="glass rounded-3xl border border-white/20 shadow-2xl p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
              <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-nova-cyan" />
              Athlete Check-In
            </h2>

            <form onSubmit={handleSubmit(onSubmitCheckIn)} className="space-y-4 sm:space-y-6">
              {/* Athlete Search */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-nova-cyan mb-2">
                  Search for Athlete
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nova-cyan w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type name to search..."
                    className="w-full pl-10 pr-4 py-2 sm:py-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white placeholder-white/60 focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm text-sm sm:text-base"
                  />
                </div>

                {/* Search Results */}
                {searchQuery.length >= 2 && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-white/10 backdrop-blur-sm rounded-xl border border-nova-cyan/30">
                    {filteredAthletes.length > 0 ? (
                      filteredAthletes.map((athlete) => (
                        <button
                          key={athlete.id}
                          type="button"
                          onClick={() => {
                            setSelectedAthlete(athlete);
                            setSearchQuery(`${athlete.firstName} ${athlete.lastName}`);
                            setAthletes([]);
                          }}
                          className="w-full text-left p-3 hover:bg-white/10 transition-colors text-white border-b border-nova-cyan/20 last:border-b-0"
                        >
                          <div className="font-medium">{athlete.firstName} {athlete.lastName}</div>
                          {athlete.email && (
                            <div className="text-sm text-white/70">{athlete.email}</div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-white/70 text-center">
                        No athletes found
                        <button
                          type="button"
                          onClick={() => setShowNewAthleteForm(true)}
                          className="ml-2 text-nova-cyan hover:text-nova-cyan/80 underline"
                        >
                          Register new athlete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedAthlete && (
                  <div className="mt-2 p-3 bg-nova-cyan/20 rounded-xl border border-nova-cyan/30">
                    <div className="text-white font-medium">
                      Selected: {selectedAthlete.firstName} {selectedAthlete.lastName}
                    </div>
                    {selectedAthlete.email && (
                      <div className="text-white/70 text-sm">{selectedAthlete.email}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Event Selection */}
              <div>
                <label className="block text-sm font-medium text-nova-cyan mb-2">
                  Select Event
                </label>
                <select
                  {...register('eventId')}
                  className="w-full px-4 py-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                >
                  <option value="">Choose an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {formatDate(event.date)} {formatTime(event.startTime)}
                    </option>
                  ))}
                </select>
                {errors.eventId && (
                  <p className="mt-2 text-sm text-red-300">{errors.eventId.message}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-nova-cyan mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Add any notes about this check-in..."
                  className="w-full px-4 py-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white placeholder-white/60 focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm resize-none"
                />
              </div>

              {/* Hidden athlete ID field */}
              <input type="hidden" {...register('athleteId')} value={selectedAthlete?.id || ''} />

              <button
                type="submit"
                disabled={isSubmitting || !selectedAthlete}
                className="w-full bg-nova-cyan text-nova-purple font-semibold py-3 px-6 rounded-xl hover:bg-nova-cyan/80 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-nova-cyan/30 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>Complete Check-In</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Recent Check-ins Tab */}
      {activeTab === 'recent' && (
        <div className="glass rounded-3xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <CheckCircle className="w-8 h-8 mr-3 text-nova-cyan" />
            Recent Check-ins
          </h2>
          
          {recentCheckIns.length > 0 ? (
            <div className="space-y-4">
              {recentCheckIns.map((checkIn) => (
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
              <CheckCircle className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/50">No recent check-ins</p>
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Today's Events */}
          <div className="glass rounded-3xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Calendar className="w-8 h-8 mr-3 text-nova-cyan" />
              Today's Events
            </h2>
            
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <div key={event.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <h3 className="text-white font-semibold mb-2">{event.name}</h3>
                    <p className="text-white/70 text-sm mb-2">{event.description}</p>
                    <div className="text-white/60 text-sm">
                      <div>{formatDate(event.date)}</div>
                      <div>{formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
                      <div>Capacity: {event.currentCapacity}/{event.maxCapacity}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/50">No events scheduled for today</p>
              </div>
            )}
          </div>

          {/* Past Events */}
          <div className="glass rounded-3xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Calendar className="w-8 h-8 mr-3 text-nova-cyan" />
              Past Events
            </h2>
            
            {pastEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastEvents.map((event) => (
                  <div key={event.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <h3 className="text-white font-semibold mb-2">{event.name}</h3>
                    <p className="text-white/70 text-sm mb-2">{event.description}</p>
                    <div className="text-white/60 text-sm">
                      <div>{formatDate(event.date)}</div>
                      <div>{formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
                      <div>Final Capacity: {event.currentCapacity}/{event.maxCapacity}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/50">No past events</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="glass rounded-3xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-nova-cyan" />
            Check-in Statistics
          </h2>
          
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-white">{stats.today}</div>
                <div className="text-white/70">Today's Check-ins</div>
              </div>
              <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-white">{stats.thisWeek}</div>
                <div className="text-white/70">This Week</div>
              </div>
              <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-white">{stats.total}</div>
                <div className="text-white/70">Total Check-ins</div>
              </div>
              <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-white">{stats.waiverNotValidated}</div>
                <div className="text-white/70">Waiver Issues</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/50">Loading statistics...</p>
            </div>
          )}
        </div>
      )}

      {/* New Athlete Registration Modal */}
      {showNewAthleteForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-3xl border border-white/20 p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Register New Athlete</h2>
              <button
                onClick={() => setShowNewAthleteForm(false)}
                className="text-white/70 hover:text-white"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewAthlete(onSubmitNewAthlete)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-nova-cyan mb-2">First Name</label>
                  <input
                    {...registerNewAthlete('firstName')}
                    className="w-full px-3 py-2 bg-white/10 border border-nova-cyan/30 rounded-lg text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none"
                  />
                  {newAthleteErrors.firstName && (
                    <p className="mt-1 text-sm text-red-300">{newAthleteErrors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-nova-cyan mb-2">Last Name</label>
                  <input
                    {...registerNewAthlete('lastName')}
                    className="w-full px-3 py-2 bg-white/10 border border-nova-cyan/30 rounded-lg text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none"
                  />
                  {newAthleteErrors.lastName && (
                    <p className="mt-1 text-sm text-red-300">{newAthleteErrors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-nova-cyan mb-2">Email (Optional)</label>
                <input
                  {...registerNewAthlete('email')}
                  type="email"
                  className="w-full px-3 py-2 bg-white/10 border border-nova-cyan/30 rounded-lg text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-nova-cyan mb-2">Phone (Optional)</label>
                <input
                  {...registerNewAthlete('phone')}
                  className="w-full px-3 py-2 bg-white/10 border border-nova-cyan/30 rounded-lg text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-nova-cyan mb-2">Date of Birth</label>
                <input
                  {...registerNewAthlete('dateOfBirth')}
                  type="date"
                  className="w-full px-3 py-2 bg-white/10 border border-nova-cyan/30 rounded-lg text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none"
                />
                {newAthleteErrors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-300">{newAthleteErrors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-nova-cyan mb-2">Emergency Contact Name</label>
                <input
                  {...registerNewAthlete('emergencyContact')}
                  className="w-full px-3 py-2 bg-white/10 border border-nova-cyan/30 rounded-lg text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none"
                />
                {newAthleteErrors.emergencyContact && (
                  <p className="mt-1 text-sm text-red-300">{newAthleteErrors.emergencyContact.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-nova-cyan mb-2">Emergency Contact Email (Optional)</label>
                <input
                  {...registerNewAthlete('emergencyContactEmail')}
                  type="email"
                  className="w-full px-3 py-2 bg-white/10 border border-nova-cyan/30 rounded-lg text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-nova-cyan mb-2">Emergency Contact Phone</label>
                <input
                  {...registerNewAthlete('emergencyPhone')}
                  className="w-full px-3 py-2 bg-white/10 border border-nova-cyan/30 rounded-lg text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none"
                />
                {newAthleteErrors.emergencyPhone && (
                  <p className="mt-1 text-sm text-red-300">{newAthleteErrors.emergencyPhone.message}</p>
                )}
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewAthleteForm(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewAthlete}
                  className="flex-1 px-4 py-2 bg-nova-cyan text-nova-purple font-semibold rounded-lg hover:bg-nova-cyan/80 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmittingNewAthlete ? 'Registering...' : 'Register Athlete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
