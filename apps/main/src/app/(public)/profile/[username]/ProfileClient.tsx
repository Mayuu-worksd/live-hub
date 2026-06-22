'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { UserPlus, UserMinus, Edit, PlayCircle, MessageCircle, Lock, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { StreamCard } from '@/components/stream/StreamCard';
import SubscribeButton from '@/components/profile/SubscribeButton';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';

interface ProfileClientProps {
  targetUser: any;
  recentStreams: any[];
}

export default function ProfileClient({ targetUser, recentStreams }: ProfileClientProps) {
  const { user } = useAuthStore();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(targetUser.profile?.followers_count || 0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'streams' | 'posts'>('streams');
  const [posts, setPosts] = useState<any[]>([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);

  const isOwnProfile = user?.id === targetUser.id;

  useEffect(() => {
    if (!user || isOwnProfile) {
      setLoading(false);
      return;
    }

    supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUser.id)
      .single()
      .then(({ data }) => {
        setFollowing(!!data);
        setLoading(false);
      });
  }, [user, targetUser.id, isOwnProfile]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [activeTab, targetUser.id]);

  const fetchPosts = () => {
    setFetchingPosts(true);
    supabase.from('posts').select('id, content, is_premium, created_at, photos(photo_url), videos(id, video_url, coin_price)')
      .eq('author_id', targetUser.id).order('created_at', { ascending: false })
      .then(({ data }) => { 
        if (!data) { setPosts([]); setFetchingPosts(false); return; }
        
        // Also check if user has purchased any of these videos
        if (user) {
          const videoIds = data.flatMap(p => p.videos).map(v => v.id).filter(Boolean);
          if (videoIds.length > 0) {
            supabase.from('video_purchases').select('video_id').eq('buyer_id', user.id).in('video_id', videoIds)
              .then(({ data: purchases }) => {
                const purchasedIds = new Set(purchases?.map(p => p.video_id) || []);
                const enriched = data.map(p => {
                  const post = p as any;
                  if (post.is_premium && post.videos && post.videos.length > 0) {
                    post.isPurchased = purchasedIds.has(post.videos[0].id);
                  }
                  return post;
                });
                setPosts(enriched);
                setFetchingPosts(false);
              });
            return;
          }
        }
        setPosts(data);
        setFetchingPosts(false);
      });
  };

  const handleUnlock = async (postId: string, videoId: string, price: number) => {
    if (!user) { toast.error('Sign in to unlock'); return; }
    
    // We would use useWalletStore to check balance, but omitting for brevity here.
    // Assuming backend will throw 402 if insufficient.
    try {
      const res = await fetch('/api/posts/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, viewerId: user.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Content unlocked!');
      fetchPosts(); // Refetch to show unblurred content
    } catch (err: any) {
      toast.error(err.message || 'Unlock failed');
    }
  };

  const toggleFollow = async () => {
    if (!user) { toast.error('Sign in to follow'); return; }
    
    const action = following ? 'unfollow' : 'follow';
    setFollowing(!following);
    setFollowerCount((prev: number) => following ? prev - 1 : prev + 1);

    try {
      const res = await fetch('/api/followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: user.id, followingId: targetUser.id, action })
      });
      if (!res.ok) throw new Error('Failed to update follow status');
      toast.success(following ? 'Unfollowed' : `Following ${targetUser.username}`);
    } catch (err: any) {
      toast.error('Something went wrong');
      setFollowing(following); // revert
      setFollowerCount((prev: number) => following ? prev + 1 : prev - 1);
    }
  };

  const coverUrl = targetUser.profile?.cover_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';
  
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Cover Image */}
      <div 
        className="h-64 w-full bg-cover bg-center relative"
        style={{ backgroundImage: `url(${coverUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />
      </div>

      <div className="max-w-[1000px] mx-auto px-6 relative -mt-24">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-12">
          <div className="h-32 w-32 rounded-full border-4 border-[#09090b] bg-gradient-to-br from-violet to-cyan flex items-center justify-center text-5xl font-bold text-white overflow-hidden shrink-0 shadow-2xl">
            {targetUser.profile?.avatar_url ? (
              <img src={targetUser.profile.avatar_url} alt={targetUser.username} className="h-full w-full object-cover" />
            ) : (
              targetUser.username[0].toUpperCase()
            )}
          </div>
          
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">
                {targetUser.profile?.display_name || targetUser.username}
              </h1>
              {targetUser.is_verified && (
                <div className="px-2 py-0.5 rounded-full bg-violet/20 text-violet text-xs font-semibold">
                  Verified
                </div>
              )}
            </div>
            <p className="text-zinc-400 font-medium">@{targetUser.username}</p>
          </div>

          <div className="flex flex-wrap gap-3 pb-2 shrink-0">
            {isOwnProfile ? (
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all">
                <Edit className="h-4 w-4" /> Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={toggleFollow}
                  disabled={loading}
                  className={cn(
                    "flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold transition-all shadow-lg",
                    following 
                      ? "bg-white/5 border border-white/10 text-white hover:bg-white/10 shadow-none" 
                      : "bg-violet text-white hover:bg-violet-light shadow-violet/20"
                  )}
                >
                  {following ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {following ? 'Following' : 'Follow'}
                </button>
                <Link 
                  href={`/messages/${targetUser.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                >
                  <MessageCircle className="h-4 w-4" /> Message
                </Link>
                <SubscribeButton creatorId={targetUser.id} creatorName={targetUser.username} />
              </>
            )}
          </div>
        </div>

        {/* Stats & Bio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-3">About</h2>
            <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {targetUser.profile?.bio || 'This creator hasn\'t added a bio yet.'}
            </p>
          </div>
          <div className="flex gap-8 md:justify-end border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
            <div>
              <p className="text-2xl font-bold text-white">{followerCount.toLocaleString()}</p>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{targetUser.profile?.following_count?.toLocaleString() || 0}</p>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Following</p>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex gap-4 border-b border-white/[0.08] mb-8">
          <button onClick={() => setActiveTab('streams')} className={cn("pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2", activeTab === 'streams' ? "border-violet text-violet" : "border-transparent text-zinc-500 hover:text-white")}>
            <PlayCircle className="h-4 w-4" /> Recent Streams
          </button>
          <button onClick={() => setActiveTab('posts')} className={cn("pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2", activeTab === 'posts' ? "border-violet text-violet" : "border-transparent text-zinc-500 hover:text-white")}>
            <LayoutGrid className="h-4 w-4" /> Exclusive Posts
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'streams' ? (
            recentStreams.length === 0 ? (
              <div className="text-center py-20 glass rounded-3xl">
                <p className="text-zinc-500 text-sm">No recent streams</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                {recentStreams.map((s, i) => (
                  <StreamCard key={s.id} streamId={s.id} title={s.title} thumbnail={s.thumbnail_url ?? ''} creatorName={targetUser.username} creatorAvatar={targetUser.profile?.avatar_url ?? ''} viewerCount={s.viewer_count} category={s.category} index={i} />
                ))}
              </div>
            )
          ) : (
            fetchingPosts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 glass rounded-3xl">
                <p className="text-zinc-500 text-sm">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((p) => (
                  <div key={p.id} className="glass rounded-2xl overflow-hidden flex flex-col relative group">
                    {p.is_premium && (
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 z-10">
                        <Lock className="h-3 w-3 text-gold" />
                        <span className="text-xs font-bold text-gold">{p.videos[0]?.coin_price || 0} 🪙</span>
                      </div>
                    )}
                    
                    {p.is_premium && !isOwnProfile && !p.isPurchased ? (
                      <div className="w-full aspect-[4/5] bg-zinc-900 flex flex-col items-center justify-center p-6 text-center">
                        <Lock className="h-10 w-10 text-zinc-700 mb-3" />
                        <p className="text-sm font-semibold text-white mb-1">Locked Content</p>
                        <p className="text-xs text-zinc-500 mb-4">Unlock this post to view</p>
                        <button 
                          onClick={() => handleUnlock(p.id, p.videos[0]?.id, p.videos[0]?.coin_price || 0)}
                          className="px-5 py-2 rounded-full bg-gold text-black font-semibold text-sm hover:bg-gold/90 transition-colors"
                        >
                          Unlock for {p.videos[0]?.coin_price || 0} 🪙
                        </button>
                      </div>
                    ) : (
                      <>
                        {p.photos?.length > 0 ? (
                          <img src={p.photos[0].photo_url} className="w-full aspect-[4/5] object-cover" alt="" />
                        ) : p.videos?.length > 0 ? (
                          <video src={p.videos[0].video_url} className="w-full aspect-[4/5] object-cover" controls />
                        ) : (
                          <div className="w-full aspect-[4/5] bg-zinc-900 flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-zinc-800" />
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="p-4 flex-1">
                      <p className={cn("text-sm", p.is_premium && !isOwnProfile && !p.isPurchased ? "text-zinc-500 blur-sm select-none" : "text-white")}>
                        {p.content || 'Exclusive content...'}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-3">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
