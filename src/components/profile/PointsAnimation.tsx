import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PointsAnimationProps {
  points: number;
  trigger: number;
}

export const PointsAnimation = ({ points, trigger }: PointsAnimationProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -50, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.5 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-2xl px-6 py-3 rounded-full shadow-lg">
            +{points} Points! 🎉
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};