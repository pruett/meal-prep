import { useEffect } from "react";
import { motion } from "motion/react";
import { UtensilsCrossed } from "lucide-react";

const MESSAGES = [
  "Analyzing your preferences...",
  "Crafting your meal plan...",
  "Picking the best recipes...",
  "Almost there...",
];

export function GeneratingInterstitial({
  elapsed = 0,
  onClose,
}: {
  elapsed?: number;
  onClose?: () => void;
}) {
  // Allow Escape to dismiss (design system only — onClose is not passed in production)
  useEffect(() => {
    if (!onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  // Rotate message every 3s based on elapsed time
  const messageIndex = Math.min(
    Math.floor(elapsed / 3000),
    MESSAGES.length - 1,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
    >
      {/* Pulsing icon */}
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
      >
        <UtensilsCrossed className="h-10 w-10 text-primary" />
      </motion.div>

      {/* Status message */}
      <motion.p
        key={messageIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="text-lg font-medium tracking-tight"
      >
        {MESSAGES[messageIndex]}
      </motion.p>

      {/* Subtle progress dots */}
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/40"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
