"use client";

import React, { useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

interface MagneticWrapperProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // pull strength multiplier, default 0.3
}

export const MagneticWrapper: React.FC<MagneticWrapperProps> = ({
  children,
  className = "",
  strength = 0.3,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 18, stiffness: 220, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    x.set(deltaX);
    y.set(deltaY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`inline-block ${className}`}
      data-cursor="magnetic"
    >
      {children}
    </motion.div>
  );
};

export default MagneticWrapper;
