"use client";

import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { X, Check } from 'lucide-react';

interface BookingModalProps {
  stadium: any;
  onClose: () => void;
}

export default function BookingModal({ stadium, onClose }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<'PAYME' | 'CLICK'>('PAYME');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // Generate next 7 days
  const dates = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
  
  // Calculate slots dynamically based on stadium's open/close times
  // Assuming openingTime="08:00" and closingTime="23:00" format
  const generateSlots = () => {
    const startHour = parseInt(stadium.openingTime.split(':')[0]);
    const endHour = parseInt(stadium.closingTime.split(':')[0]);
    const slots = [];
    for (let i = startHour; i < endHour; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00 - ${(i + 1).toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateSlots();

  // Fetch booked slots for the selected date
  useEffect(() => {
    const fetchBookings = async () => {
      setIsFetchingSlots(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await fetch(`/api/stadiums/${stadium.id}/bookings?date=${dateStr}`);
        const data = await res.json();
        if (res.ok) {
          setBookedSlots(data.bookedSlots || []);
        } else {
          console.error("Failed to fetch slots", data.error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingSlots(false);
      }
    };
    fetchBookings();
    setSelectedSlot(null); // Reset selection
  }, [selectedDate, stadium.id]);

  const handleBooking = async () => {
    setIsLoading(true);
    try {
      const [startHr, endHr] = selectedSlot!.split(' - ').map(s => s.split(':')[0]);
      
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(startHr), 0, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(parseInt(endHr), 0, 0, 0);

      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stadiumId: stadium.id,
          userId: 'cmuxpgrm20002n9ixqt2rq2l8', // MVP Hardcoded user
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        })
      });

      const booking = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(booking.error || 'Failed to book slot');

      const checkoutRes = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: stadium.hourlyPrice,
          provider: paymentProvider
        })
      });

      const checkout = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkout.error || 'Failed to generate checkout URL');

      window.location.href = checkout.url;

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-[#0B1A24] sm:rounded-3xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Top Image Area */}
        <div className="relative h-40 shrink-0 w-full bg-green-800 flex flex-col items-center justify-center text-white" 
             style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518605368461-1e12a0874c7e?auto=format&fit=crop&q=80&w=1000")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-black/40"></div>
          <button onClick={onClose} className="absolute right-4 top-4 p-2 z-10 text-white rounded-full bg-black/20 hover:bg-black/40">
            <X size={20} />
          </button>
          
          <div className="relative z-10 text-center mt-6">
            <h2 className="text-xs font-semibold tracking-widest text-gray-200 uppercase">Football Court</h2>
            <h1 className="text-2xl font-bold tracking-tight">{stadium.name.toUpperCase()}</h1>
          </div>
        </div>

        {/* White Bottom Sheet Area (Scrollable) */}
        <div className="bg-white p-5 rounded-t-3xl -mt-6 relative z-20 flex-1 overflow-y-auto">
          {/* Dates */}
          <div className="mb-5">
            <p className="text-center text-xs font-medium text-gray-500 mb-2">Select a reservation date</p>
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {dates.map((date, idx) => {
                const isSelected = selectedDate.getDate() === date.getDate();
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`flex shrink-0 min-w-[60px] flex-col items-center justify-center rounded-xl p-2 transition-colors ${
                      isSelected ? 'bg-[#CCFF00] text-black shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-lg font-bold">{format(date, 'd')}</span>
                    <span className="text-[10px] uppercase font-bold">{format(date, 'EEE')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div className="mb-6">
            <p className="text-center text-xs font-medium text-gray-500 mb-2">
              Select time slot {isFetchingSlots && <span className="animate-pulse">...</span>}
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {timeSlots.map((slot, idx) => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={idx}
                    disabled={isBooked}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl py-2 px-3 text-sm font-semibold transition-colors border ${
                      isBooked 
                        ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                        : isSelected 
                          ? 'bg-[#CCFF00] border-[#CCFF00] text-black' 
                          : 'bg-white border-gray-200 text-gray-700 hover:border-[#CCFF00]'
                    }`}
                  >
                    {slot} {isBooked && "(Booked)"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-5">
            <p className="text-center text-xs font-medium text-gray-500 mb-2">Payment Method</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPaymentProvider('PAYME')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                  paymentProvider === 'PAYME' ? 'border-[#33cccc] bg-[#33cccc]/10 text-[#2db3b3]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {paymentProvider === 'PAYME' && <Check size={16} className="mr-1" />} PAYME
              </button>
              <button 
                onClick={() => setPaymentProvider('CLICK')}
                className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                  paymentProvider === 'CLICK' ? 'border-[#00a1f1] bg-[#00a1f1]/10 text-[#0089cc]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {paymentProvider === 'CLICK' && <Check size={16} className="mr-1" />} CLICK
              </button>
            </div>
          </div>

          {/* Price & Book Button */}
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-500 font-medium">Total Price</p>
            <p className="text-2xl font-black mb-3 text-gray-900">${stadium.hourlyPrice.toFixed(2)}</p>
            <button 
              onClick={handleBooking}
              disabled={!selectedSlot || isLoading}
              className="w-full flex items-center justify-center rounded-xl bg-gray-900 py-3.5 font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black"
            >
              {isLoading ? "PROCESSING..." : `BOOK & PAY VIA ${paymentProvider}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
