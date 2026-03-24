import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefreshIndicator({ pullProgress, isRefreshing }) {
  const visible = pullProgress > 0 || isRefreshing;
  if (!visible) return null;

  const size = Math.min(32, 16 + pullProgress * 16);
  const opacity = Math.min(1, pullProgress * 1.5);
  const rotation = isRefreshing ? undefined : `rotate(${pullProgress * 360}deg)`;

  return (
    <div
      className="flex items-center justify-center w-full overflow-hidden transition-all duration-150"
      style={{ height: isRefreshing ? 48 : Math.max(0, pullProgress * 48) }}
    >
      <RefreshCw
        className={`text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`}
        style={{
          width: size,
          height: size,
          opacity,
          transform: rotation,
          transition: isRefreshing ? undefined : 'none',
        }}
      />
    </div>
  );
}