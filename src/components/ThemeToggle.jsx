import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative inline-flex items-center cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        isDark ? 'bg-green-500' : 'bg-gray-200'
      }`}
      style={{ width: 51, height: 31, padding: 2 }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 35 }}
        animate={{ x: isDark ? 20 : 0 }}
        initial={false}
        className="block bg-white rounded-full shadow-sm"
        style={{ width: 27, height: 27 }}
      />
    </button>
  );
}
