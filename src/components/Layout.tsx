import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Users, Calendar, LogOut, Shield, UserCheck, Menu, X } from 'lucide-react';
import NovaLogo from './NovaLogo';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Check-In', href: '/staff-checkin', icon: UserCheck, description: 'Staff check-in system' },
    { name: 'Athletes', href: '/athletes', icon: Users, description: 'Manage athlete profiles' },
    { name: 'Events', href: '/events', icon: Calendar, description: 'Manage volleyball events' },
    ...(user?.role === 'admin' ? [{ name: 'Admin Panel', href: '/admin', icon: Shield, description: 'System administration and analytics' }] : []),
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Enhanced Navigation */}
      <nav className="bg-nova-purple-dark border-b border-white/20 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20">
            <div className="flex items-center">
              {/* Logo Section */}
              <div className="flex-shrink-0 flex items-center group">
                <div className="relative">
                  <NovaLogo size={32} className="sm:w-10 sm:h-10" />
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all duration-300"></div>
                </div>
                <div className="ml-2 sm:ml-3">
                  <span className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                    Nova Volleyball
                  </span>
                  <div className="text-xs text-white/80 font-medium hidden sm:block">
                    Club Management System
                  </div>
                </div>
              </div>
              
              {/* Desktop Navigation Links */}
              <div className="hidden lg:ml-10 lg:flex lg:space-x-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
                        isActive
                          ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                          : 'text-white/80 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20'
                      }`}
                      title={item.description}
                    >
                      <Icon className={`h-5 w-5 mr-2 transition-transform duration-300 ${
                        isActive ? 'scale-110 text-nova-cyan' : 'group-hover:scale-105'
                      }`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Right Side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Profile - Hidden on mobile */}
              <div className="hidden sm:flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-white">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-xs text-white/70 capitalize">
                    {user?.role}
                  </span>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-nova-cyan/30 to-nova-purple/30 rounded-full flex items-center justify-center border border-white/30">
                  <span className="text-white font-semibold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300 hover:scale-105"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-nova-purple-dark/95 backdrop-blur-sm border-t border-white/20">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                          : 'text-white/80 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mr-3 transition-transform duration-300 ${
                        isActive ? 'scale-110 text-nova-cyan' : 'group-hover:scale-105'
                      }`} />
                      {item.name}
                    </Link>
                  );
                })}
                
                {/* Mobile User Profile */}
                <div className="flex items-center justify-between px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 mt-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-nova-cyan/30 to-nova-purple/30 rounded-full flex items-center justify-center border border-white/30">
                      <span className="text-white font-semibold text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span className="text-xs text-white/70 capitalize">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>
      
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
