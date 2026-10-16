"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign, 
  LandPlot, 
  CalendarCheck, 
  TrendingUp, 
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  ShieldCheck,
  User,
  Plus,
  Eye,
  EyeOff,
  Search,
  Copy,
  Check,
  X,
  KeyRound,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  role: string;
  avatar: string | null;
  createdAt: Date | string;
  _count?: {
    bookings: number;
    stadiums: number;
  };
}

interface TransactionData {
  id: string;
  amount: number;
  provider: string;
  status: string;
  createdAt: Date | string;
  booking?: {
    stadium?: { name: string } | null;
    user?: { name: string | null; username: string | null; email: string | null } | null;
  } | null;
}

interface AdminDashboardClientProps {
  metrics: {
    completedRevenue: number;
    totalVolume: number;
    platformCommission: number;
    activeStadiums: number;
    totalBookings: number;
    confirmedBookings: number;
    totalUsers: number;
  };
  users: UserData[];
  recentTransactions: TransactionData[];
}

export default function AdminDashboardClient({
  metrics,
  users,
  recentTransactions,
}: AdminDashboardClientProps) {
  const router = useRouter();

  // Role filter & search
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNERS' | 'PLAYERS' | 'ADMINS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Create Owner Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Last created owner for immediate credential handover
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    username: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Categorized user lists
  const ownerUsers = users.filter((u) => u.role === 'OWNER');
  const playerUsers = users.filter((u) => u.role === 'PLAYER' || !u.role);
  const adminUsers = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');

  const filteredUsers = users.filter((u) => {
    // Role filter
    if (roleFilter === 'OWNERS' && u.role !== 'OWNER') return false;
    if (roleFilter === 'PLAYERS' && u.role !== 'PLAYER' && u.role !== '') return false;
    if (roleFilter === 'ADMINS' && u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN') return false;

    // Search term filter
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q);
    const usernameMatch = u.username?.toLowerCase().includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);
    return nameMatch || usernameMatch || emailMatch;
  });

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/create-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create Stadium Owner');
      }

      toast.success(data.message || 'Stadium Owner created successfully!');
      setCreatedCredentials({
        name: fullName,
        username: username.toLowerCase().trim(),
        password,
      });

      // Reset form fields
      setFullName('');
      setUsername('');
      setPassword('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Stadium Owner Account:\nName: ${createdCredentials.name}\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage stadiums, platform metrics, and accounts in Navoiy.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsModalOpen(true);
              setCreatedCredentials(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#CCFF00] hover:bg-[#b5e600] text-black rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus size={16} /> Create New Stadium Owner
          </button>
          <Link
            href="/admin/stadiums"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-semibold transition-all shadow-sm"
          >
            <LandPlot size={16} /> Manage Stadiums
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Paid Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Paid Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-3">{metrics.completedRevenue.toLocaleString()} <span className="text-xs font-normal text-gray-500">UZS</span></p>
          <p className="text-xs text-gray-400 mt-1">Total Pipeline: {metrics.totalVolume.toLocaleString()} UZS</p>
        </div>

        {/* Commission */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 border-l-4 border-l-[#CCFF00] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Commission (10%)</span>
            <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/20 text-black flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-3">{metrics.platformCommission.toLocaleString()} <span className="text-xs font-normal text-gray-500">UZS</span></p>
          <p className="text-xs text-gray-400 mt-1">Platform earned share</p>
        </div>

        {/* Active Stadiums */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Stadiums</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <LandPlot size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-3">{metrics.activeStadiums}</p>
          <Link href="/admin/stadiums" className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1 font-medium">
            Manage pitches <ArrowRight size={12} />
          </Link>
        </div>

        {/* Total Bookings & Owners */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Owners & Bookings</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarCheck size={20} />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-3">{metrics.totalBookings} <span className="text-sm font-semibold text-gray-400">bookings</span></p>
          <p className="text-xs text-gray-400 mt-1">{ownerUsers.length} stadium owners &bull; {playerUsers.length} players</p>
        </div>
      </div>

      {/* SECTION: Manage Users & Owners */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Section Header */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users size={20} className="text-slate-800" />
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Manage Users & Owners</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              View categorized platform accounts and create dedicated credentials for Stadium Managers.
            </p>
          </div>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setCreatedCredentials(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm self-start md:self-auto"
          >
            <Plus size={14} className="text-[#CCFF00]" /> Create New Stadium Owner
          </button>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>All Users</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">{users.length}</span>
            </button>

            <button
              onClick={() => setRoleFilter('OWNERS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === 'OWNERS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <Building2 size={13} />
              <span>Stadium Owners</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${roleFilter === 'OWNERS' ? 'bg-white/20' : 'bg-blue-100 text-blue-800'}`}>
                {ownerUsers.length}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('PLAYERS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === 'PLAYERS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <User size={13} />
              <span>Players</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${roleFilter === 'PLAYERS' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-800'}`}>
                {playerUsers.length}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('ADMINS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === 'ADMINS'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              <ShieldCheck size={13} />
              <span>Admins</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${roleFilter === 'ADMINS' ? 'bg-white/20' : 'bg-purple-100 text-purple-800'}`}>
                {adminUsers.length}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users or @username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-xs"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">User Profile</th>
                <th className="px-6 py-3.5">Username</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Activity</th>
                <th className="px-6 py-3.5">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const displayName = user.name || (user.username ? `@${user.username}` : user.email) || 'User';
                const initial = displayName.charAt(0).toUpperCase() || 'U';

                return (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-900 text-[#CCFF00] font-black flex items-center justify-center shrink-0 overflow-hidden border border-slate-700 text-xs">
                          {user.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{user.name || 'Anonymous User'}</div>
                          <div className="text-[10px] text-gray-400 font-mono">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5">
                      {user.username ? (
                        <span className="font-mono font-semibold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          @{user.username}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">No username</span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-xs text-gray-600">
                      {user.email || <span className="text-gray-400 italic">None (Credentials)</span>}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold 
                        ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 
                          user.role === 'OWNER' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                        {user.role === 'ADMIN' && <ShieldCheck size={11} />}
                        {user.role === 'OWNER' && <Building2 size={11} />}
                        {user.role === 'PLAYER' && <User size={11} />}
                        {user.role || 'PLAYER'}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-xs text-gray-500">
                      {user.role === 'OWNER' ? (
                        <span className="font-semibold text-blue-700">{user._count?.stadiums || 0} Stadiums owned</span>
                      ) : (
                        <span>{user._count?.bookings || 0} Bookings</span>
                      )}
                    </td>

                    <td className="px-6 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                    No users found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recent Transactions & Bookings</h3>
            <p className="text-xs text-gray-400">Latest reservation payments in Navoiy</p>
          </div>
          <Link 
            href="/admin/payments" 
            className="text-xs text-slate-700 hover:text-black font-semibold inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
          >
            View all logs <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Stadium</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Method</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTransactions.map((tx) => {
                const customerName = tx.booking?.user?.name || (tx.booking?.user?.username ? `@${tx.booking?.user?.username}` : tx.booking?.user?.email) || 'Player';
                const customerEmail = tx.booking?.user?.email || (tx.booking?.user?.username ? `@${tx.booking?.user?.username}` : '');

                return (
                  <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {tx.booking?.stadium?.name || 'Stadium deleted'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{customerName}</div>
                      {customerEmail && customerEmail !== customerName && (
                        <div className="text-xs text-gray-400">{customerEmail}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {tx.amount.toLocaleString()} UZS
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-md uppercase bg-gray-100 text-gray-700 border border-gray-200">
                        {tx.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold 
                        ${tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 
                          tx.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 
                          'bg-amber-100 text-amber-800'}`}>
                        {tx.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                        {tx.status === 'FAILED' && <XCircle size={12} />}
                        {tx.status === 'PENDING' && <Clock size={12} />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW STADIUM OWNER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                <Building2 size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Create Stadium Owner</h3>
                <p className="text-xs text-gray-500">Manual registration for stadium management</p>
              </div>
            </div>

            {/* Success Handover Card (if created) */}
            {createdCredentials ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-sm mb-2 text-emerald-800">
                    <CheckCircle2 size={18} /> Owner Account Created!
                  </div>
                  <p className="text-xs text-emerald-700 mb-3">
                    You can copy these credentials and send them to the stadium manager:
                  </p>
                  
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 space-y-1 font-mono text-xs">
                    <div><span className="text-gray-500">Name:</span> <strong>{createdCredentials.name}</strong></div>
                    <div><span className="text-gray-500">Username:</span> <strong>{createdCredentials.username}</strong></div>
                    <div><span className="text-gray-500">Password:</span> <strong>{createdCredentials.password}</strong></div>
                    <div><span className="text-gray-500">Role:</span> <strong>OWNER</strong></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyCredentials}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    {copied ? <Check size={14} className="text-[#CCFF00]" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Credentials'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedCredentials(null);
                      setIsModalOpen(false);
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Create Form */
              <form onSubmit={handleCreateOwner} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alisher Karimov"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Username *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">@</span>
                    <input
                      type="text"
                      required
                      placeholder="owner_yoshlik"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-sm font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Unique login username for the owner.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Temporary / Initial Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Provide this to the stadium owner to sign in.</p>
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#CCFF00] hover:bg-[#b5e600] text-black font-bold text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating Owner...' : 'Create Owner Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
