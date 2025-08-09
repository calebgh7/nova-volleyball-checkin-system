import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, UserPlus, CheckCircle, AlertTriangle, Calendar, Users, ArrowLeft } from 'lucide-react';
import type { Athlete, Event, CheckIn } from '../types';
import { formatDate, formatTime, formatDateTime } from '../lib/utils';
import { checkInApi } from '../lib/api';
import { useNavigate } from 'react-router-dom';

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

export default function CheckInPage() {
  const [activeTab, setActiveTab] = useState<'checkin' | 'recent' | 'events'>('checkin');
  const [events, setEvents] = useState<Event[]>([]);
  const [disabledEvents, setDisabledEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewAthleteForm, setShowNewAthleteForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

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
      const response = await checkInApi.get('/events/today');
      setEvents((response.data as { events: Event[] }).events);
    } catch (error) {
      logApiError('fetchTodayEvents', error);
    }
  }, [logApiError]);

  const fetchDisabledEvents = useCallback(async () => {
    try {
      const response = await checkInApi.get('/events/disabled');
      setDisabledEvents((response.data as { events: Event[] }).events);
    } catch (error) {
      logApiError('fetchDisabledEvents', error);
    }
  }, [logApiError]);

  const fetchPastEvents = useCallback(async () => {
    try {
      const response = await checkInApi.get('/events/past');
      setPastEvents((response.data as { events: Event[] }).events);
    } catch (error) {
      logApiError('fetchPastEvents', error);
    }
  }, [logApiError]);

  const fetchRecentCheckIns = useCallback(async () => {
    try {
      const response = await checkInApi.get('/checkins/today');
      setRecentCheckIns((response.data as { checkins: CheckIn[] }).checkins);
    } catch (error) {
      logApiError('fetchRecentCheckIns', error);
    }
  }, [logApiError]);

  const searchAthletes = useCallback(async (query: string) => {
    if (query.length < 2) return;
    try {
      const response = await checkInApi.get(`/athletes/search?query=${encodeURIComponent(query)}`);
      setAthletes((response.data as { athletes: Athlete[] }).athletes);
    } catch (error) {
      logApiError('searchAthletes', error);
    }
  }, [logApiError]);

  useEffect(() => {
    fetchTodayEvents();
    fetchDisabledEvents();
    fetchPastEvents();
    fetchRecentCheckIns();
  }, [fetchTodayEvents, fetchDisabledEvents, fetchPastEvents, fetchRecentCheckIns]);

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
      await checkInApi.post('/checkins', data);
      setMessage({ type: 'success', text: 'Check-in successful!' });
      reset();
      setSelectedAthlete(null);
      setSearchQuery('');
      fetchRecentCheckIns();
    } catch (error) {
      logApiError('checkIn', error);
    }
  };

  const onSubmitNewAthlete = async (data: NewAthleteForm) => {
    try {
      setMessage(null);
      await checkInApi.post('/athletes', data);
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
    <div className="min-h-screen bg-nova-dark">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header with Back Button */}
        <div className="text-center mb-6 sm:mb-8 relative">
          <button
            onClick={() => navigate('/')}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Back to Login</span>
            <span className="sm:hidden">Back</span>
          </button>
          
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
            Nova Volleyball Check-In
          </h1>
          <p className="text-base sm:text-xl text-nova-cyan px-4">
            Welcome! Check in for today's events or register as a new athlete.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-nova-purple/20 to-nova-cyan/20 backdrop-blur-sm rounded-2xl p-1 sm:p-2 border border-nova-cyan/30 w-full max-w-md">
            <div className="flex space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab('checkin')}
                className={`flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm flex-1 justify-center ${
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
                className={`flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm flex-1 justify-center ${
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
                className={`flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 text-xs sm:text-sm flex-1 justify-center ${
                  activeTab === 'events'
                    ? 'bg-gradient-to-r from-nova-purple to-nova-cyan text-white shadow-lg'
                    : 'text-nova-cyan hover:bg-white/10'
                }`}
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Events</span>
                <span className="sm:hidden">Events</span>
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm ${
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
            <div className="bg-gradient-to-br from-nova-purple/15 to-nova-purple/5 backdrop-blur-sm rounded-3xl border border-nova-cyan/30 shadow-2xl p-4 sm:p-8">
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
                            className="block w-full mt-2 text-nova-cyan hover:text-white transition-colors"
                          >
                            Register new athlete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Athlete Display */}
                {selectedAthlete && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-nova-cyan/30">
                    <h3 className="font-medium text-white mb-2">Selected Athlete:</h3>
                    <p className="text-nova-cyan">{selectedAthlete.firstName} {selectedAthlete.lastName}</p>
                    {selectedAthlete.email && (
                      <p className="text-white/70 text-sm">{selectedAthlete.email}</p>
                    )}
                  </div>
                )}

                <input
                  type="hidden"
                  {...register('athleteId')}
                  value={selectedAthlete?.id || ''}
                />
                {errors.athleteId && (
                  <p className="text-red-400 text-sm">{errors.athleteId.message}</p>
                )}

                {/* Event Selection */}
                <div>
                  <label className="block text-sm font-medium text-nova-cyan mb-2">
                    Select Event
                  </label>
                  <select
                    {...register('eventId')}
                    className="w-full p-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                  >
                    <option value="" className="bg-nova-dark">Select an event...</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id} className="bg-nova-dark">
                        {event.name} - {formatDate(event.date)} at {formatTime(event.startTime)}
                      </option>
                    ))}
                  </select>
                  {errors.eventId && (
                    <p className="text-red-400 text-sm mt-1">{errors.eventId.message}</p>
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
                    className="w-full p-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white placeholder-white/60 focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                    placeholder="Any additional notes..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-nova-purple to-nova-cyan text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-nova-cyan/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Checking In...' : 'Check In'}
                </button>
              </form>

              {/* Register New Athlete Button */}
              <div className="mt-6 pt-6 border-t border-nova-cyan/20">
                <button
                  onClick={() => setShowNewAthleteForm(true)}
                  className="w-full text-nova-cyan hover:text-white transition-colors font-medium"
                >
                  Don't see your name? Register as a new athlete
                </button>
              </div>
            </div>

            {/* New Athlete Registration Modal */}
            {showNewAthleteForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-gradient-to-br from-nova-purple/20 to-nova-cyan/20 backdrop-blur-md rounded-3xl border border-nova-cyan/30 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <h3 className="text-2xl font-bold text-white mb-6">Register New Athlete</h3>
                  
                  <form onSubmit={handleSubmitNewAthlete(onSubmitNewAthlete)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-nova-cyan mb-1">
                          First Name *
                        </label>
                        <input
                          {...registerNewAthlete('firstName')}
                          className="w-full p-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white placeholder-white/60 focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                        />
                        {newAthleteErrors.firstName && (
                          <p className="text-red-400 text-sm mt-1">{newAthleteErrors.firstName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-nova-cyan mb-1">
                          Last Name *
                        </label>
                        <input
                          {...registerNewAthlete('lastName')}
                          className="w-full p-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white placeholder-white/60 focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                        />
                        {newAthleteErrors.lastName && (
                          <p className="text-red-400 text-sm mt-1">{newAthleteErrors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nova-cyan mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        {...registerNewAthlete('email')}
                        className="w-full p-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white placeholder-white/60 focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                      />
                      {newAthleteErrors.email && (
                        <p className="text-red-400 text-sm mt-1">{newAthleteErrors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nova-cyan mb-1">
                        Phone
                      </label>
                      <input
                        {...registerNewAthlete('phone')}
                        className="w-full p-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white placeholder-white/60 focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nova-cyan mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        {...registerNewAthlete('dateOfBirth')}
                        className="w-full p-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                      />
                      {newAthleteErrors.dateOfBirth && (
                        <p className="text-red-400 text-sm mt-1">{newAthleteErrors.dateOfBirth.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nova-cyan mb-1">
                        Emergency Contact *
                      </label>
                      <input
                        {...registerNewAthlete('emergencyContact')}
                        className="w-full p-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white placeholder-white/60 focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                      />
                      {newAthleteErrors.emergencyContact && (
                        <p className="text-red-400 text-sm mt-1">{newAthleteErrors.emergencyContact.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nova-cyan mb-1">
                        Emergency Contact Email
                      </label>
                      <input
                        type="email"
                        {...registerNewAthlete('emergencyContactEmail')}
                        className="w-full p-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white placeholder-white/60 focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                      />
                      {newAthleteErrors.emergencyContactEmail && (
                        <p className="text-red-400 text-sm mt-1">{newAthleteErrors.emergencyContactEmail.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nova-cyan mb-1">
                        Emergency Phone *
                      </label>
                      <input
                        {...registerNewAthlete('emergencyPhone')}
                        className="w-full p-3 bg-white/10 border border-nova-cyan/30 rounded-xl text-white placeholder-white/60 focus:border-nova-cyan focus:ring-2 focus:ring-nova-cyan/20 focus:outline-none backdrop-blur-sm"
                      />
                      {newAthleteErrors.emergencyPhone && (
                        <p className="text-red-400 text-sm mt-1">{newAthleteErrors.emergencyPhone.message}</p>
                      )}
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewAthleteForm(false);
                          resetNewAthlete();
                        }}
                        className="flex-1 bg-white/10 text-white font-medium py-3 px-6 rounded-xl hover:bg-white/20 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingNewAthlete}
                        className="flex-1 bg-gradient-to-r from-nova-purple to-nova-cyan text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-nova-cyan/25 transition-all duration-300 disabled:opacity-50"
                      >
                        {isSubmittingNewAthlete ? 'Registering...' : 'Register'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-nova-purple/15 to-nova-purple/5 backdrop-blur-sm rounded-3xl border border-nova-cyan/30 shadow-2xl">
              <div className="p-8 border-b border-nova-cyan/20">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <CheckCircle className="w-8 h-8 mr-3 text-nova-cyan" />
                  Today's Check-ins
                </h2>
              </div>
              <div className="overflow-x-auto">
                {recentCheckIns.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-nova-cyan/20">
                        <th className="text-left p-6 text-nova-cyan font-medium">Athlete</th>
                        <th className="text-left p-6 text-nova-cyan font-medium">Event</th>
                        <th className="text-left p-6 text-nova-cyan font-medium">Check-in Time</th>
                        <th className="text-left p-6 text-nova-cyan font-medium">Waiver Status</th>
                        <th className="text-left p-6 text-nova-cyan font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCheckIns.map((checkIn, index) => (
                        <tr key={index} className="border-b border-nova-cyan/10 hover:bg-white/5 transition-colors">
                          <td className="p-6 text-white">
                            {checkIn.firstName} {checkIn.lastName}
                          </td>
                          <td className="p-6 text-white">{checkIn.eventName}</td>
                          <td className="p-6 text-white">{formatDateTime(checkIn.checkInTime)}</td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              checkIn.waiverValidated
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                              {checkIn.waiverValidated ? 'Valid' : 'Invalid'}
                            </span>
                          </td>
                          <td className="p-6 text-white/70">{checkIn.notes || 'None'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-white/70">
                    No check-ins today yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Today's Events */}
            <div className="bg-gradient-to-br from-nova-purple/15 to-nova-purple/5 backdrop-blur-sm rounded-3xl border border-nova-cyan/30 shadow-2xl">
              <div className="p-8 border-b border-nova-cyan/20">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Calendar className="w-8 h-8 mr-3 text-nova-cyan" />
                  Today's Events
                </h2>
              </div>
              <div className="p-8">
                {events.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                      <div key={event.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-nova-cyan/30">
                        <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                        <div className="space-y-2 text-white/80">
                          <p><strong>Date:</strong> {formatDate(event.date)}</p>
                          <p><strong>Time:</strong> {formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                          <p><strong>Capacity:</strong> {event.currentCapacity}/{event.maxCapacity}</p>
                        </div>
                        {event.description && (
                          <p className="mt-4 text-white/70">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-white/70">
                    No events scheduled for today
                  </div>
                )}
              </div>
            </div>

            {/* Disabled Events */}
            {disabledEvents.length > 0 && (
              <div className="bg-gradient-to-br from-orange-500/15 to-orange-500/5 backdrop-blur-sm rounded-3xl border border-orange-500/30 shadow-2xl">
                <div className="p-8 border-b border-orange-500/20">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <AlertTriangle className="w-8 h-8 mr-3 text-orange-400" />
                    Disabled Events
                  </h2>
                </div>
                <div className="p-8">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {disabledEvents.map((event) => (
                      <div key={event.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-orange-500/30">
                        <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                        <div className="space-y-2 text-white/80">
                          <p><strong>Date:</strong> {formatDate(event.date)}</p>
                          <p><strong>Time:</strong> {formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                          <p className="text-orange-300"><strong>Status:</strong> Disabled</p>
                        </div>
                        {event.description && (
                          <p className="mt-4 text-white/70">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div className="bg-gradient-to-br from-gray-500/15 to-gray-500/5 backdrop-blur-sm rounded-3xl border border-gray-500/30 shadow-2xl">
                <div className="p-8 border-b border-gray-500/20">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <Users className="w-8 h-8 mr-3 text-gray-400" />
                    Past Events (Last 7 Days)
                  </h2>
                </div>
                <div className="p-8">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastEvents.map((event) => (
                      <div key={event.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-gray-500/30">
                        <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                        <div className="space-y-2 text-white/80">
                          <p><strong>Date:</strong> {formatDate(event.date)}</p>
                          <p><strong>Time:</strong> {formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
                          <p className="text-gray-300"><strong>Status:</strong> Completed</p>
                        </div>
                        {event.description && (
                          <p className="mt-4 text-white/70">{event.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
