'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Video, ShieldCheck, Edit3, X, Image as ImageIcon, Camera, Lock, MoreHorizontal, MessageSquare, Share2, Ban, Flag, Grid, PlaySquare, Star, Plus, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

const AVAILABLE_INTERESTS = ['Gaming', 'Music', 'Talk', 'Dance', 'Sports', 'Food', 'Travel', 'Education', 'Art', 'Fitness', 'ASMR'];
const TABS = ['Posts', 'Videos', 'Replays', 'Exclusive', 'About'] as const;
type TabType = typeof TABS[number];

export function ProfileView({
  initialUser,
  initialProfile,
  streams
}: {
  initialUser: any;
  initialProfile: any;
  streams: any[];
}) {
  const { user: currentUser } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('About');
  const [showOptions, setShowOptions] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [fetchingPosts, setFetchingPosts] = useState(false);

  // Social State
  const [followState, setFollowState] = useState<'none' | 'requested' | 'following'>('none');
  const [followersCount, setFollowersCount] = useState(initialProfile.followers_count || 0);

  const isOwner = currentUser?.id === initialUser.id;
  const isCreator = initialUser.role === 'creator' || initialUser.role === 'verified_creator';
  const isPrivate = profile.is_private;

  useEffect(() => {
    if (!currentUser || isOwner) return;

    // Check follow state
    const checkFollow = async () => {
      const { data: follow } = await supabase.from('followers')
        .select('id').match({ follower_id: currentUser.id, following_id: initialUser.id }).single();
      
      if (follow) {
        setFollowState('following');
        return;
      }

      const { data: req } = await supabase.from('follow_requests')
        .select('id').match({ follower_id: currentUser.id, following_id: initialUser.id }).single();
      
      if (req) {
        setFollowState('requested');
      }
    };
    checkFollow();
  }, [currentUser, isOwner, initialUser.id]);

  const handleFollowToggle = async () => {
    if (!currentUser) return openModal('follow creators');

    try {
      if (followState === 'following' || followState === 'requested') {
        const action = followState === 'following' ? 'unfollow' : 'cancel';
        const endpoint = action === 'unfollow' ? '/api/followers' : '/api/followers/requests';
        const method = action === 'unfollow' ? 'POST' : 'DELETE';
        const body = action === 'unfollow' ? { action: 'unfollow', followerId: currentUser.id, followingId: initialUser.id } : { followerId: currentUser.id, followingId: initialUser.id };

        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        if (res.ok) {
          setFollowState('none');
          if (action === 'unfollow' && followersCount > 0) setFollowersCount((prev: number) => prev - 1);
        }
      } else {
        const res = await fetch('/api/followers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'follow', followerId: currentUser.id, followingId: initialUser.id })
        });
        const data = await res.json();
        if (data.status === 'requested') {
          setFollowState('requested');
          toast.success('Follow request sent');
        } else if (data.status === 'following') {
          setFollowState('following');
          setFollowersCount((prev: number) => prev + 1);
        }
      }
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleCall = async () => {
    if (!currentUser) return openModal('join calls');
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          callerId: currentUser.id,
          calleeId: initialUser.id,
          callType: 'video'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      window.location.href = `/calls/${data.session.id}`;
    } catch (err: any) {
      toast.error(err.message || 'Failed to start call');
    }
  };

  const [editForm, setEditForm] = useState({
    display_name: initialProfile.display_name || '',
    bio: initialProfile.bio || '',
    avatar_url: initialProfile.avatar_url || '',
    cover_url: initialProfile.cover_url || '',
    interests: initialProfile.interests || [],
    is_private: initialProfile.is_private || false,
    message_privacy: initialProfile.message_privacy || 'everyone'
  });

  const toggleInterest = (interest: string) => {
    setEditForm(prev => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter((i: string) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: interests.slice(0, 5) };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update Profile privacy via API (since it handles everything properly)
      await fetch('/api/profile/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_private: editForm.is_private, message_privacy: editForm.message_privacy })
      });

      // 2. Update regular profile fields directly via Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name,
          bio: editForm.bio,
          avatar_url: editForm.avatar_url,
          cover_url: editForm.cover_url,
          interests: editForm.interests,
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Posts' || activeTab === 'Videos' || activeTab === 'Exclusive') {
      fetchPosts();
    }
  }, [activeTab, initialUser.id, currentUser]);

  const fetchPosts = () => {
    setFetchingPosts(true);
    supabase.from('posts').select('id, content, is_premium, created_at, photos(photo_url), videos(id, video_url, coin_price)')
      .eq('author_id', initialUser.id).order('created_at', { ascending: false })
      .then(({ data }) => { 
        if (!data) { setPosts([]); setFetchingPosts(false); return; }
        
        if (currentUser && !isOwner) {
          const videoIds = data.flatMap(p => p.videos).map(v => v.id).filter(Boolean);
          if (videoIds.length > 0) {
            supabase.from('video_purchases').select('video_id').eq('buyer_id', currentUser.id).in('video_id', videoIds)
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
    if (!currentUser) { openModal('purchase content'); return; }
    try {
      const res = await fetch('/api/posts/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, viewerId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Content unlocked!');
      fetchPosts(); 
    } catch (err: any) {
      toast.error(err.message || 'Unlock failed');
    }
  };

  const canViewContent = isOwner || !isPrivate || followState === 'following';

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Cover Image */}
      <div className="h-72 w-full relative overflow-hidden group">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-violet/20 via-primary/20 to-cyan/20 backdrop-blur-[2px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/50 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 -mt-24">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
          <div className="h-36 w-36 rounded-full border-4 border-[#09090b] bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center text-5xl font-bold text-white shadow-2xl relative group">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
            ) : (
              (profile.display_name || initialUser.username)[0].toUpperCase()
            )}
            {isOwner && (
              <button onClick={() => setIsEditing(true)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </button>
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-bold text-white tracking-tight">{profile.display_name || initialUser.username}</h1>
              {initialUser.is_verified && <ShieldCheck className="h-8 w-8 text-primary" />}
            </div>
            <p className="text-zinc-400 text-lg">
              @{initialUser.username} {isCreator && `• ${initialUser.role.replace('_', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
            </p>
          </div>

          <div className="flex gap-3 pb-2 w-full md:w-auto relative">
            {isOwner ? (
              <button onClick={() => setIsEditing(true)} className="px-6 h-11 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-semibold text-sm hover:bg-white/[0.1] transition-all flex items-center gap-2">
                <Edit3 className="h-4 w-4" /> Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={handleFollowToggle}
                  className={cn(
                    "px-8 h-11 rounded-xl font-semibold text-sm transition-all shadow-lg",
                    followState === 'following' 
                      ? "bg-white/[0.05] border border-white/[0.1] text-white hover:bg-rose/10 hover:text-rose hover:border-rose/20"
                      : followState === 'requested'
                      ? "bg-white/[0.05] border border-white/[0.1] text-zinc-400 hover:bg-white/[0.1]"
                      : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                  )}
                >
                  {followState === 'following' ? 'Following' : followState === 'requested' ? 'Requested' : 'Follow'}
                </button>
                
                {currentUser ? (
                  <Link href={`/messages/${initialUser.id}`} className="px-5 h-11 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-semibold text-sm hover:bg-white/[0.1] transition-all flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </Link>
                ) : (
                  <button onClick={() => openModal('message creators')} className="px-5 h-11 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-semibold text-sm hover:bg-white/[0.1] transition-all flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </button>
                )}

                <button onClick={handleCall} className="px-5 h-11 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-semibold text-sm hover:bg-white/[0.1] transition-all flex items-center justify-center">
                  <Phone className="h-5 w-5 text-emerald-400" />
                </button>

                <div className="relative">
                  <button onClick={() => setShowOptions(!showOptions)} className="px-3 h-11 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] transition-all flex items-center justify-center">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                  {showOptions && (
                    <div className="absolute right-0 top-14 w-48 bg-[#111113] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                      <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"><Share2 className="h-4 w-4" /> Share Profile</button>
                      <button className="w-full px-4 py-2 text-left text-sm text-rose hover:bg-white/5 flex items-center gap-2"><Ban className="h-4 w-4" /> Block User</button>
                      <button className="w-full px-4 py-2 text-left text-sm text-rose hover:bg-white/5 flex items-center gap-2"><Flag className="h-4 w-4" /> Report User</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-8 mb-8 border-y border-white/5 py-4">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{followersCount}</div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">{profile.following_count || 0}</div>
            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Following</div>
          </div>
          {isCreator && (
            <div className="text-center">
              <div className="text-xl font-bold text-white">{(profile.total_earned || 0).toLocaleString()}</div>
              <div className="text-xs text-gold font-medium uppercase tracking-wider flex items-center gap-1 justify-center"><Star className="h-3 w-3" /> Gifts</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-8 overflow-x-auto hide-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-4 text-sm font-semibold transition-all whitespace-nowrap border-b-2",
                activeTab === tab 
                  ? "border-primary text-white" 
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tab === 'Posts' && <Grid className="inline h-4 w-4 mr-2 -mt-0.5" />}
              {tab === 'Videos' && <PlaySquare className="inline h-4 w-4 mr-2 -mt-0.5" />}
              {tab === 'Replays' && <Video className="inline h-4 w-4 mr-2 -mt-0.5" />}
              {tab === 'Exclusive' && <Lock className="inline h-4 w-4 mr-2 -mt-0.5" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Privacy Wall or Content */}
        {!canViewContent && activeTab !== 'About' ? (
          <div className="py-24 flex flex-col items-center justify-center border border-white/5 rounded-3xl bg-[#111113]">
            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">This account is private</h3>
            <p className="text-zinc-400 text-sm">Follow this account to see their photos and videos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            {/* About Tab (Left Sidebar on Desktop, or Full width if active tab) */}
            {(activeTab === 'About' || window.innerWidth >= 1024) && (
              <div className="space-y-6">
                <div className="bg-[#111113] p-6 rounded-3xl border border-white/5">
                  <h2 className="text-lg font-semibold text-white mb-4">About</h2>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                    {profile.bio || "This user hasn't added a bio yet."}
                  </p>
                </div>

                {profile.interests && profile.interests.length > 0 && (
                  <div className="bg-[#111113] p-6 rounded-3xl border border-white/5">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-violet" />
                      Interests
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest: string) => (
                        <span key={interest} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 capitalize">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other Tabs Content */}
            {activeTab !== 'About' && (
              <div className="lg:col-span-2">
                {activeTab === 'Replays' ? (
                  <div className="bg-[#111113] p-8 rounded-3xl border border-white/5">
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <Video className="h-6 w-6 text-primary" />
                      Recent Streams
                    </h2>
                    
                    {streams && streams.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {streams.map((stream) => (
                          <div key={stream.id} className="group relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 cursor-pointer">
                            {stream.thumbnail_url ? (
                              <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-black group-hover:scale-105 transition-transform duration-500">
                                <Video className="h-10 w-10 text-zinc-800" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-5 w-full">
                              <h3 className="text-white font-medium text-base line-clamp-1 mb-1.5">{stream.title}</h3>
                              <div className="flex items-center justify-between text-sm text-zinc-400">
                                <span className="capitalize px-2 py-0.5 rounded bg-white/10">{stream.category}</span>
                                <span>{new Date(stream.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <Video className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-base font-medium text-white">No streams yet</h3>
                        <p className="text-sm text-zinc-500 mt-1">This creator hasn't gone live recently.</p>
                      </div>
                    )}
                  </div>
                ) : ['Posts', 'Videos', 'Exclusive'].includes(activeTab) ? (
                  <div className="space-y-6">
                    {isOwner && (
                      <div className="flex justify-end">
                        <Link href="/creator/content" className="flex items-center gap-2 px-5 py-2.5 bg-violet text-white rounded-full text-sm font-semibold hover:bg-violet-light transition-all shadow-lg shadow-violet/20">
                          <Plus className="h-4 w-4" /> Create New Post
                        </Link>
                      </div>
                    )}
                    {fetchingPosts ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
                      </div>
                    ) : posts.filter(p => {
                      if (activeTab === 'Videos') return p.videos && p.videos.length > 0;
                      if (activeTab === 'Exclusive') return p.is_premium;
                      return true;
                    }).length === 0 ? (
                      <div className="text-center py-20 glass rounded-3xl">
                        <p className="text-zinc-500 text-sm">No {activeTab.toLowerCase()} yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.filter(p => {
                          if (activeTab === 'Videos') return p.videos && p.videos.length > 0;
                          if (activeTab === 'Exclusive') return p.is_premium;
                          return true;
                        }).map((p) => (
                          <div key={p.id} className="glass rounded-2xl overflow-hidden flex flex-col relative group">
                            {p.is_premium && (
                              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 z-10">
                                <Lock className="h-3 w-3 text-gold" />
                                <span className="text-xs font-bold text-gold">{p.videos[0]?.coin_price || 0} 🪙</span>
                              </div>
                            )}
                            
                            {p.is_premium && !isOwner && !p.isPurchased ? (
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
                                  <video src={p.videos[0].video_url} className="w-full aspect-[4/5] object-cover" controls={!p.is_premium} />
                                ) : (
                                  <div className="w-full aspect-[4/5] bg-zinc-900 flex items-center justify-center">
                                    <ImageIcon className="h-10 w-10 text-zinc-800" />
                                  </div>
                                )}
                              </>
                            )}
                            
                            <div className="p-4 flex-1">
                              <p className={cn("text-sm", p.is_premium && !isOwner && !p.isPurchased ? "text-zinc-500 blur-sm select-none" : "text-white")}>
                                {p.content || 'Exclusive content...'}
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-3">{new Date(p.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-24 bg-[#111113] border border-white/5 rounded-3xl">
                    <h3 className="text-xl font-bold text-white mb-2">No {activeTab} yet</h3>
                    <p className="text-zinc-500 text-sm">When they post, it will show up here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={() => setIsEditing(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#111113] border border-white/10 rounded-3xl z-50 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Edit Profile & Settings</h2>
                <button onClick={() => setIsEditing(false)} className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-zinc-400 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Display Name</label>
                  <input
                    value={editForm.display_name}
                    onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    className="w-full p-4 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Avatar Image URL</label>
                  <input
                    value={editForm.avatar_url}
                    onChange={e => setEditForm({ ...editForm, avatar_url: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-black border border-white/10 text-zinc-400 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Cover Banner URL</label>
                  <input
                    value={editForm.cover_url}
                    onChange={e => setEditForm({ ...editForm, cover_url: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-black border border-white/10 text-zinc-400 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                {/* Privacy Settings */}
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-white font-semibold mb-4">Privacy Settings</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-white text-sm font-medium">Private Account</div>
                      <div className="text-zinc-500 text-xs">Only approved followers can see your content</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={editForm.is_private} onChange={e => setEditForm({ ...editForm, is_private: e.target.checked })} />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Message Privacy</label>
                    <select
                      value={editForm.message_privacy}
                      onChange={e => setEditForm({ ...editForm, message_privacy: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-black border border-white/10 text-white focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="followers">Followers Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3 border-t border-white/10">
                  <button onClick={() => setIsEditing(false)} className="flex-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 h-12 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
