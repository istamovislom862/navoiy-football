"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Building2, 
  User, 
  Calendar, 
  Plus, 
  X, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  CheckCircle2,
  KeyRound,
  Sparkles,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserItem {
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

interface UsersClientProps {
  users: UserItem[];
  updateRoleAction: (userId: string, newRole: string) => Promise<{ success?: boolean; error?: string }>;
}

export default function UsersClient({ users, updateRoleAction }: UsersClientProps) {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNERS' | 'PLAYERS' | 'ADMINS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // In-session tracking for plain passwords (newly set or created)
  const [sessionPasswords, setSessionPasswords] = useState<Record<string, string>>({});
  const [sessionRevealed, setSessionRevealed] = useState<Record<string, boolean>>({});

  // Reset Password Modal states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserItem | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetCompletedUser, setResetCompletedUser] = useState<{
    id: string;
    name: string;
    username: string;
    password: string;
  } | null>(null);
  const [resetCopied, setResetCopied] = useState(false);

  // Create Owner modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    username: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const ownerCount = users.filter((u) => u.role === 'OWNER').length;
  const playerCount = users.filter((u) => u.role === 'PLAYER' || !u.role).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'OWNERS' && u.role !== 'OWNER') return false;
    if (roleFilter === 'PLAYERS' && u.role !== 'PLAYER' && u.role !== '') return false;
    if (roleFilter === 'ADMINS' && u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN') return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);
    const usernameMatch = u.username?.toLowerCase().includes(q);
    return nameMatch || emailMatch || usernameMatch;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await updateRoleAction(userId, newRole);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Role updated to ${newRole}`);
        router.refresh();
      }
    } catch {
      toast.error('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

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
      const cleanUsername = username.toLowerCase().trim();
      setCreatedCredentials({
        name: fullName,
        username: cleanUsername,
        password,
      });

      // Save in session for immediate view in the table
      if (data.owner?.id) {
        setSessionPasswords((prev) => ({ ...prev, [data.owner.id]: password }));
        setSessionRevealed((prev) => ({ ...prev, [data.owner.id]: true }));
      }

      setFullName('');
      setUsername('');
      setPassword('');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast.error(message);
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

  // Open the Reset Password Modal for a specific user
  const openResetModal = (user: UserItem) => {
    setSelectedUserForReset(user);
    setResetCompletedUser(null);
    setNewPasswordInput('');
    setShowResetPassword(true);
    setResetModalOpen(true);
  };

  // Generate a friendly, secure default preset password (e.g., @kamolbek_2026)
  const generatePresetPassword = () => {
    if (!selectedUserForReset) return;
    const base = (selectedUserForReset.username || selectedUserForReset.name || 'owner')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 10);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const generated = `@${base}_${randomSuffix}`;
    setNewPasswordInput(generated);
    setShowResetPassword(true);
    toast.success('Preset password generated!');
  };

  // Submit Password Reset to /api/admin/reset-password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;

    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForReset.id,
          newPassword: newPasswordInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success(data.message || 'Password successfully reset!');

      // Track in-session for plain view
      const targetId = selectedUserForReset.id;
      const plainPassword = newPasswordInput.trim();
      setSessionPasswords((prev) => ({ ...prev, [targetId]: plainPassword }));
      setSessionRevealed((prev) => ({ ...prev, [targetId]: true }));

      setResetCompletedUser({
        id: targetId,
        name: selectedUserForReset.name || 'Owner',
        username: selectedUserForReset.username || selectedUserForReset.email || '',
        password: plainPassword,
      });

      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error resetting password';
      toast.error(message);
    } finally {
      setIsResetting(false);
    }
  };

  const copyResetCredentials = () => {
    if (!resetCompletedUser) return;
    const text = `Updated Credentials:\nName: ${resetCompletedUser.name}\nUsername: ${resetCompletedUser.username}\nNew Password: ${resetCompletedUser.password}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setResetCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setResetCopied(false), 2000);
  };

  const togglePasswordReveal = (userId: string) => {
    setSessionRevealed((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Users & Roles Management</h1>
          <p className="text-gray-500 mt-1">Manage user roles, create stadium owners, and inspect permissions.</p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setCreatedCredentials(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#CCFF00] hover:bg-[#b5e600] text-black rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Create New Stadium Owner
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'OWNERS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <Building2 size={13} />
              <span>Owners</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${roleFilter === 'OWNERS' ? 'bg-white/20' : 'bg-blue-100 text-blue-800'}`}>
                {ownerCount}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('PLAYERS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'PLAYERS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <User size={13} />
              <span>Players</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${roleFilter === 'PLAYERS' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-800'}`}>
                {playerCount}
              </span>
            </button>

            <button
              onClick={() => setRoleFilter('ADMINS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'ADMINS'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              <ShieldCheck size={13} />
              <span>Admins</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${roleFilter === 'ADMINS' ? 'bg-white/20' : 'bg-purple-100 text-purple-800'}`}>
                {adminCount}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, @username, email..."
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
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Username / Email</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4">Change Role</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4">Credentials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const displayName = user.name || (user.username ? `@${user.username}` : user.email) || 'User';
                const initial = displayName.charAt(0).toUpperCase() || 'U';
                const hasSessionPassword = Boolean(sessionPasswords[user.id]);
                const isRevealed = Boolean(sessionRevealed[user.id]);
                const isOwner = user.role === 'OWNER';

                return (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 text-[#CCFF00] font-black flex items-center justify-center shrink-0 overflow-hidden border border-slate-700">
                          {user.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{displayName}</div>
                          <div className="text-[11px] text-gray-400 font-mono">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {user.username && (
                        <div className="font-semibold text-slate-800 text-xs">@{user.username}</div>
                      )}
                      {user.email && (
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      )}
                      {!user.username && !user.email && (
                        <span className="text-gray-400 text-xs italic">No email/username</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold 
                        ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-300' : 
                          user.role === 'OWNER' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 
                          'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
                        {user.role === 'ADMIN' && <ShieldCheck size={12} />}
                        {user.role === 'OWNER' && <Building2 size={12} />}
                        {user.role === 'PLAYER' && <User size={12} />}
                        {user.role || 'PLAYER'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={user.role || 'PLAYER'}
                        disabled={updatingId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-white border border-gray-300 text-gray-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] cursor-pointer disabled:opacity-50"
                      >
                        <option value="PLAYER">PLAYER</option>
                        <option value="OWNER">OWNER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500">
                      <div>{user._count?.bookings || 0} bookings</div>
                      {user.role === 'OWNER' && (
                        <div className="text-blue-600 font-medium">{user._count?.stadiums || 0} stadiums</div>
                      )}
                      <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={11} /> {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* CREDENTIALS COLUMN */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Password bullets / text box */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 transition-colors shadow-2xs">
                          <span className="font-mono text-xs text-gray-700 tracking-wider font-medium select-all">
                            {hasSessionPassword
                              ? isRevealed
                                ? sessionPasswords[user.id]
                                : '••••••••'
                              : '••••••••'}
                          </span>

                          {hasSessionPassword ? (
                            <button
                              type="button"
                              onClick={() => togglePasswordReveal(user.id)}
                              title={isRevealed ? 'Hide Password' : 'Show Password'}
                              className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer p-0.5"
                            >
                              {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openResetModal(user)}
                              title="Inspect or reset password"
                              className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-0.5"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                        </div>

                        {/* Reset / View Button */}
                        <button
                          type="button"
                          onClick={() => openResetModal(user)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                            isOwner 
                              ? 'bg-slate-900 hover:bg-slate-800 text-white' 
                              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          <KeyRound size={13} className={isOwner ? 'text-[#CCFF00]' : 'text-gray-500'} />
                          <span>{hasSessionPassword ? 'Reset' : 'View / Reset'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Users size={36} className="mx-auto mb-2 text-gray-300" />
                    No users matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESET / SET PASSWORD MODAL */}
      {resetModalOpen && selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setResetModalOpen(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-[#CCFF00] flex items-center justify-center border border-slate-700 shrink-0">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Manage Password</h3>
                <p className="text-xs text-gray-500">View or set a new password for this account</p>
              </div>
            </div>

            {/* User Details Pill */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 mb-5 flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-sm">{selectedUserForReset.name || 'User'}</div>
                <div className="text-xs text-gray-500 font-mono">
                  {selectedUserForReset.username ? `@${selectedUserForReset.username}` : selectedUserForReset.email || selectedUserForReset.id}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                selectedUserForReset.role === 'OWNER' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : selectedUserForReset.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {selectedUserForReset.role}
              </span>
            </div>

            {/* If reset was just completed */}
            {resetCompletedUser ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-sm mb-2 text-emerald-800">
                    <CheckCircle2 size={18} /> Password Updated Successfully!
                  </div>
                  <p className="text-xs text-emerald-700 mb-3">
                    The new plain password is ready. You can copy these credentials and share them with the owner:
                  </p>
                  
                  <div className="bg-white/90 p-3 rounded-xl border border-emerald-200 space-y-1.5 font-mono text-xs">
                    <div>
                      <span className="text-gray-500">Name:</span> <strong>{resetCompletedUser.name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">Username:</span> <strong>@{resetCompletedUser.username}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-500">New Password:</span>{' '}
                        <strong className="text-slate-900 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {resetCompletedUser.password}
                        </strong>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Login URL:</span> <strong>{typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyResetCredentials}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {resetCopied ? <Check size={14} className="text-[#CCFF00]" /> : <Copy size={14} />}
                    {resetCopied ? 'Copied!' : 'Copy All Credentials'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalOpen(false);
                      setResetCompletedUser(null);
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                  <Lock size={15} className="text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    Passcodes are securely hashed in the database and cannot be decrypted. Type a new password or generate a preset below to view, copy, and set it.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      New Password *
                    </label>
                    <button
                      type="button"
                      onClick={generatePresetPassword}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles size={12} /> Generate Preset
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      placeholder="Min. 6 characters (e.g. @kamolbek_123)"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                      tabIndex={-1}
                      title={showResetPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Click the eye icon to view the exact string before saving.
                  </p>
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#CCFF00] hover:bg-[#b5e600] text-black font-bold text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isResetting ? 'Saving Password...' : 'Save & Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW STADIUM OWNER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
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
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
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
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
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
                      className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
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
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#CCFF00] hover:bg-[#b5e600] text-black font-bold text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
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
