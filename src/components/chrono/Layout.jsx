import { motion, useReducedMotion } from 'framer-motion';
import { useOutlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex h-screen bg-chrono-bg text-chrono-text overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
          <motion.main
            className="flex-1 flex flex-col min-h-0"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.08 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {children ?? outlet}
          </motion.main>
      </div>
    </div>
  );
}
