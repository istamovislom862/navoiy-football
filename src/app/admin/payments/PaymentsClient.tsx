"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  LandPlot,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentItem {
  id: string;
  amount: number;
  provider: string;
  status: string;
  transactionId: string | null;
  createdAt: Date | string;
  booking?: {
    stadium?: {
      name: string;
    } | null;
    user?: {
      name: string | null;
      username: string | null;
      email: string | null;
    } | null;
  } | null;
}

interface PaymentsClientProps {
  payments: PaymentItem[];
  updatePaymentStatusAction: (paymentId: string, newStatus: string) => Promise<{ success?: boolean; error?: string }>;
}

export default function PaymentsClient({ payments, updatePaymentStatusAction }: PaymentsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredPayments = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    const customer = (p.booking?.user?.name || p.booking?.user?.username || p.booking?.user?.email || '').toLowerCase();
    const stadium = (p.booking?.stadium?.name || '').toLowerCase();
    const provider = p.provider.toLowerCase();
    const matchesSearch = customer.includes(q) || stadium.includes(q) || provider.includes(q);

    if (statusFilter !== 'ALL' && p.status !== statusFilter) {
      return false;
    }

    return matchesSearch;
  });

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    setUpdatingId(paymentId);
    try {
      const res = await updatePaymentStatusAction(paymentId, newStatus);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Payment status marked as ${newStatus}`);
        router.refresh();
      }
    } catch {
      toast.error('Failed to update payment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalCompleted = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Payments & Transaction Log</h1>
          <p className="text-gray-500 mt-1">Audit transactions, reconcile cash collections, and update payment statuses.</p>
        </div>

        <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase">Completed Volume</p>
            <p className="text-lg font-black text-gray-900">{totalCompleted.toLocaleString()} <span className="text-xs font-normal text-gray-500">UZS</span></p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, pitch, or method (cash, click, payme)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-sm"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'COMPLETED', 'PENDING', 'FAILED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Transaction / Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Stadium</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((p) => {
                const customer = p.booking?.user?.name || (p.booking?.user?.username ? `@${p.booking?.user?.username}` : p.booking?.user?.email) || 'Player';
                const email = p.booking?.user?.email;

                return (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-gray-900">{p.id.slice(0, 10)}...</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{customer}</div>
                      {email && email !== customer && (
                        <div className="text-xs text-gray-400">{email}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 flex items-center gap-1.5">
                        <LandPlot size={14} className="text-slate-400" />
                        <span>{p.booking?.stadium?.name || 'Deleted Stadium'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-black text-gray-900 text-base">
                        {p.amount.toLocaleString()} <span className="text-xs font-normal text-gray-500">UZS</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg uppercase bg-slate-100 text-slate-800 border border-slate-200">
                        {p.provider}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold 
                        ${p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 
                          p.status === 'FAILED' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 
                          'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                        {p.status === 'COMPLETED' && <CheckCircle2 size={13} />}
                        {p.status === 'FAILED' && <XCircle size={13} />}
                        {p.status === 'PENDING' && <Clock size={13} />}
                        {p.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <select
                        value={p.status}
                        disabled={updatingId === p.id}
                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                        className="bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] cursor-pointer disabled:opacity-50"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="FAILED">FAILED</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <CreditCard size={36} className="mx-auto mb-2 text-gray-300" />
                    No payments found matching the current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
