import { useState, useEffect, useRef, RefObject } from 'react';

interface SwipeInput {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    minSwipeDistance?: number;
}

interface SwipeOutput {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
}

export default function useSwipe(input: SwipeInput): SwipeOutput {
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

    const minSwipeDistance = input.minSwipeDistance || 50;

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;
        const isLeftSwipe = distanceX > minSwipeDistance;
        const isRightSwipe = distanceX < -minSwipeDistance;
        const isUpSwipe = distanceY > minSwipeDistance;
        const isDownSwipe = distanceY < -minSwipeDistance;

        // Determine if horizontal or vertical swipe is dominant
        if (Math.abs(distanceX) > Math.abs(distanceY)) {
            // Horizontal swipe
            if (isLeftSwipe) {
                input.onSwipeLeft?.();
            } else if (isRightSwipe) {
                input.onSwipeRight?.();
            }
        } else {
            // Vertical swipe
            if (isUpSwipe) {
                input.onSwipeUp?.();
            } else if (isDownSwipe) {
                input.onSwipeDown?.();
            }
        }
    };

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
}

// Hook for attaching swipe to a ref element
export function useSwipeRef<T extends HTMLElement>(
    elementRef: RefObject<T | null>,
    input: SwipeInput
) {
    const swipeHandlers = useSwipe(input);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchstart', swipeHandlers.onTouchStart);
        element.addEventListener('touchmove', swipeHandlers.onTouchMove);
        element.addEventListener('touchend', swipeHandlers.onTouchEnd);

        return () => {
            element.removeEventListener('touchstart', swipeHandlers.onTouchStart);
            element.removeEventListener('touchmove', swipeHandlers.onTouchMove);
            element.removeEventListener('touchend', swipeHandlers.onTouchEnd);
        };
    }, [elementRef, swipeHandlers]);
}
