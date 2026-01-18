'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, Edit2, Trash2, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { BoardComment } from '@/types';
import Image from 'next/image';

interface CommentsSectionProps {
    boardId: string;
}

export default function CommentsSection({ boardId }: CommentsSectionProps) {
    const [comments, setComments] = useState<BoardComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { isSignedIn, user } = useUser();

    // Fetch comments
    useEffect(() => {
        async function fetchComments() {
            try {
                const res = await fetch(`/api/boards/${boardId}/comments`);
                if (res.ok) {
                    const data = await res.json();
                    setComments(data);
                }
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        }
        fetchComments();
    }, [boardId]);

    const handleAddComment = async () => {
        if (!isSignedIn) {
            toast.error('Please sign in to comment');
            return;
        }

        if (!newComment.trim()) {
            toast.error('Please enter a comment');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/boards/${boardId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment })
            });

            if (res.ok) {
                const comment = await res.json();
                setComments([comment, ...comments]);
                setNewComment('');
                toast.success('Comment added!');
            } else {
                toast.error('Failed to add comment');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Failed to add comment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditComment = async (commentId: string) => {
        if (!editContent.trim()) {
            toast.error('Comment cannot be empty');
            return;
        }

        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent })
            });

            if (res.ok) {
                const updatedComment = await res.json();
                setComments(comments.map(c => c.id === commentId ? updatedComment : c));
                setEditingId(null);
                setEditContent('');
                toast.success('Comment updated!');
            } else {
                toast.error('Failed to update comment');
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error('Failed to update comment');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        try {
            const res = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setComments(comments.filter(c => c.id !== commentId));
                toast.success('Comment deleted');
            } else {
                toast.error('Failed to delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">
                    Comments {comments.length > 0 && `(${comments.length})`}
                </h2>
            </div>

            {/* Add Comment */}
            {isSignedIn ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        rows={3}
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={handleAddComment}
                            disabled={isLoading || !newComment.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            <Send className="w-4 h-4" />
                            Post Comment
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
                    <p className="text-blue-700 dark:text-blue-300">
                        Sign in to leave a comment
                    </p>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No comments yet. Be the first to comment!
                    </p>
                ) : (
                    comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
                        >
                            {/* Comment Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {comment.commenterImageUrl && (
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                            <Image
                                                src={comment.commenterImageUrl}
                                                alt={comment.commenterName}
                                                fill
                                                sizes="40px"
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {comment.commenterName}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(comment.createdAt)}
                                            {comment.isEdited && ' (edited)'}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions for comment owner */}
                                {user?.id === comment.userId && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingId(comment.id);
                                                setEditContent(comment.content);
                                            }}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Comment Content */}
                            {editingId === comment.id ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                        rows={3}
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditContent('');
                                            }}
                                            className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded-lg hover:opacity-90"
                                        >
                                            <X className="w-4 h-4 inline mr-1" />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleEditComment(comment.id)}
                                            className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:opacity-90"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {comment.content}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
