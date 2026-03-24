import { useEffect, useRef, useState, useCallback } from 'react';

const THRESHOLD = 70;

export default function usePullToRefresh(onRefresh) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pullProgress, setPullProgress] = useState(0); // 0–1
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullProgress(0);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        const progress = Math.min(1, dy / THRESHOLD);
        setPullProgress(progress);
      }
    };

    const onTouchEnd = (e) => {
      if (!pulling.current) return;
      pulling.current = false;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (dy >= THRESHOLD) {
        triggerRefresh();
      } else {
        setPullProgress(0);
      }
    };

    const onTouchCancel = () => {
      pulling.current = false;
      setPullProgress(0);
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [triggerRefresh]);

  return { pullProgress, isRefreshing };
}