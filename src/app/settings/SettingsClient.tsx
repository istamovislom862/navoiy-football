"use client";

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User as UserIcon, Camera, Activity, Send, Coins, LogOut, CheckCircle, AlertCircle, Mail } from 'lucide-react';

type UserProps = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  avatar: string | null;
  telegram: string | null;
  instagram: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  footcoins: number;
  emailVerified: Date | null;
};

export default function SettingsClient({ user }: { user: UserProps }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    avatar: user.avatar || '',
    telegram: user.telegram || '',
    instagram: user.instagram || '',
    age: user.age || '',
    height: user.height || '',
    weight: user.weight || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [isVerified, setIsVerified] = useState(!!user.emailVerified);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [email, setEmail] = useState(user.email || '');

  const handleSendCode = async () => {
    setIsSendingCode(true);
    setVerificationMessage('');
    try {
      const res = await fetch('/api/auth/send-verification', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setCodeSent(true);
        setVerificationMessage('Code sent successfully! Check your email.');
      } else {
        const data = await res.json();
        setVerificationMessage(data.error || 'Failed to send code.');
      }
    } catch (e) {
      setVerificationMessage('Error sending code.');
    }
    setIsSendingCode(false);
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    setVerificationMessage('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpCode })
      });
      if (res.ok) {
        setIsVerified(true);
        setCodeSent(false);
        setVerificationMessage('Email verified successfully!');
      } else {
        const data = await res.json();
        setVerificationMessage(data.error || 'Invalid code.');
      }
    } catch (e) {
      setVerificationMessage('Error verifying code.');
    }
    setIsVerifying(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage('Failed to update profile.');
      }
    } catch (err) {
      setMessage('An error occurred.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col relative overflow-hidden">
      {/* Background Blur */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#CCFF00] rounded-full mix-blend-multiply filter blur-[150px] opacity-10 pointer-events-none"></div>

      {/* Top Nav (simplified for settings) */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <button onClick={() => router.back()} className="flex items-center text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back
        </button>
        <button 
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center text-sm font-bold text-red-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} className="mr-2" /> Sign Out
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          
          <div className="flex flex-col items-center text-center mb-12 mt-4">
            <div className="relative group cursor-pointer mb-6">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#CCFF00] bg-gray-900 overflow-hidden shadow-[0_0_30px_rgba(204,255,0,0.2)]">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={64} className="text-gray-500 m-auto mt-12 md:mt-16" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={28} />
              </div>
            </div>

            <h1 className="text-3xl font-black tracking-tighter mb-4">Edit Profile</h1>

            <div className="inline-flex items-center bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(204,255,0,0.15)]">
              <Coins size={24} className="text-[#CCFF00] mr-3" />
              <div className="text-left">
                <p className="text-[10px] text-[#CCFF00] uppercase font-bold tracking-widest leading-none">Footcoins</p>
                <p className="text-2xl font-black text-white leading-none mt-1">{user.footcoins}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 mb-8">
            <h2 className="text-lg font-bold flex items-center mb-6"><Mail className="mr-3 text-gray-400" size={20} /> Email Verification Status</h2>
            
            {isVerified ? (
              <div className="flex items-center p-4 bg-[#CCFF00]/10 border border-[#CCFF00]/30 rounded-xl text-[#CCFF00]">
                <CheckCircle className="mr-3" size={24} />
                <span className="font-bold">✅ Email Verified</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-500">
                  <AlertCircle className="mr-3 shrink-0" size={24} />
                  <span className="font-medium text-sm">
                    {user.email ? 'Your email is not verified yet. Verification helps secure your account.' : 'Please add your email address to verify and secure your account.'}
                  </span>
                </div>
                
                {verificationMessage && (
                  <div className={`text-sm ${verificationMessage.includes('success') ? 'text-[#CCFF00]' : 'text-red-400'}`}>
                    {verificationMessage}
                  </div>
                )}

                {!codeSent ? (
                  <div className="flex space-x-3">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Add your email address"
                      className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#CCFF00]"
                    />
                    <button 
                      onClick={handleSendCode}
                      disabled={isSendingCode || !email}
                      className="bg-white text-black font-bold px-6 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {isSendingCode ? 'Sending Code...' : 'Send Verification Code'}
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <input 
                      type="text" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="bg-black border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#CCFF00]"
                      maxLength={6}
                    />
                    <button 
                      onClick={handleVerifyCode}
                      disabled={isVerifying || otpCode.length < 6}
                      className="bg-[#CCFF00] text-black font-bold px-6 py-2 rounded-xl text-sm hover:bg-[#b3e600] transition-colors disabled:opacity-50"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Email'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            {message && (
              <div className={`p-4 rounded-xl text-center font-bold border ${message.includes('success') ? 'bg-[#CCFF00]/10 border-[#CCFF00]/30 text-[#CCFF00]' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                {message}
              </div>
            )}

            <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
              <h2 className="text-lg font-bold flex items-center mb-6"><Camera className="mr-3 text-gray-400" size={20} /> Profile Picture</h2>
              <input 
                type="text" name="avatar" value={formData.avatar} onChange={handleChange}
                placeholder="Paste an image URL here..."
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] outline-none transition-all"
              />
            </div>

            <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
              <h2 className="text-lg font-bold flex items-center mb-6"><Activity className="mr-3 text-gray-400" size={20} /> Physical Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Age</label>
                  <input 
                    type="number" name="age" value={formData.age} onChange={handleChange} placeholder="22"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] outline-none transition-all text-center text-lg font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Height (cm)</label>
                  <input 
                    type="number" name="height" value={formData.height} onChange={handleChange} placeholder="180"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] outline-none transition-all text-center text-lg font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Weight (kg)</label>
                  <input 
                    type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="75"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] outline-none transition-all text-center text-lg font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
              <h2 className="text-lg font-bold flex items-center mb-6"><UserIcon className="mr-3 text-gray-400" size={20} /> Social Links</h2>
              <div className="space-y-5">
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-blue-400"><Send size={18} /></div>
                  <input 
                    type="text" name="telegram" value={formData.telegram} onChange={handleChange} placeholder="Telegram Username"
                    className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all font-medium"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-pink-500"><Camera size={18} /></div>
                  <input 
                    type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram Username"
                    className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-[#CCFF00] text-black font-black uppercase tracking-widest text-lg px-8 py-4 rounded-2xl hover:bg-[#b3e600] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
            >
              {isSaving ? 'Updating Profile...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
