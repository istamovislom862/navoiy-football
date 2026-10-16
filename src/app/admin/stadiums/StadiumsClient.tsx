"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LandPlot, 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  DollarSign, 
  X,
  CalendarCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StadiumItem {
  id: string;
  name: string;
  description: string | null;
  address: string;
  lat: number;
  lng: number;
  hourlyPrice: number;
  openingTime: string;
  closingTime: string;
  owner?: {
    email: string | null;
    name: string | null;
    username: string | null;
  } | null;
  _count?: {
    bookings: number;
  };
}

interface StadiumsClientProps {
  stadiums: StadiumItem[];
  createStadiumAction: (formData: FormData) => Promise<{ success?: boolean; error?: string }>;
  deleteStadiumAction: (id: string) => Promise<{ success?: boolean; error?: string }>;
}

export default function StadiumsClient({ 
  stadiums, 
  createStadiumAction, 
  deleteStadiumAction 
}: StadiumsClientProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    hourlyPrice: '150000',
    openingTime: '08:00',
    closingTime: '23:00',
    lat: '40.0844',
    lng: '65.3792',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('address', formData.address);
    data.append('hourlyPrice', formData.hourlyPrice);
    data.append('openingTime', formData.openingTime);
    data.append('closingTime', formData.closingTime);
    data.append('lat', formData.lat);
    data.append('lng', formData.lng);

    try {
      const res = await createStadiumAction(data);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Stadium successfully added!');
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          description: '',
          address: '',
          hourlyPrice: '150000',
          openingTime: '08:00',
          closingTime: '23:00',
          lat: '40.0844',
          lng: '65.3792',
        });
        router.refresh();
      }
    } catch {
      toast.error('Failed to create stadium');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also remove any associated bookings.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteStadiumAction(id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Stadium "${name}" deleted`);
        router.refresh();
      }
    } catch {
      toast.error('Failed to delete stadium');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Stadiums</h1>
          <p className="text-gray-500 mt-1">View, register, or remove football stadiums across Navoiy region.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#CCFF00] hover:bg-[#b5e600] text-black font-bold rounded-xl transition-all shadow-sm active:scale-95 text-sm"
        >
          <Plus size={18} /> Add New Stadium
        </button>
      </div>

      {/* Stadiums Grid / Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Stadium</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Operating Hours</th>
                <th className="px-6 py-4">Hourly Rate</th>
                <th className="px-6 py-4">Bookings</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stadiums.map((stadium) => (
                <tr key={stadium.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 text-base">{stadium.name}</div>
                    {stadium.description && (
                      <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{stadium.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <MapPin size={15} className="text-red-500 shrink-0" />
                      <span className="truncate max-w-xs">{stadium.address}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {stadium.lat.toFixed(4)}, {stadium.lng.toFixed(4)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <Clock size={15} className="text-slate-400 shrink-0" />
                      <span>{stadium.openingTime} - {stadium.closingTime}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-gray-900">
                      {stadium.hourlyPrice.toLocaleString()} <span className="text-xs font-normal text-gray-500">UZS/hr</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      <CalendarCheck size={12} />
                      {stadium._count?.bookings || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(stadium.id, stadium.name)}
                      disabled={deletingId === stadium.id}
                      className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 bg-red-50 hover:bg-red-100/80 rounded-xl transition-colors text-xs disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {deletingId === stadium.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
              {stadiums.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <LandPlot size={36} className="mx-auto mb-2 text-gray-300" />
                    No stadiums found. Click &quot;Add New Stadium&quot; to register one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stadium Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-5 top-5 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/30 flex items-center justify-center text-black">
                <LandPlot size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">Add New Stadium</h2>
                <p className="text-xs text-gray-500">Register a pitch in the Navoiy region</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Stadium Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navoiy Central Arena"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Artificial grass pitch, floodlights, showers available."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Full Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navoiy sh., G'alaba shoh ko'chasi 45"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Hourly Rate (UZS) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    placeholder="150000"
                    value={formData.hourlyPrice}
                    onChange={(e) => setFormData({ ...formData, hourlyPrice: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Opening / Closing *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="08:00"
                      value={formData.openingTime}
                      onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                      className="w-1/2 px-2.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-sm text-center"
                    />
                    <input
                      type="text"
                      required
                      placeholder="23:00"
                      value={formData.closingTime}
                      onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                      className="w-1/2 px-2.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-sm text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Latitude (Lat) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Longitude (Lng) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#CCFF00] hover:bg-[#b5e600] font-bold text-black transition-colors disabled:opacity-50 text-sm shadow-md"
                >
                  {isSubmitting ? 'Saving...' : 'Create Stadium'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
