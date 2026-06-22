'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Radio, Trash2, Eye, Image as ImageIcon, Video, Plus, Lock, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface Stream { id: string; title: string; category: string; status: string; viewer_count: number; total_gifts_received: number; started_at: string; ended_at: string | null; }
interface Post { id: string; content: string; is_premium: boolean; created_at: string; photos: any[]; videos: any[]; }

export default function ContentPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'streams' | 'posts'>('streams');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // New post state
  const [showNewPost, setShowNewPost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [coinPrice, setCoinPrice] = useState(100);
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    if (activeTab === 'streams') {
      supabase.from('streams').select('id, title, category, status, viewer_count, total_gifts_received, started_at, ended_at')
        .eq('host_id', user.id).order('started_at', { ascending: false })
        .then(({ data }) => { setStreams((data ?? []) as Stream[]); setLoading(false); });
    } else {
      supabase.from('posts').select('id, content, is_premium, created_at, photos(photo_url), videos(video_url, coin_price)')
        .eq('author_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => { setPosts((data ?? []) as Post[]); setLoading(false); });
    }
  }, [user, activeTab]);

  const deleteStream = async (id: string) => {
    const { error } = await supabase.from('streams').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setStreams(prev => prev.filter(s => s.id !== id));
    toast.success('Stream deleted');
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success('Post deleted');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith('video') ? 'video' : 'photo');
  };

  const createPost = async () => {
    if (!user) return;
    if (!postContent && !mediaFile) return toast.error('Add content or media');
    setUploading(true);
    try {
      let mediaUrl = null;
      if (mediaFile) {
        // Upload to Vercel Blob via API
        const formData = new FormData();
        const res = await fetch(`/api/upload?filename=${encodeURIComponent(mediaFile.name)}`, { method: 'POST', body: mediaFile });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        mediaUrl = data.url;
      }

      const { data: post, error } = await supabase.from('posts').insert({
        author_id: user.id,
        content: postContent,
        is_premium: isPremium
      }).select().single();
      if (error) throw error;

      if (mediaUrl) {
        if (mediaType === 'photo') {
          await supabase.from('photos').insert({ post_id: post.id, photo_url: mediaUrl });
        } else {
          await supabase.from('videos').insert({ post_id: post.id, video_url: mediaUrl, coin_price: isPremium ? coinPrice : 0 });
        }
      }

      toast.success('Post created!');
      setShowNewPost(false);
      setPostContent(''); setMediaFile(null); setMediaType(null);
      // Reload posts
      const { data: newPosts } = await supabase.from('posts').select('id, content, is_premium, created_at, photos(photo_url), videos(video_url, coin_price)').eq('author_id', user.id).order('created_at', { ascending: false });
      setPosts(newPosts ?? []);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Content Hub</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your streams and exclusive posts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/creator/studio" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 transition-all">
            <Radio className="h-4 w-4" /> Go Live
          </Link>
          <button onClick={() => { setActiveTab('posts'); setShowNewPost(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet text-white text-sm font-semibold hover:bg-violet-light transition-all shadow-lg shadow-violet/20">
            <Plus className="h-4 w-4" /> New Post
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/[0.08] mb-8">
        <button onClick={() => setActiveTab('streams')} className={cn("pb-3 text-sm font-medium transition-colors border-b-2", activeTab === 'streams' ? "border-violet text-violet" : "border-transparent text-zinc-500 hover:text-white")}>
          Live Streams
        </button>
        <button onClick={() => setActiveTab('posts')} className={cn("pb-3 text-sm font-medium transition-colors border-b-2", activeTab === 'posts' ? "border-violet text-violet" : "border-transparent text-zinc-500 hover:text-white")}>
          Exclusive Posts
        </button>
      </div>

      {showNewPost && activeTab === 'posts' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Post</h2>
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="What's on your mind? Add exclusive content..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet/50 resize-none min-h-[100px] mb-4"
          />
          
          <div className="flex items-center gap-4 mb-6">
            <input type="file" ref={fileRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors">
              <Upload className="h-4 w-4" /> {mediaFile ? mediaFile.name : 'Upload Media (Photo/Video)'}
            </button>
          </div>

          <div className="flex items-center gap-6 mb-6 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} className="form-checkbox bg-transparent border-white/20 text-violet focus:ring-violet rounded" />
              <div className="flex items-center gap-2 text-white font-medium">
                <Lock className="h-4 w-4 text-gold" /> Make Premium (Locked)
              </div>
            </label>
            {isPremium && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">Unlock Price:</span>
                <input type="number" value={coinPrice} onChange={(e) => setCoinPrice(Number(e.target.value))} className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gold font-bold focus:outline-none focus:border-gold/50" />
                <span className="text-sm text-zinc-400">🪙</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowNewPost(false)} className="px-5 py-2.5 rounded-full text-zinc-400 font-medium hover:text-white transition-colors">Cancel</button>
            <button onClick={createPost} disabled={uploading} className="px-6 py-2.5 rounded-full bg-violet text-white font-semibold flex items-center gap-2 disabled:opacity-50">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Content'}
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton rounded-2xl h-24" />)}</div>
      ) : activeTab === 'streams' ? (
        <div className="space-y-2">
          {streams.length === 0 ? <div className="text-center py-12"><p className="text-zinc-500">No streams yet</p></div> : streams.map((s) => (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-white">{s.title}</p>
                <p className="text-xs text-zinc-500 mt-1">{new Date(s.started_at).toLocaleDateString()} • {s.viewer_count} viewers • {s.total_gifts_received} gifts</p>
              </div>
              <button onClick={() => deleteStream(s.id)} className="p-2 text-zinc-500 hover:text-rose"><Trash2 className="h-5 w-5" /></button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.length === 0 ? <div className="col-span-full text-center py-12"><p className="text-zinc-500">No posts yet</p></div> : posts.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden flex flex-col relative">
              {p.is_premium && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 z-10">
                  <Lock className="h-3 w-3 text-gold" />
                  <span className="text-xs font-bold text-gold">{p.videos[0]?.coin_price || 0} 🪙</span>
                </div>
              )}
              <button onClick={() => deletePost(p.id)} className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 text-zinc-400 hover:text-rose transition-colors z-10">
                <Trash2 className="h-4 w-4" />
              </button>
              
              {p.photos.length > 0 && <img src={p.photos[0].photo_url} className="w-full aspect-[4/5] object-cover" alt="" />}
              {p.videos.length > 0 && <video src={p.videos[0].video_url} className="w-full aspect-[4/5] object-cover" controls={!p.is_premium} />}
              
              <div className="p-4 flex-1">
                <p className="text-sm text-white line-clamp-3">{p.content}</p>
                <p className="text-[10px] text-zinc-500 mt-3">{new Date(p.created_at).toLocaleDateString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
