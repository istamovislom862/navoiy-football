"use client";

import { useState } from 'react';
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import BookingModal from '@/components/BookingModal';

export default function MapClient({ apiKey, stadiums }: { apiKey?: string, stadiums: any[] }) {
  const [selectedStadium, setSelectedStadium] = useState<any | null>(null);

  return (
    <>
      {/* Map Placeholder Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 pb-8 relative">
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative bg-gray-900">
          {apiKey ? (
            <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY, lang: 'ru_RU' }}>
              <Map 
                defaultState={{ center: [40.1031, 65.3792], zoom: 14 }}
                width="100%"
                height="100%"
              >
                {stadiums.map((stadium) => (
                  <Placemark 
                    key={stadium.id}
                    geometry={[stadium.lat, stadium.lng]}
                    properties={{ hintContent: stadium.name, balloonContent: stadium.name }}
                    onClick={() => setSelectedStadium(stadium)}
                    options={{
                      preset: 'islands#greenDotIcon'
                    }}
                  />
                ))}
              </Map>
            </YMaps>
          ) : (
            <div className="flex w-full h-full items-center justify-center bg-gray-900/80 backdrop-blur text-gray-300 flex-col space-y-4 border border-white/10 rounded-2xl">
              <p>Yandex Maps API Key not provided.</p>
              <p className="text-sm">Mocking Marker Click instead:</p>
              <button 
                onClick={() => setSelectedStadium(stadiums[0])}
                className="px-6 py-3 bg-[#CCFF00] text-black font-bold rounded-full shadow-lg hover:bg-[#b3e600] transition-colors"
              >
                Simulate Marker Click
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedStadium && (
        <BookingModal 
          stadium={selectedStadium} 
          onClose={() => setSelectedStadium(null)} 
        />
      )}
    </>
  );
}
