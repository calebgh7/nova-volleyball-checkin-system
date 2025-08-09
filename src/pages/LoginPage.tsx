import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, UserCheck, ArrowRight } from 'lucide-react';
import NovaLogo from '../components/NovaLogo';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      await login(data.username, data.password);
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
    }
  };

  const handleQuickCheckIn = () => {
    navigate('/checkin');
  };

  return (
    <div className="min-h-screen bg-nova-purple flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Nova Logo and Branding */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-nova-cyan/20 to-nova-purple/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <NovaLogo size={40} className="sm:w-12 sm:h-12" />
              </div>
            </div>
          </div>
          <div className="glass rounded-2xl p-4 sm:p-6 mx-2 sm:mx-4 border border-white/20">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">
              <span className="text-white drop-shadow-lg font-black">
                Nova Volleyball Club
              </span>
            </h1>
            <h2 className="text-lg sm:text-2xl font-bold text-white/90 mb-2 drop-shadow-md">
              Staff Portal
            </h2>
            <p className="text-white/80 text-base sm:text-lg drop-shadow-md font-semibold">
              Access management dashboard
            </p>
          </div>
        </div>

        {/* Quick Check-in Button */}
        <div className="mb-6 mx-2 sm:mx-4">
          <button
            onClick={handleQuickCheckIn}
            className="w-full glass rounded-2xl p-3 sm:p-4 border border-white/20 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group"
          >
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              <div className="p-2 bg-nova-cyan/20 rounded-xl border border-nova-cyan/30 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-nova-cyan" />
              </div>
              <div className="text-left flex-1">
                <div className="text-white font-semibold text-base sm:text-lg">Quick Check-in</div>
                <div className="text-white/70 text-xs sm:text-sm">For athletes and visitors</div>
              </div>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
            </div>
          </button>
        </div>

        {/* Login Form */}
        <div className="glass rounded-3xl p-6 sm:p-8 border border-white/20 backdrop-blur-xl">
          <div className="text-center mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Staff Login</h3>
            <p className="text-white/70 text-xs sm:text-sm">Sign in to access the management dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-3 sm:p-4 bg-red-500/20 border border-red-400/30 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-300 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-red-200 text-xs sm:text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm font-semibold text-white mb-2">
                Username or Email
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                className="input-modern w-full text-sm sm:text-base"
                placeholder="Enter your username or email"
              />
              {errors.username && (
                <p className="mt-2 text-xs sm:text-sm text-red-300">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-white mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="input-modern w-full text-sm sm:text-base"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-2 text-xs sm:text-sm text-red-300">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-nova-cyan text-nova-purple font-semibold py-3 px-6 rounded-xl hover:bg-nova-cyan/80 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-nova-cyan/30 transition-all duration-200 disabled:opacity-50 disabled:transform-none text-sm sm:text-base"
            >
              {isSubmitting ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
