'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import { Video, ChevronRight, ChevronLeft, Verified, Star, Flame, Sparkles, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// Mock data for the landing page
const MOCK_STREAMS = [
  { id: '1', title: 'Grand Finals: Hyper-Racing Pro', viewerCount: 12400, category: 'Gaming', host: { username: 'NitroNova', profile: { avatar_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop' } }, thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=800&fit=crop' },
  { id: '2', title: 'Midnight Synth Sessions Vol. 12', viewerCount: 8900, category: 'Music', host: { username: 'AetherBeats', profile: { avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop' } }, thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=800&fit=crop' },
  { id: '3', title: 'Cyberpunk Fan Art Illustration', viewerCount: 5200, category: 'Creative', host: { username: 'ArtWithAria', profile: { avatar_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=100&h=100&fit=crop' } }, thumbnail_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=800&fit=crop' },
  { id: '4', title: 'Late Night Just Chatting & Vibes', viewerCount: 4100, category: 'Talk Shows', host: { username: 'LunaLive', profile: { avatar_url: 'https://images.unsplash.com/photo-1588854337221-4cfb6d13ec8f?w=100&h=100&fit=crop' } }, thumbnail_url: 'https://images.unsplash.com/photo-1588854337221-4cfb6d13ec8f?w=600&h=800&fit=crop' },
  { id: '5', title: 'Speedrunning Classics PB Attempt', viewerCount: 3800, category: 'Esports', host: { username: 'RetroSpeed', profile: { avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' } }, thumbnail_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop' },
];

const CATEGORY_CARDS = [
  { label: 'Gaming', count: '2.4k', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80' },
  { label: 'Music', count: '1.8k', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80' },
  { label: 'Creative', count: '940', img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80' },
  { label: 'Talk Shows', count: '560', img: 'https://images.unsplash.com/photo-1588854337221-4cfb6d13ec8f?w=800&q=80' },
];

const TOP_CREATORS = [
  { username: 'Zane_Void', followers: '2.4M', isLive: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
  { username: 'Lina_Tech', followers: '1.8M', verified: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
  { username: 'Maya_Magic', followers: '950k', isLive: true, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
  { username: 'FragMaster_X', followers: '3.2M', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
  { username: 'River_Runs', followers: '1.1M', isLive: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop' },
];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Redirect if logged in and they somehow land here
  useEffect(() => {
    if (user) {
      router.push('/home');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-[#0A0204] text-white selection:bg-primary/30 relative overflow-hidden">
      {/* Dynamic Grid Background with Dark Red Vignette */}
      <div className="fixed inset-0 bg-grid-pattern opacity-40 pointer-events-none mix-blend-overlay z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0A0204_80%)] pointer-events-none z-0" />
      
      {/* Subtle Red/Primary Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

      {/* 1. Hero Section */}
      <section className="relative z-10 min-h-[600px] py-32 flex items-center justify-center text-center">

        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Live & Exclusive
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] mb-6 font-heading">
            The Pulse of <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-200 to-primary">Live Entertainment</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-zinc-400 text-base md:text-lg mb-8 max-w-xl mx-auto font-light leading-relaxed">
            Join the world's most vibrant community of creators and fans. Experience high-fidelity streaming, interactive events, and the future of digital social life.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-wrap justify-center gap-3">
            <Link href="/explore" className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 scale-100 hover:scale-105 active:scale-95 text-sm">
              Explore Now
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="bg-white/5 text-white border border-white/10 px-8 py-3.5 rounded-xl font-bold hover:bg-white/10 transition-colors text-sm">
              Sign In
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. Stats Section */}
      <section className="py-12 max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl group hover:bg-white/[0.05] transition-all">
            <h3 className="text-primary text-4xl md:text-5xl font-black tracking-tight mb-2">10k+</h3>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Creators Active</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl group hover:bg-white/[0.05] transition-all">
            <h3 className="text-cyan-400 text-4xl md:text-5xl font-black tracking-tight mb-2">50k+</h3>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Live Events Monthly</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl group hover:bg-white/[0.05] transition-all">
            <h3 className="text-primary text-4xl md:text-5xl font-black tracking-tight mb-2">98%</h3>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">User Satisfaction</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl group hover:bg-white/[0.05] transition-all">
            <h3 className="text-cyan-400 text-4xl md:text-5xl font-black tracking-tight mb-2">1050+</h3>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Verified Partners</p>
          </motion.div>
        </div>
      </section>

      {/* 3. Handpicked Categories */}
      <section className="py-16 max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-primary text-[10px] font-bold tracking-widest uppercase mb-2">Curated Collections</p>
            <h2 className="text-3xl font-bold text-white font-heading tracking-tight">Handpicked Categories</h2>
          </div>
          <Link href="/home" className="text-zinc-400 hover:text-primary text-sm font-semibold flex items-center gap-1 transition-colors">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORY_CARDS.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${cat.img}')` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6">
                <h4 className="text-3xl text-white font-bold mb-1 font-heading group-hover:text-primary transition-colors">{cat.label}</h4>
                <p className="text-zinc-300">{cat.count} Channels Live</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Trending Now */}
      <section className="py-16 bg-white/[0.01] border-y border-white/[0.04] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase mb-2">ON AIR</p>
              <h2 className="text-3xl font-bold text-white font-heading tracking-tight">Trending Now</h2>
            </div>
            <div className="hidden md:flex gap-2">
              <button className="w-12 h-12 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition-colors text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button className="w-12 h-12 flex items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition-colors text-white">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 hide-scrollbar">
            {MOCK_STREAMS.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="min-w-[320px] group cursor-pointer"
                onClick={() => router.push('/home')}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border-2 border-transparent group-hover:border-primary transition-all shadow-lg">
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={s.thumbnail_url} alt="Stream" />
                  <div className="absolute top-3 left-3 bg-rose text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter shadow-lg shadow-rose/20">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-live-pulse"></span>
                    Live
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 border border-white/10">
                    <Eye className="w-3 h-3" /> {(s.viewerCount / 1000).toFixed(1)}k
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex-shrink-0 border border-white/10 overflow-hidden">
                    <img className="w-full h-full rounded-full object-cover" src={s.host.profile.avatar_url} alt="Avatar" />
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-white font-bold text-sm truncate group-hover:text-primary transition-colors">{s.title}</h5>
                    <p className="text-zinc-400 text-xs mb-2">@{s.host.username}</p>
                    <div className="flex gap-2">
                      <span className="bg-[#1A1A1A] border border-white/5 text-zinc-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">{s.category}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Popular Creators */}
      <section className="py-16 max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-primary text-[10px] font-bold tracking-widest uppercase mb-2">Top Talent</p>
            <h2 className="text-3xl font-bold text-white font-heading tracking-tight">Our Most Popular Creators</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {TOP_CREATORS.map((creator, i) => (
            <motion.div
              key={creator.username}
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center group cursor-pointer text-center"
              onClick={() => router.push('/home')}
            >
              <div className={cn(
                "relative w-32 h-32 mb-4 p-1 rounded-full border-2 transition-transform group-hover:scale-105",
                creator.isLive ? "border-primary ring-4 ring-primary/20" : creator.verified ? "border-cyan-400" : "border-white/10"
              )}>
                <img className="w-full h-full rounded-full object-cover" src={creator.avatar} alt="Creator" />
                {creator.isLive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase shadow-lg shadow-primary/30">Live</span>
                )}
                {creator.verified && !creator.isLive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase shadow-lg shadow-cyan-500/30">
                    <Verified className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-white font-bold text-sm">@{creator.username}</p>
              <p className="text-zinc-500 text-xs">{creator.followers} Followers</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. CTA Section */}
      <section className="py-16 max-w-6xl mx-auto px-6 relative z-10">
        <div className="relative w-full h-[320px] rounded-3xl overflow-hidden flex flex-col items-center justify-center text-center p-8 border border-primary/20 bg-[#0A0A0A] shadow-[0_0_100px_rgba(255,45,85,0.1)]">
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none mix-blend-overlay" />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"
          ></motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black text-white leading-none font-heading tracking-tight drop-shadow-md">Start your journey today!</h2>
            <p className="text-white/90 text-base font-medium">Join 5 million+ fans and creators. Your stage is waiting.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link href="/register" className="bg-[#050505] text-primary px-8 py-3.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-xl active:scale-95 text-sm">
                Join for Free
              </Link>
              <Link href="/login" className="bg-white/10 text-white backdrop-blur-md border border-white/20 px-8 py-3.5 rounded-xl font-bold hover:bg-white/20 transition-colors text-sm">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <section className="bg-[#110408] border-t border-primary/20 py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-primary font-heading tracking-tight">LiveHub</h3>
              <p className="text-zinc-300 text-sm max-w-xs leading-relaxed font-medium">
                The world's leading live streaming and entertainment platform. Find and connect with amazing creators globally.
              </p>
            </div>
            <div>
              <h4 className="text-white text-lg font-bold mb-6">Quick Links</h4>
              <ul className="space-y-4 text-zinc-300 text-base font-medium">
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-lg font-bold mb-6">Categories</h4>
              <ul className="space-y-4 text-zinc-300 text-base font-medium">
                <li><Link href="#" className="hover:text-white transition-colors">Gaming</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Music</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Creative</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-lg font-bold mb-6">Contact</h4>
              <ul className="space-y-4 text-zinc-300 text-base font-medium">
                <li className="flex items-center gap-3">
                  <Flame className="text-primary w-5 h-5" /> support@livehub.live
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-400 text-xs font-semibold">© 2026 LiveHub. All rights reserved.</p>
            <div className="flex gap-6 text-xs font-semibold text-zinc-400">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
