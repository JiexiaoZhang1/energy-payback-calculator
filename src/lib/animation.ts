export const spring = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.9,
} as const;

export const softSpring = {
  type: "spring",
  stiffness: 260,
  damping: 28,
  mass: 0.9,
} as const;

export const quick = {
  duration: 0.18,
  ease: "easeOut",
} as const;

export const drawerTransition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
} as const;

export const pageMotion = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -14, scale: 0.985 },
} as const;

export const listMotion = {
  animate: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
} as const;

export const itemMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
} as const;
