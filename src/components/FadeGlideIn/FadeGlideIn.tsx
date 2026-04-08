import React from "react";
import { motion } from "framer-motion";
import useScrollIntoView from "@/hooks/use-scroll-into-view.hook";

function FadeGlideIn({
  children,
  show = true,
  hidden,
  disableScroll,
}: {
  children: React.ReactNode;
  show?: boolean;
  hidden?: boolean;
  disableScroll?: boolean;
}) {
  const ref = useScrollIntoView(show && !hidden && !disableScroll);
  if (hidden || !show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        willChange: "opacity, transform",
      }}
      ref={ref}
    >
      {children}
    </motion.div>
  );
}

export default FadeGlideIn;
