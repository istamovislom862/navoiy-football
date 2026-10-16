"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  LandPlot, 
  Users, 
  CreditCard, 
  ArrowLeft, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck
} from 'lucide-react';

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/stadiums', label: 'Manage Stadiums', icon: LandPlot },
    { href: '/admin/users', label: 'Users & Owners', icon: Users },
    { href: '/admin/payments', label: 'Payments Log', icon: CreditCard },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00]">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-wide">NAVOIY <span className="text-[#CCFF00]">ADMIN</span></h1>
            <p className="text-xs text-gray-400">Super Admin Control</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden text-gray-400 hover:text-white p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                active 
                  ? 'bg-[#CCFF00] text-black font-bold shadow-lg shadow-[#CCFF00]/20' 
                  : 'text-gray-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon size={18} className={active ? 'text-black' : 'text-gray-400'} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin User Info & Quick Links */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
        <div className="px-3 py-2 bg-slate-800/60 rounded-xl border border-white/5">
          <p className="text-xs text-gray-400">Signed in as:</p>
          <p className="text-sm font-semibold text-white truncate">{user.name || user.email || 'Admin'}</p>
          <span className="inline-block mt-1 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {user.role || 'ADMIN'}
          </span>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center justify-center space-x-2 text-sm text-gray-300 hover:text-white hover:bg-slate-800/80 py-2.5 rounded-xl transition-colors border border-slate-800"
        >
          <ArrowLeft size={16} />
          <span>Exit to Dashboard</span>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center space-x-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 py-2.5 rounded-xl transition-colors font-medium border border-red-500/20"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-30">
        <div className="flex items-center space-x-2">
          <ShieldCheck size={20} className="text-[#CCFF00]" />
          <span className="font-bold text-white text-sm">Super Admin</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-gray-300 hover:text-white bg-slate-800 rounded-lg"
          aria-label="Open Navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col border-r border-slate-800 shrink-0">
        {navContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-72 bg-slate-900 text-white h-full z-10 flex flex-col shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
