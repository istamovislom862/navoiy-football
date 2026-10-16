import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  return (
    <main className="relative w-full h-screen bg-black">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 w-full p-4 md:px-8 md:py-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-white font-black text-2xl tracking-tighter">NAVOIY <span className="text-[#CCFF00]">FOOTBALL</span></h1>
        <div className="flex gap-3 items-center">
          {isAdmin && (
            <Link href="/admin" className="hidden md:inline-flex px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors">
              Admin Panel
            </Link>
          )}
          <Link href="/login" className="px-6 py-2.5 bg-white/10 text-white font-semibold rounded-full text-sm backdrop-blur-sm hover:bg-white/20 transition-all">
            Login
          </Link>
          <Link href="/register" className="px-6 py-2.5 bg-[#CCFF00] text-black font-bold rounded-full text-sm shadow-[0_0_15px_rgba(204,255,0,0.4)] hover:shadow-[0_0_25px_rgba(204,255,0,0.6)] hover:bg-[#b3e600] transition-all">
            Register
          </Link>
        </div>
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-20">
        <div className="text-center px-4 max-w-3xl mx-auto flex flex-col items-center">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.9]">
            Find Your Pitch. <br/> <span className="text-[#CCFF00]">Play Now.</span>
          </h2>
          <p className="text-gray-300 mt-6 text-lg md:text-xl max-w-xl mx-auto font-medium">
            Book the best football courts in Navoiy instantly. No calls, no waiting. Manage your bookings, earn Footcoins, and play.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/dashboard" className="inline-flex items-center justify-center px-10 py-5 bg-[#CCFF00] text-black font-black text-lg uppercase tracking-wider rounded-full hover:scale-105 transition-transform shadow-[0_10px_40px_rgba(204,255,0,0.3)]">
              Browse Fields
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center px-8 py-5 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-full transition-all backdrop-blur-md">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
