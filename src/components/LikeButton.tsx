'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface LikeButtonProps {
    boardId: string;
    initialLiked?: boolean;
    initialLikeCount?: number;
    showCount?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function LikeButton({
    boardId,
    initialLiked = false,
    initialLikeCount = 0,
    showCount = true,
    size = 'md'
}: LikeButtonProps) {
    const [liked, setLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isLoading, setIsLoading] = useState(false);
    const { isSignedIn } = useUser();

    // Fetch initial like state
    useEffect(() => {
        async function fetchLikeState() {
            try {
                const res = await fetch(`/api/boards/${boardId}/like`);
                if (res.ok) {
                    const data = await res.json();
                    setLiked(data.liked);
                    setLikeCount(data.likeCount);
                }
            } catch (error) {
                console.error('Error fetching like state:', error);
            }
        }
        fetchLikeState();
    }, [boardId]);

    const handleLikeToggle = async () => {
        if (!isSignedIn) {
            toast.error('Please sign in to like boards');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/boards/${boardId}/like`, {
                method: liked ? 'DELETE' : 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                setLiked(data.liked);
                setLikeCount(data.likeCount);
            } else {
                toast.error('Failed to update like');
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            toast.error('Failed to update like');
        } finally {
            setIsLoading(false);
        }
    };

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    return (
        <button
            onClick={handleLikeToggle}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105 ${
                liked
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
        >
            <Heart
                className={`${sizeClasses[size]} ${liked ? 'fill-current' : ''}`}
            />
            {showCount && <span className="text-sm font-medium">{likeCount}</span>}
        </button>
    );
}
