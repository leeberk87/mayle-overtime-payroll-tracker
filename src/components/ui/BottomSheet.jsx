import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function BottomSheet({ open, onOpenChange, children, title }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl safe-bottom border-t border-border"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-secondary rounded-full" />
            </div>
            {title && (
              <div className="px-5 pb-3 pt-1">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              </div>
            )}
            <div className="px-5 pb-6 max-h-[80vh] overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function BottomSheetItem({ children, onClick, destructive }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 min-h-[48px] px-4 py-3 rounded-xl text-left hover:bg-accent transition-colors ${
        destructive ? 'text-red-600 dark:text-red-500' : 'text-foreground'
      }`}
    >
      {children}
    </button>
  );
}