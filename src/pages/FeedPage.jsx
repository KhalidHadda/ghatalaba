import { useState, useEffect } from 'react'
import {
  collection, addDoc, getDocs, query, orderBy,
  doc, updateDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove
} from 'firebase/firestore'
import { MessageSquare, Heart, Trash2 } from 'lucide-react'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import { colors, Avatar, Badge, Btn, Textarea } from '../components/UI'
import { FeedPostSkeleton } from '../components/Skeletons'
import { useLanguage } from '../context/LanguageContext'

function formatTimeAgo(timestamp, t) {
  if (!timestamp) return t ? t('justNow') : 'Just now'
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
  const seconds = Math.floor((new Date() - date) / 1000)

  if (seconds < 60) return t ? t('justNow') : 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}${t ? t('minAgo') : 'm ago'}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}${t ? t('hourAgo') : 'h ago'}`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}${t ? t('dayAgo') : 'd ago'}`
  return date.toLocaleDateString()
}

function PostCard({ post, currentUserId, onLike, onDelete, onAddComment }) {
  const { t } = useLanguage()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commenting, setCommenting] = useState(false)

  const isLiked = post.likes?.includes(currentUserId)
  const likesCount = post.likes?.length || 0
  const comments = post.comments || []
  const isOwner = post.authorUid === currentUserId

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommenting(true)
    try {
      await onAddComment(post.id, commentText.trim())
      setCommentText('')
    } finally {
      setCommenting(false)
    }
  }

  return (
    <div style={{
      background: colors.navyLight,
      border: '0.5px solid rgba(0,200,150,0.12)',
      borderRadius: 16,
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={post.authorName || 'Student'} size={40} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, color: colors.white, fontSize: 14 }}>
                {post.authorName || 'Anonymous Student'}
              </span>
              <Badge variant={post.authorRole === 'student' ? 'student' : 'other'}>
                {post.authorRole || 'Student'}
              </Badge>
            </div>
            <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
              {formatTimeAgo(post.createdAt, t)}
            </div>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => onDelete(post.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#FF6B6B',
              cursor: 'pointer',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Delete post"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Post Text */}
      <div style={{
        fontSize: 15,
        color: colors.white,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {post.content}
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        paddingTop: 8,
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}>
        <button
          onClick={() => onLike(post.id, isLiked)}
          disabled={!currentUserId}
          style={{
            background: isLiked ? 'rgba(0,200,150,0.15)' : 'transparent',
            border: `0.5px solid ${isLiked ? colors.mint : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8,
            padding: '5px 12px',
            color: isLiked ? colors.mint : colors.mutedLight,
            fontSize: 12,
            fontWeight: 600,
            cursor: currentUserId ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
        >
          <Heart size={14} fill={isLiked ? colors.mint : 'none'} color={isLiked ? colors.mint : colors.mutedLight} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '5px 12px',
            color: colors.mutedLight,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <MessageSquare size={14} />
          <span>{comments.length} {comments.length === 1 ? t('comment') : t('comments')}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{
          marginTop: 8,
          background: 'rgba(10, 22, 40, 0.4)',
          borderRadius: 12,
          padding: '12px',
          border: '0.5px solid rgba(0,200,150,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {comments.length === 0 ? (
            <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>{t('noCommentsYet')}</p>
          ) : (
            comments.map((c, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: 8,
                borderBottom: idx < comments.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
                paddingBottom: idx < comments.length - 1 ? 8 : 0,
              }}>
                <Avatar name={c.authorName} size={26} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.mint }}>{c.authorName}</span>
                    <span style={{ fontSize: 10, color: colors.muted }}>{formatTimeAgo(c.createdAt, t)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: colors.white, margin: '2px 0 0', lineHeight: 1.4 }}>{c.text}</p>
                </div>
              </div>
            ))
          )}

          {currentUserId && (
            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="text"
                placeholder={t('writeComment')}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(0,200,150,0.2)',
                  borderRadius: 8,
                  padding: '7px 12px',
                  color: colors.white,
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={commenting || !commentText.trim()}
                style={{
                  background: colors.mint,
                  color: colors.navy,
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 12px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: commentText.trim() ? 'pointer' : 'default',
                  opacity: commentText.trim() ? 1 : 0.5,
                }}
              >
                {t('send')}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default function FeedPage({ setPage }) {
  const { user, profile } = useAuth()
  const { t } = useLanguage()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')))
      .then(snap => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      })
      .catch(() => {
        setPosts([])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newContent.trim()) return
    if (!user) { setPage('login'); return }

    setSubmitting(true)
    setError('')
    try {
      const newPost = {
        content: newContent.trim(),
        authorUid: user.uid,
        authorName: profile?.displayName || user.email.split('@')[0],
        authorRole: profile?.role || 'student',
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      }

      try {
        const docRef = await addDoc(collection(db, 'posts'), {
          ...newPost,
          createdAt: serverTimestamp(),
        })
        newPost.id = docRef.id
      } catch {
        newPost.id = 'post_' + Date.now()
      }

      setPosts(prev => [newPost, ...prev])
      setNewContent('')
    } catch {
      setError('Failed to publish post.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (postId, isLiked) => {
    if (!user) return
    const postRef = doc(db, 'posts', postId)
    const updatePayload = isLiked
      ? { likes: arrayRemove(user.uid) }
      : { likes: arrayUnion(user.uid) }

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const currentLikes = p.likes || []
      const updatedLikes = isLiked
        ? currentLikes.filter(id => id !== user.uid)
        : [...currentLikes, user.uid]
      return { ...p, likes: updatedLikes }
    }))

    try {
      await updateDoc(postRef, updatePayload)
    } catch (err) {
      console.error('Failed to update likes:', err)
    }
  }

  const handleAddComment = async (postId, text) => {
    if (!user) return
    const commentObj = {
      authorUid: user.uid,
      authorName: profile?.displayName || user.email.split('@')[0],
      text,
      createdAt: new Date().toISOString(),
    }

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      return { ...p, comments: [...(p.comments || []), commentObj] }
    }))

    try {
      const postRef = doc(db, 'posts', postId)
      await updateDoc(postRef, {
        comments: arrayUnion(commentObj),
      })
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    setPosts(prev => prev.filter(p => p.id !== postId))
    try {
      await deleteDoc(doc(db, 'posts', postId))
    } catch (err) {
      console.error('Failed to delete post:', err)
    }
  }

  return (
    <div style={{ background: colors.navy, minHeight: '100vh', padding: '1.5rem', color: colors.white }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        
        {/* Title Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, margin: '0 0 4px', color: colors.white }}>
            {t('feedTitle')}
          </h1>
          <p style={{ color: colors.muted, fontSize: 13, margin: 0 }}>
            {t('feedSubtitle')}
          </p>
        </div>

        {/* Post Creation Card */}
        {user && (
          <div style={{
            background: colors.navyLight,
            border: '0.5px solid rgba(0,200,150,0.2)',
            borderRadius: 16,
            padding: '1.25rem',
            marginBottom: 20,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <form onSubmit={handleCreatePost}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <Avatar name={profile?.displayName || user.email} size={36} />
                <div style={{ flex: 1 }}>
                  <Textarea
                    placeholder={t('feedPlaceholder')}
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    style={{ minHeight: 80, border: '0.5px solid rgba(0,200,150,0.15)' }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 8,
                borderTop: '0.5px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: 11, color: colors.muted }}>
                  {280 - newContent.length} {t('charsRemaining')}
                </span>
                <Btn
                  type="submit"
                  disabled={submitting || !newContent.trim()}
                  style={{ padding: '8px 20px', fontSize: 13 }}
                >
                  {submitting ? t('publishing') : t('postBtn')}
                </Btn>
              </div>

              {error && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 8 }}>{error}</p>}
            </form>
          </div>
        )}

        {/* Posts Stream */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FeedPostSkeleton />
            <FeedPostSkeleton />
            <FeedPostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3.5rem 1rem',
            background: colors.navyLight,
            borderRadius: 16,
            border: '0.5px dashed rgba(0,200,150,0.15)',
            color: colors.muted,
          }}>
            <p style={{ margin: 0, fontSize: 14 }}>{t('noPostsTitle')}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.muted }}>{t('noPostsSub')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.uid}
                onLike={handleLike}
                onDelete={handleDeletePost}
                onAddComment={handleAddComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
