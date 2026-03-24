import { motion } from 'framer-motion';

const variants = {
  initial: { x: '25%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-15%', opacity: 0 },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }}
      style={{ position: 'relative', width: '100%', willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}