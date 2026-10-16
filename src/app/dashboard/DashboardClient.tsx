"use client";

import { useState, useEffect, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  LogOut, 
  User as UserIcon, 
  Settings, 
  MapPin, 
  Wallet, 
  Plus, 
  Coins, 
  Search, 
  Star, 
  Clock, 
  Loader2, 
  X, 
  Sun, 
  Moon, 
  Calendar, 
  ShieldCheck, 
  Headphones, 
  SlidersHorizontal,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Phone,
  Globe
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

type UserProps = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  avatar: string | null;
  footcoins: number;
  stadiums?: StadiumProps[];
};

type StadiumProps = {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  hourlyPrice: number;
  openingTime: string;
  closingTime: string;
  lat?: number;
  lng?: number;
  bookings?: { startTime: Date | string; status: string }[];
};

// Haversine formula to calculate distance in km between two lat/lng points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Soccer ball icon
function SoccerBallIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 7 15.5 9.5 14.5 14 9.5 14 8.5 9.5" fill="currentColor" fillOpacity="0.25" />
      <path d="m12 7-3.5 2.5M12 7l3.5 2.5M15.5 9.5 19 8M14.5 14l4 2M12 19v-5M9.5 14l-4 2M8.5 9.5 5 8" />
    </svg>
  );
}

export default function DashboardClient({ user, stadiums }: { user: UserProps; stadiums: StadiumProps[] }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('navoiy_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('navoiy_theme', nextTheme);
  };

  const isDark = theme === 'dark';

  if (user.role === 'PLAYER' || user.id === 'guest') {
    return <PlayerCatalog user={user} stadiums={stadiums} isDark={isDark} toggleTheme={toggleTheme} />;
  }

  // Owner Dashboard
  return <OwnerDashboard user={user} stadiums={user.stadiums || []} isDark={isDark} toggleTheme={toggleTheme} />;
}

// ==============================================
// Player Catalog (Dashboard)
// ==============================================
function PlayerCatalog({ 
  user, 
  stadiums, 
  isDark, 
  toggleTheme 
}: { 
  user: UserProps; 
  stadiums: StadiumProps[]; 
  isDark: boolean; 
  toggleTheme: () => void; 
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<'Today' | 'Tomorrow'>('Today');
  const [selectedSlot, setSelectedSlot] = useState<{ stadium: StadiumProps; time: string } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const filters = ['All', 'Nearest', 'Cheapest', 'Highest Rated'];

  // Geolocation detection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation denied or unavailable:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  // Distance calculator helper
  const getDistanceValue = (stadium: StadiumProps): number => {
    if (!userLocation || !stadium.lat || !stadium.lng) return 9999;
    return calculateDistance(userLocation.lat, userLocation.lng, stadium.lat, stadium.lng);
  };

  const getDistanceText = (stadium: StadiumProps) => {
    if (!userLocation || !stadium.lat || !stadium.lng) return 'Navoiy City';
    const dist = calculateDistance(userLocation.lat, userLocation.lng, stadium.lat, stadium.lng);
    if (dist < 1) return `${Math.round(dist * 1000)} m away`;
    return `${dist.toFixed(1)} km away`;
  };

  // Generate realistic time slots
  const generateTimeSlots = (open: string, close: string) => {
    const slots = [];
    let current = parseInt(open.split(':')[0], 10);
    const end = parseInt(close.split(':')[0], 10);
    if (isNaN(current)) current = 8;
    const maxEnd = isNaN(end) ? 23 : end;

    while (current < maxEnd) {
      slots.push(`${current < 10 ? '0' : ''}${current}:00`);
      current++;
    }
    return slots;
  };

  // Price normalizer (stadium prices in Uzbekistan Som)
  const formatPrice = (price: number) => {
    const normalized = price < 1000 ? Math.round(price * 3000) : price;
    return normalized.toLocaleString();
  };

  // Badges & Preview Images mapping (matching reference image)
  const getStadiumBadge = (index: number) => {
    const badges = [
      { text: 'Top Rated', bg: isDark ? 'bg-emerald-500/20 text-[#CCFF00] border border-[#CCFF00]/40' : 'bg-emerald-700 text-white' },
      { text: 'Popular', bg: isDark ? 'bg-emerald-500/20 text-[#CCFF00] border border-[#CCFF00]/40' : 'bg-emerald-700 text-white' },
      { text: 'Best Value', bg: isDark ? 'bg-emerald-500/20 text-[#CCFF00] border border-[#CCFF00]/40' : 'bg-emerald-700 text-white' },
      { text: 'New', bg: isDark ? 'bg-emerald-500/20 text-[#CCFF00] border border-[#CCFF00]/40' : 'bg-emerald-700 text-white' }
    ];
    return badges[index % badges.length];
  };

  const getStadiumRating = (index: number) => {
    const ratings = [
      { score: '4.8', count: 124 },
      { score: '4.6', count: 98 },
      { score: '4.7', count: 76 },
      { score: '4.5', count: 64 },
    ];
    return ratings[index % ratings.length];
  };

  const getStadiumImage = (stadium: StadiumProps, index: number) => {
    const lowerName = stadium.name.toLowerCase();
    const lowerDesc = (stadium.description || '').toLowerCase();
    if (lowerName.includes('indoor') || lowerName.includes('yoshlik') || lowerDesc.includes('indoor') || lowerDesc.includes('futsal')) {
      return '/pitch-indoor.jpg';
    }
    if (index % 2 === 0) {
      return '/pitch-preview.jpg';
    }
    return '/football-hero.jpg';
  };

  // Filtered & Sorted Stadiums
  const displayedStadiums = useMemo(() => {
    let result = [...stadiums];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
      );
    }

    // Filter tabs
    if (activeFilter === 'Nearest') {
      result.sort((a, b) => getDistanceValue(a) - getDistanceValue(b));
    } else if (activeFilter === 'Cheapest') {
      result.sort((a, b) => a.hourlyPrice - b.hourlyPrice);
    } else if (activeFilter === 'Highest Rated') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [stadiums, searchQuery, activeFilter, userLocation]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: isDark ? { background: '#1c1c1e', color: '#fff' } : { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' } 
        }} 
      />

      {/* TOPMOST ANNOUNCEMENT BAR (From reference design) */}
      <div className="bg-[#0b131f] text-gray-300 text-xs py-2 px-4 sm:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SoccerBallIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-gray-200">Play More. Book Smarter. Enjoy Football in Navoiy.</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-[11px]">
            <span className="flex items-center text-gray-400">
              <Phone size={12} className="mr-1 text-emerald-400" />
              Have any questions? <span className="text-white ml-1 font-semibold">+998 (79) 220-4050</span>
            </span>
            <span className="flex items-center text-gray-400">
              <Globe size={12} className="mr-1 text-emerald-400" />
              English / O&apos;zbek
            </span>
            {user.id === 'guest' ? (
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center">
                <UserIcon size={12} className="mr-1" /> Login / Register
              </Link>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center">
                <UserIcon size={12} className="mr-1" /> {user.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* MAIN TOP NAVIGATION BAR */}
      <nav className={`sticky top-0 z-40 transition-colors duration-300 border-b backdrop-blur-md ${
        isDark ? 'bg-black/90 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
                isDark ? 'bg-[#CCFF00]/15 text-[#CCFF00]' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <SoccerBallIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight leading-tight block">
                  NAVOIY <span className={isDark ? 'text-[#CCFF00]' : 'text-emerald-600'}>FOOTBALL</span>
                </span>
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase block -mt-1">
                  PITCH BOOKING
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (From reference image) */}
            <div className="hidden lg:flex items-center space-x-7 text-sm font-semibold">
              <Link href="/dashboard" className={`pb-1 border-b-2 font-bold transition-colors ${
                isDark ? 'border-[#CCFF00] text-white' : 'border-emerald-600 text-emerald-700'
              }`}>
                Home
              </Link>
              <a href="#stadiums-section" className={`transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-emerald-700'
              }`}>
                Browse Fields
              </a>
              <a href="#how-it-works" className={`transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-emerald-700'
              }`}>
                How It Works
              </a>
              <Link href={user.role === 'OWNER' ? '/dashboard' : '/register'} className={`transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-emerald-700'
              }`}>
                For Owners
              </Link>
              <a href="#why-choose" className={`transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-emerald-700'
              }`}>
                About Us
              </a>
              <a href="#footer" className={`transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-emerald-700'
              }`}>
                Contact Us
              </a>
            </div>
          </div>

          {/* Right Action Icons & List Your Field Button */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Footcoins Balance */}
            <div className={`flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              isDark 
                ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00]' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <Coins size={14} className={`mr-1.5 ${isDark ? 'text-[#CCFF00]' : 'text-emerald-600'}`} />
              <span>{user.footcoins}</span>
              <span className="hidden sm:inline ml-1 font-semibold text-[11px] opacity-75">Coins</span>
            </div>

            {/* Dark / Light Mode Toggle Button */}
            <button 
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-amber-300 hover:bg-white/10 hover:text-amber-200' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* List Your Field + Button (Matching reference design top-right button) */}
            <Link
              href={user.role === 'OWNER' ? '/dashboard' : '/register'}
              className="hidden sm:inline-flex items-center px-4 py-2.5 rounded-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.98]"
            >
              List Your Field <span className="ml-1 text-sm font-black">+</span>
            </Link>

            {/* User Profile Pill or Login Button */}
            {user.id === 'guest' ? (
              <Link
                href="/login"
                className={`px-4 py-2 rounded-full font-bold text-xs border transition-all ${
                  isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                Sign In
              </Link>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 border-white/10' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ${
                    isDark ? 'bg-gray-800 border border-[#CCFF00]/40' : 'bg-emerald-100 border border-emerald-400'
                  }`}>
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={15} className={isDark ? 'text-[#CCFF00]' : 'text-emerald-700'} />
                    )}
                  </div>
                  <span className="font-bold text-xs hidden sm:block max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={13} className={isDark ? 'text-gray-400' : 'text-slate-500'} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className={`absolute right-0 mt-2.5 w-52 rounded-2xl shadow-xl py-2 z-50 border transition-all ${
                    isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-slate-200/80'
                  }`}>
                    <div className={`px-4 py-2 border-b mb-1 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold truncate">{user.name}</p>
                    </div>
                    <Link 
                      href="/settings"
                      onClick={() => setShowDropdown(false)}
                      className={`flex items-center px-4 py-2 text-xs font-semibold transition-colors ${
                        isDark ? 'hover:bg-white/5 text-gray-200' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Settings size={15} className="mr-2.5 opacity-70" /> Settings
                    </Link>
                    <button 
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={15} className="mr-2.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </nav>

      {/* HERO BANNER SECTION (Direct visual match to reference image) */}
      <section className="relative overflow-visible pb-12">
        {/* Background Banner with Floodlit Pitch Image */}
        <div className="relative h-[380px] sm:h-[420px] md:h-[460px] w-full overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('/football-hero.jpg')` }}
          />
          {/* Subtle gradient overlays for crystal clear contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center pt-2 pb-16">
            <div className="max-w-2xl text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-xs">
                <Sparkles size={13} className="text-emerald-400" />
                <span>Navoiy City Stadium Booking</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
                Book Football Fields <br />
                <span className={isDark ? 'text-[#CCFF00]' : 'text-emerald-400'}>Anytime</span>, Anywhere
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-200 max-w-xl font-normal leading-relaxed">
                Find the best football fields near you in Navoiy, choose your time, and book instantly online.
              </p>
            </div>
          </div>
        </div>

        {/* FLOATING HORIZONTAL SEARCH / FILTER BAR (Matching Reference Image) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-14 relative z-20">
          <div className={`p-3 sm:p-4 rounded-2xl md:rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#141414]/95 border-white/10 shadow-2xl backdrop-blur-md' 
              : 'bg-white border-slate-200/90 shadow-xl shadow-slate-200/70'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              
              {/* Field 1: Select Location / Stadium Name */}
              <div className={`md:col-span-5 flex items-center px-4 py-3 rounded-xl border transition-colors ${
                isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <MapPin size={18} className={`mr-3 shrink-0 ${isDark ? 'text-[#CCFF00]' : 'text-emerald-600'}`} />
                <input 
                  type="text"
                  placeholder="Select Location / Stadium..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Field 2: Select Date */}
              <div className={`md:col-span-3 flex items-center px-4 py-3 rounded-xl border transition-colors ${
                isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <Calendar size={18} className={`mr-3 shrink-0 ${isDark ? 'text-[#CCFF00]' : 'text-emerald-600'}`} />
                <select 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value as 'Today' | 'Tomorrow')}
                  className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                >
                  <option value="Today" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-800'}>Select Date: Today</option>
                  <option value="Tomorrow" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-800'}>Select Date: Tomorrow</option>
                </select>
              </div>

              {/* Field 3: Select Time / Sort Filter */}
              <div className={`md:col-span-2 flex items-center px-4 py-3 rounded-xl border transition-colors ${
                isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <Clock size={18} className={`mr-3 shrink-0 ${isDark ? 'text-[#CCFF00]' : 'text-emerald-600'}`} />
                <select 
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer"
                >
                  <option value="All" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-800'}>All Times</option>
                  <option value="Nearest" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-800'}>Nearest</option>
                  <option value="Cheapest" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-800'}>Cheapest</option>
                  <option value="Highest Rated" className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-800'}>Top Rated</option>
                </select>
              </div>

              {/* Action Button: Search Fields */}
              <div className="md:col-span-2">
                <a 
                  href="#stadiums-section"
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center transition-all active:scale-[0.98] ${
                    isDark 
                      ? 'bg-[#CCFF00] hover:bg-[#b3e600] text-black shadow-lg shadow-[#CCFF00]/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30'
                  }`}
                >
                  <Search size={15} className="mr-2" />
                  Search Fields
                </a>
              </div>

            </div>
          </div>
        </div>

        {/* 5 VALUE PROPOSITIONS (Matching Reference Image under Search Bar) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            
            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-white border-slate-200/70 text-slate-700 shadow-xs'
            }`}>
              <div className="flex items-center space-x-3 mb-1">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-50 text-emerald-600'}`}>
                  <SoccerBallIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm">Multiple Fields</h4>
              </div>
              <p className="text-xs opacity-75 mt-1">Wide range of fields in Navoiy</p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-white border-slate-200/70 text-slate-700 shadow-xs'
            }`}>
              <div className="flex items-center space-x-3 mb-1">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Calendar size={18} />
                </div>
                <h4 className="font-bold text-sm">Easy Booking</h4>
              </div>
              <p className="text-xs opacity-75 mt-1">Book your field in just a few clicks</p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-white border-slate-200/70 text-slate-700 shadow-xs'
            }`}>
              <div className="flex items-center space-x-3 mb-1">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-50 text-emerald-600'}`}>
                  <ShieldCheck size={18} />
                </div>
                <h4 className="font-bold text-sm">Secure Payments</h4>
              </div>
              <p className="text-xs opacity-75 mt-1">Pay online securely and easily</p>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-white border-slate-200/70 text-slate-700 shadow-xs'
            }`}>
              <div className="flex items-center space-x-3 mb-1">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Clock size={18} />
                </div>
                <h4 className="font-bold text-sm">Real-time Availability</h4>
              </div>
              <p className="text-xs opacity-75 mt-1">View real-time availability</p>
            </div>

            <div className={`col-span-2 md:col-span-1 p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-white border-slate-200/70 text-slate-700 shadow-xs'
            }`}>
              <div className="flex items-center space-x-3 mb-1">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Headphones size={18} />
                </div>
                <h4 className="font-bold text-sm">24/7 Support</h4>
              </div>
              <p className="text-xs opacity-75 mt-1">We&apos;re here to help you anytime</p>
            </div>

          </div>
        </div>
      </section>

      {/* MAIN CATALOG SECTION & HOW IT WORKS SIDEBAR */}
      <main id="stadiums-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16">
        
        {/* Section Header with Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Popular Football Fields
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Showing {displayedStadiums.length} available fields in Navoiy
            </p>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === filter 
                    ? isDark
                      ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/20'
                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : isDark
                      ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Grid: Stadium Cards + "How It Works" Card (Matching Reference Image) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column: Stadium Cards */}
          <div className="lg:col-span-8 space-y-6">
            {displayedStadiums.length === 0 ? (
              <div className={`p-12 text-center rounded-3xl border ${
                isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-xs'
              }`}>
                <MapPin size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-slate-400'}`} />
                <h3 className="text-xl font-bold mb-2">No football fields found</h3>
                <p className={`max-w-md mx-auto text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  No pitches matched your search &quot;{searchQuery}&quot;. Try adjusting your search term.
                </p>
                <button 
                  onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
                  className={`mt-6 px-6 py-2.5 rounded-full font-bold text-sm cursor-pointer ${
                    isDark ? 'bg-[#CCFF00] text-black' : 'bg-emerald-600 text-white'
                  }`}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedStadiums.map((stadium, index) => {
                  const slots = generateTimeSlots(stadium.openingTime, stadium.closingTime);
                  const bookedSlots = stadium.bookings
                    ?.filter(b => b.status === 'PENDING' || b.status === 'COMPLETED')
                    .map(b => {
                      const h = new Date(b.startTime).getHours();
                      return `${h < 10 ? '0' : ''}${h}:00`;
                    }) || [];
                  const badge = getStadiumBadge(index);
                  const rating = getStadiumRating(index);
                  const pitchImage = getStadiumImage(stadium, index);
                  const formattedHourlyPrice = formatPrice(stadium.hourlyPrice);

                  return (
                    <div 
                      key={stadium.id} 
                      className={`group rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col ${
                        isDark 
                          ? 'bg-[#141414] border-white/10 hover:border-[#CCFF00]/40 shadow-xl' 
                          : 'bg-white border-slate-200 hover:border-emerald-500/60 shadow-sm hover:shadow-lg'
                      }`}
                    >
                      {/* Stadium Image with Badges */}
                      <div className="relative h-48 w-full overflow-hidden bg-gray-900">
                        <img 
                          src={pitchImage} 
                          alt={stadium.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                        {/* Top Left Badge (e.g., "Top Rated", "Popular", "Best Value", "New") */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className={`text-[11px] font-bold px-3 py-1 rounded-md shadow-sm ${badge.bg}`}>
                            {badge.text}
                          </span>
                        </div>

                        {/* Top Right Star Rating */}
                        <div className="absolute top-3 right-3 z-10 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center border border-white/10 text-white text-xs font-bold">
                          <Star size={13} className="text-amber-400 fill-amber-400 mr-1" />
                          <span>{rating.score}</span>
                          <span className="opacity-60 text-[10px] ml-1">({rating.count})</span>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Stadium Name */}
                          <h3 className="text-lg font-bold tracking-tight mb-1 group-hover:text-emerald-500 transition-colors">
                            {stadium.name}
                          </h3>

                          {/* Location & Distance */}
                          <div className={`flex items-center text-xs font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            <MapPin size={13} className={`mr-1 shrink-0 ${isDark ? 'text-[#CCFF00]' : 'text-emerald-600'}`} />
                            <span className="truncate mr-2">{stadium.address}</span>
                            <span className="shrink-0 font-bold opacity-80">• {getDistanceText(stadium)}</span>
                          </div>

                          {/* Time Slots Section */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2 opacity-65">
                              <span className="flex items-center">
                                <Clock size={11} className="mr-1" /> Available Slots
                              </span>
                              <span>{selectedDate}</span>
                            </div>

                            {/* Horizontal scrollable time slots */}
                            <div className="flex space-x-1.5 overflow-x-auto pb-1.5 scrollbar-hide">
                              {slots.slice(0, 10).map((slot, sIdx) => {
                                const isBooked = bookedSlots.includes(slot);
                                return (
                                  <button
                                    key={sIdx}
                                    onClick={() => setSelectedSlot({ stadium, time: slot })}
                                    disabled={isBooked}
                                    title={isBooked ? 'Slot already booked' : `Book ${slot}`}
                                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      isBooked
                                        ? isDark 
                                          ? 'bg-red-500/10 border border-red-500/20 text-red-400/50 line-through cursor-not-allowed'
                                          : 'bg-slate-100 border border-slate-200 text-slate-400 line-through cursor-not-allowed'
                                        : isDark
                                          ? 'bg-white/5 border border-white/10 text-white hover:border-[#CCFF00] hover:bg-[#CCFF00]/15'
                                          : 'bg-emerald-50/80 border border-emerald-200 text-emerald-800 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Price & Action Button (Matching reference image) */}
                        <div className={`pt-4 border-t flex items-center justify-between ${
                          isDark ? 'border-white/10' : 'border-slate-100'
                        }`}>
                          {/* Price */}
                          <div>
                            <span className={`text-xl font-black tracking-tight ${
                              isDark ? 'text-[#CCFF00]' : 'text-emerald-700'
                            }`}>
                              {formattedHourlyPrice} <span className="text-xs font-normal">UZS</span>
                            </span>
                            <span className={`text-[11px] block ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              / hour
                            </span>
                          </div>

                          {/* Action Button: View Details / Select Slot */}
                          <button
                            onClick={() => {
                              const firstAvailable = slots.find(s => !bookedSlots.includes(s)) || slots[0];
                              setSelectedSlot({ stadium, time: firstAvailable });
                            }}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer active:scale-[0.98] ${
                              isDark
                                ? 'border-[#CCFF00] text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black'
                                : 'border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white shadow-xs'
                            }`}
                          >
                            View Details
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar: "How It Works" Card (Exact visual match from reference) */}
          <div id="how-it-works" className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? 'bg-[#141414] border-white/10' : 'bg-[#f0fdf4] border-emerald-100 shadow-xs'
            }`}>
              <h3 className={`text-lg font-black tracking-tight mb-5 flex items-center ${
                isDark ? 'text-[#CCFF00]' : 'text-emerald-800'
              }`}>
                How It Works
              </h3>

              <div className="space-y-6">
                
                {/* Step 1: Search */}
                <div className="flex items-start space-x-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <Search size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Search</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                      Find football fields near you in Navoiy
                    </p>
                  </div>
                </div>

                {/* Step 2: Choose Time */}
                <div className="flex items-start space-x-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Choose Time</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                      Select your preferred date and time
                    </p>
                  </div>
                </div>

                {/* Step 3: Book & Pay */}
                <div className="flex items-start space-x-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <Wallet size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Book & Pay</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                      Confirm your booking and make payment
                    </p>
                  </div>
                </div>

                {/* Step 4: Play Football */}
                <div className="flex items-start space-x-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <SoccerBallIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Play Football</h4>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                      Enjoy your game!
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Footcoins Rewards Banner */}
            <div className={`p-6 rounded-3xl border transition-all ${
              isDark 
                ? 'bg-gradient-to-br from-emerald-950/40 to-black border-emerald-500/20' 
                : 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-md'
            }`}>
              <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider mb-2 text-amber-300">
                <Coins size={15} />
                <span>Navoiy Footcoins</span>
              </div>
              <h4 className="text-base font-black tracking-tight mb-1.5">
                Earn Footcoins with every game
              </h4>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-gray-300' : 'text-emerald-100'}`}>
                Level up your player tier and redeem Footcoins for free pitch reservations across Navoiy.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs font-bold">
                <span>Your Balance:</span>
                <span className={isDark ? 'text-[#CCFF00]' : 'text-amber-300'}>
                  {user.footcoins} Coins
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* "WHY CHOOSE NAVOIY FOOTBALL?" SECTION (From Reference Image Bottom) */}
        <section id="why-choose" className="mt-20 pt-10 border-t border-slate-200/60 dark:border-white/10">
          <div className="text-left mb-8">
            <h3 className="text-2xl font-black uppercase tracking-tight">
              Why Choose Navoiy Football?
            </h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              The standard platform for booking sports courts and football pitches in Navoiy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <SoccerBallIcon className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base mb-1">Wide Range of Fields</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Indoor & outdoor fields with high-grade synthetic turf and floodlit courts.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <Coins size={22} />
              </div>
              <h4 className="font-bold text-base mb-1">Best Prices</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Competitive prices with direct owner rates and zero reservation markups.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <CheckCircle2 size={22} />
              </div>
              <h4 className="font-bold text-base mb-1">Trusted by Players</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Join thousands of football lovers playing and booking matches weekly.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <Clock size={22} />
              </div>
              <h4 className="font-bold text-base mb-1">Easy Management</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Instant slot reservation, live reminders, and hassle-free court bookings.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer id="footer" className={`py-12 border-t transition-colors ${
        isDark ? 'bg-black/90 border-white/10 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center space-x-3">
            <SoccerBallIcon className="w-5 h-5 text-emerald-600" />
            <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
              NAVOIY FOOTBALL
            </span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex space-x-6">
            <a href="#stadiums-section" className="hover:text-emerald-600 transition-colors">Browse Fields</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
            <Link href="/login" className="hover:text-emerald-600 transition-colors">Player Sign In</Link>
          </div>
        </div>
      </footer>

      {/* BOOKING MODAL */}
      {selectedSlot && (
        <BookingModal 
          user={user}
          stadium={selectedSlot.stadium} 
          time={selectedSlot.time} 
          onClose={() => setSelectedSlot(null)} 
          isDark={isDark}
        />
      )}
    </div>
  );
}

// ==============================================
// Booking Modal (Refreshed for Light & Dark)
// ==============================================
function BookingModal({ 
  user, 
  stadium, 
  time, 
  onClose,
  isDark
}: { 
  user: UserProps; 
  stadium: StadiumProps; 
  time: string; 
  onClose: () => void;
  isDark: boolean;
}) {
  const [paymentMethod, setPaymentMethod] = useState<'payme' | 'click' | 'cash'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const normalizedHourlyPrice = stadium.hourlyPrice < 1000 ? Math.round(stadium.hourlyPrice * 3000) : stadium.hourlyPrice;

  const handleBooking = async () => {
    if (user.id === 'guest') {
      toast.error('Please sign in or register to complete your booking reservation!', { duration: 4000 });
      setTimeout(() => {
        window.location.href = '/login?callbackUrl=/dashboard';
      }, 1500);
      return;
    }

    if (paymentMethod === 'payme' || paymentMethod === 'click') {
      toast.error(`${paymentMethod === 'payme' ? 'Payme' : 'Click'} integration is coming soon! Please choose Cash for now.`, { duration: 4000 });
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading('Confirming booking slot...');

    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(hours + 1);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stadiumId: stadium.id,
          userId: user.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          paymentMethod: 'cash'
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Booking confirmed! Please pay cash at the stadium.', { id: toastId, duration: 4000 });
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1800);
      } else {
        toast.error(data.error || 'Failed to book slot.', { id: toastId });
        setIsProcessing(false);
      }
    } catch {
      toast.error('Network error. Please try again.', { id: toastId });
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity" 
        onClick={() => !isProcessing && onClose()} 
      />

      <div className={`relative w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border transition-all animate-in slide-in-from-bottom-6 duration-200 ${
        isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black uppercase tracking-tight">Confirm Booking</h2>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className={`p-1.5 rounded-full cursor-pointer ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stadium & Slot Summary Box */}
        <div className={`p-4 rounded-2xl border mb-6 ${
          isDark ? 'bg-black/60 border-white/10' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <div className="flex justify-between items-center text-sm mb-2.5">
            <span className={isDark ? 'text-gray-400 font-medium' : 'text-slate-500 font-medium'}>Stadium</span>
            <span className="font-bold">{stadium.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2.5">
            <span className={isDark ? 'text-gray-400 font-medium' : 'text-slate-500 font-medium'}>Location</span>
            <span className="font-semibold text-xs text-right max-w-[200px] truncate">{stadium.address}</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2.5">
            <span className={isDark ? 'text-gray-400 font-medium' : 'text-slate-500 font-medium'}>Time Slot</span>
            <span className={`font-black ${isDark ? 'text-[#CCFF00]' : 'text-emerald-700'}`}>
              {time} - {parseInt(time.split(':')[0], 10) + 1}:00
            </span>
          </div>
          <div className={`h-px my-3 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          <div className="flex justify-between items-center">
            <span className={isDark ? 'text-gray-400 font-bold' : 'text-slate-600 font-bold'}>Total Price</span>
            <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
              {normalizedHourlyPrice.toLocaleString()} UZS
            </span>
          </div>
        </div>

        {user.id === 'guest' && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold text-center">
            You are browsing as a guest. Please sign in to lock in your time slot!
          </div>
        )}

        {/* Payment Methods */}
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          Select Payment Method
        </h3>
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <button 
            type="button"
            onClick={() => {
              setPaymentMethod('payme');
              toast.error('Payme integration is coming soon!', { duration: 3000 });
            }}
            disabled={isProcessing}
            className={`py-3 px-2 rounded-xl font-bold text-xs relative transition-all border cursor-pointer ${
              paymentMethod === 'payme'
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500'
                : isDark 
                  ? 'border-white/10 bg-white/5 text-gray-400' 
                  : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            PAYME
            <span className="absolute -top-1.5 -right-1 bg-amber-400 text-black text-[8px] font-black px-1.5 py-0.2 rounded-full">SOON</span>
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setPaymentMethod('click');
              toast.error('Click integration is coming soon!', { duration: 3000 });
            }}
            disabled={isProcessing}
            className={`py-3 px-2 rounded-xl font-bold text-xs relative transition-all border cursor-pointer ${
              paymentMethod === 'click'
                ? 'border-sky-500 bg-sky-500/10 text-sky-500'
                : isDark 
                  ? 'border-white/10 bg-white/5 text-gray-400' 
                  : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            CLICK
            <span className="absolute -top-1.5 -right-1 bg-amber-400 text-black text-[8px] font-black px-1.5 py-0.2 rounded-full">SOON</span>
          </button>

          <button 
            type="button"
            onClick={() => setPaymentMethod('cash')}
            disabled={isProcessing}
            className={`py-3 px-2 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
              paymentMethod === 'cash'
                ? isDark 
                  ? 'border-[#CCFF00] bg-[#CCFF00]/15 text-[#CCFF00]' 
                  : 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : isDark 
                  ? 'border-white/10 bg-white/5 text-gray-400' 
                  : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            CASH
          </button>
        </div>

        {/* CTA Confirmation Button */}
        <button 
          onClick={handleBooking}
          disabled={isProcessing}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center transition-all cursor-pointer active:scale-[0.98] ${
            isDark 
              ? 'bg-[#CCFF00] hover:bg-[#b3e600] text-black shadow-lg shadow-[#CCFF00]/20' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Processing...
            </>
          ) : user.id === 'guest' ? (
            'Sign In & Confirm Slot'
          ) : (
            'Confirm & Reserve Slot'
          )}
        </button>

      </div>
    </div>
  );
}

// ==============================================
// Owner Dashboard (Refreshed for Light & Dark)
// ==============================================
function OwnerDashboard({ 
  user, 
  stadiums, 
  isDark, 
  toggleTheme 
}: { 
  user: UserProps; 
  stadiums: StadiumProps[]; 
  isDark: boolean; 
  toggleTheme: () => void; 
}) {
  const [activeTab, setActiveTab] = useState('stadiums');
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col md:flex-row relative transition-colors ${
      isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <Toaster position="top-center" />

      {/* Sidebar */}
      <aside className={`w-full md:w-64 flex flex-col z-20 border-b md:border-b-0 md:border-r transition-colors ${
        isDark ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-6 border-b flex items-center justify-between ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}>
          <Link href="/dashboard" className="text-xl font-black tracking-tight">
            NAVOIY <span className={isDark ? 'text-[#CCFF00]' : 'text-emerald-600'}>FOOTBALL</span>
          </Link>
          <button onClick={toggleTheme} className="p-2 rounded-full border border-current opacity-70 hover:opacity-100 cursor-pointer">
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('stadiums')}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'stadiums' 
                ? isDark 
                  ? 'bg-[#CCFF00] text-black' 
                  : 'bg-emerald-600 text-white' 
                : isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-white/5' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin size={18} className="mr-3" /> My Stadiums
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'wallet' 
                ? isDark 
                  ? 'bg-[#CCFF00] text-black' 
                  : 'bg-emerald-600 text-white' 
                : isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-white/5' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wallet size={18} className="mr-3" /> Wallet & Earnings
          </button>
        </nav>

        <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center mb-5 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden ${
              isDark ? 'bg-gray-800' : 'bg-emerald-100'
            }`}>
              {user.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <UserIcon size={18} className={isDark ? 'text-gray-400' : 'text-emerald-700'} />
              )}
            </div>
            <div>
              <p className="text-sm font-bold truncate max-w-[120px]">{user.name}</p>
              <p className="text-xs opacity-60 capitalize">Stadium Owner</p>
            </div>
          </div>
          
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors font-semibold text-xs cursor-pointer"
          >
            <LogOut size={16} className="mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Stadium Business Portal</h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Manage your pitches in Navoiy and track online player reservations.
            </p>
          </div>
          {activeTab === 'stadiums' && stadiums.length > 0 && (
            <button 
              onClick={() => setShowAddModal(true)}
              className={`font-black text-sm px-6 py-2.5 rounded-full flex items-center shadow-md cursor-pointer ${
                isDark 
                  ? 'bg-[#CCFF00] text-black hover:bg-[#b3e600]' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <Plus size={18} className="mr-2" /> Add Stadium
            </button>
          )}
        </header>

        {activeTab === 'stadiums' && (
          <>
            {stadiums.length === 0 ? (
              <div className={`rounded-3xl p-10 min-h-[400px] flex flex-col items-center justify-center text-center border ${
                isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
                  isDark ? 'bg-white/5 text-gray-500' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <MapPin size={28} />
                </div>
                <h2 className="text-xl font-bold mb-2">No stadiums registered yet.</h2>
                <p className={`max-w-sm mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Start managing your courts and receiving player bookings in Navoiy by adding your first stadium.
                </p>
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className={`font-black text-sm px-7 py-3 rounded-full flex items-center cursor-pointer ${
                    isDark ? 'bg-[#CCFF00] text-black' : 'bg-emerald-600 text-white'
                  }`}
                >
                  <Plus size={18} className="mr-2" /> Add New Stadium
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {stadiums.map((stadium) => (
                  <div key={stadium.id} className={`rounded-3xl p-6 border flex flex-col sm:flex-row gap-5 ${
                    isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden bg-gray-900 shrink-0">
                      <img src="/pitch-preview.jpg" alt={stadium.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black tracking-tight mb-1">{stadium.name}</h3>
                      <p className={`text-xs mb-3 line-clamp-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{stadium.address}</p>
                      <div className="flex items-center space-x-4 mb-4">
                        <span className={`font-black text-base ${isDark ? 'text-[#CCFF00]' : 'text-emerald-700'}`}>
                          {(stadium.hourlyPrice < 1000 ? Math.round(stadium.hourlyPrice * 3000) : stadium.hourlyPrice).toLocaleString()} UZS
                          <span className="text-xs font-normal opacity-60">/hr</span>
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{stadium.openingTime} - {stadium.closingTime}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-colors cursor-pointer ${
                          isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                        }`}>
                          Edit Details
                        </button>
                        <button className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-colors cursor-pointer ${
                          isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                        }`}>
                          View Bookings
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-3xl p-8 border ${
              isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="text-lg font-bold flex items-center mb-6">
                <Wallet className={`mr-2.5 ${isDark ? 'text-[#CCFF00]' : 'text-emerald-600'}`} /> Total Stadium Earnings
              </h3>
              <p className="text-4xl font-black mb-1">
                0 <span className="text-xl opacity-60">UZS</span>
              </p>
              <p className={`text-xs mb-8 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>+0 UZS earned this week</p>
              
              <button disabled className={`w-full font-bold text-xs py-3.5 rounded-xl border cursor-not-allowed ${
                isDark ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                Withdraw Funds (Requires 500,000 UZS minimum)
              </button>
            </div>
            
            <div className={`rounded-3xl p-8 border flex flex-col justify-center items-center text-center ${
              isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                isDark ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <Plus size={22} />
              </div>
              <h3 className="font-bold text-base mb-1">Link Bank Card</h3>
              <p className={`text-xs max-w-xs mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Add a verified Uzcard or Humo card to receive your court revenue automatically.
              </p>
              <button className={`font-bold text-xs px-6 py-2.5 rounded-full cursor-pointer ${
                isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}>
                Add Card
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add Stadium Modal */}
      {showAddModal && <AddStadiumModal onClose={() => setShowAddModal(false)} isDark={isDark} />}
    </div>
  );
}

// Add Stadium Modal
function AddStadiumModal({ onClose, isDark }: { onClose: () => void; isDark: boolean }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    hourlyPrice: '',
    openingTime: '08:00',
    closingTime: '23:00',
    lat: 40.0844,
    lng: 65.3792,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMapClick = (e: any) => {
    const coords = e.get('coords');
    setFormData({ ...formData, lat: coords[0], lng: coords[1] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading('Creating stadium...');

    try {
      const res = await fetch('/api/stadiums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Stadium created successfully!', { id: toastId });
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.error || 'Failed to create stadium.', { id: toastId });
        setIsSubmitting(false);
      }
    } catch {
      toast.error('Network error.', { id: toastId });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={() => !isSubmitting && onClose()} />
      <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
        isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <button onClick={onClose} className={`absolute top-6 right-6 p-2 rounded-full cursor-pointer ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
          <X size={18} />
        </button>

        <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Add New Stadium</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70">Stadium Name</label>
              <input 
                required 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none ${
                  isDark ? 'bg-black border-white/10 focus:border-[#CCFF00]' : 'bg-slate-50 border-slate-200 focus:border-emerald-600'
                }`}
                placeholder="e.g. Navoiy Arena" 
              />
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70">Hourly Price (UZS)</label>
              <input 
                required 
                type="number" 
                name="hourlyPrice" 
                value={formData.hourlyPrice} 
                onChange={handleChange} 
                className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none ${
                  isDark ? 'bg-black border-white/10 focus:border-[#CCFF00]' : 'bg-slate-50 border-slate-200 focus:border-emerald-600'
                }`}
                placeholder="e.g. 150000" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={2} 
              className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none resize-none ${
                isDark ? 'bg-black border-white/10 focus:border-[#CCFF00]' : 'bg-slate-50 border-slate-200 focus:border-emerald-600'
              }`}
              placeholder="Pristine synthetic turf pitch with floodlights..." 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70">Opening Time</label>
              <select 
                name="openingTime" 
                value={formData.openingTime} 
                onChange={handleChange} 
                className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none ${
                  isDark ? 'bg-black border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={`${i < 10 ? '0' : ''}${i}:00`}>{i < 10 ? '0' : ''}{i}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70">Closing Time</label>
              <select 
                name="closingTime" 
                value={formData.closingTime} 
                onChange={handleChange} 
                className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none ${
                  isDark ? 'bg-black border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={`${i < 10 ? '0' : ''}${i}:00`}>{i < 10 ? '0' : ''}{i}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70">Address</label>
              <input 
                required 
                type="text" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none ${
                  isDark ? 'bg-black border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
                placeholder="Navoiy City Center..." 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70">Pin Location on Map</label>
            <div className="w-full h-56 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
              <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY, lang: 'en_RU' }}>
                <Map 
                  defaultState={{ center: [40.0844, 65.3792], zoom: 13 }} 
                  width="100%" 
                  height="100%"
                  onClick={handleMapClick}
                >
                  <Placemark geometry={[formData.lat, formData.lng]} options={{ preset: 'islands#greenIcon' }} />
                </Map>
              </YMaps>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center transition-all cursor-pointer ${
              isDark ? 'bg-[#CCFF00] text-black hover:bg-[#b3e600]' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isSubmitting ? <><Loader2 className="animate-spin mr-2" size={18} /> Saving...</> : 'Save Stadium'}
          </button>
        </form>
      </div>
    </div>
  );
}
