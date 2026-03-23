import { useEffect, useRef } from 'react';

export default function usePullToRefresh(onRefresh) {
  const startY = useRef(0);
  const pulling = useRef(false);

  useEffect(() => {
    const el = document.documentElement;

    const onTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchEnd = (e) => {
      if (!pulling.current) return;
      const dy = e.changedTouches[0].clientY - startY.current;
      if (dy > 70) {
        onRefresh();
      }
      pulling.current = false;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh]);
}