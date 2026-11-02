import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="glass-panel p-6 rounded-2xl flex items-center gap-4"
  >
    <div className={`p-4 rounded-xl ${color} text-white`}>{icon}</div>
    <div>
      <h3 className="text-[var(--text-secondary)] text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  </motion.div>
);

export default StatCard;
