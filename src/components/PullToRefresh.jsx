import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 72;

// Renders a pull-down-to-refresh indicator for mobile/iOS.
// Attaches touch listeners to the document — no wrapping div needed.
// Pass onRefresh: an async function that re-fetches data.
export default function PullToRefresh({ onRefresh }) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const s = useRef({ startY: 0, pulling: false, isRefreshing: false, pullY: 0 });

  useEffect(() => {
    const state = s.current;

    const onStart = (e) => {
      if (window.scrollY === 0 && !state.isRefreshing) {
        state.startY = e.touches[0].clientY;
        state.pulling = true;
      }
    };

    const onMove = (e) => {
      if (!state.pulling || state.isRefreshing) return;
      const delta = e.touches[0].clientY - state.startY;
      if (delta > 0) {
        e.preventDefault();
        const y = Math.min(delta * 0.45, THRESHOLD + 20);
        state.pullY = y;
        setPullY(y);
      } else {
        state.pulling = false;
        state.pullY = 0;
        setPullY(0);
      }
    };

    const onEnd = async () => {
      if (!state.pulling) return;
      state.pulling = false;
      if (state.pullY >= THRESHOLD && !state.isRefreshing) {
        state.isRefreshing = true;
        state.pullY = THRESHOLD;
        setIsRefreshing(true);
        setPullY(THRESHOLD);
        try {
          await onRefresh();
        } finally {
          state.isRefreshing = false;
          state.pullY = 0;
          setIsRefreshing(false);
          setPullY(0);
        }
      } else {
        state.pullY = 0;
        setPullY(0);
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [onRefresh]);

  if (pullY === 0 && !isRefreshing) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none"
      style={{ height: pullY || THRESHOLD }}
    >
      <div className="mb-2">
        <RefreshCw
          className={`w-5 h-5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}
          style={!isRefreshing ? { transform: `rotate(${(pullY / THRESHOLD) * 180}deg)` } : undefined}
        />
      </div>
    </div>
  );
}
