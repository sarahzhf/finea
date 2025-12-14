"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";

export default function FineaMascotte({ onOpen, isNegative = false }: { onOpen: () => void; isNegative?: boolean }) {
  const controls = useAnimation();
  const [dragAmount, setDragAmount] = useState(0);
  const [mood, setMood] = useState("neutral");
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Eyeblink every 3–6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMood("blink");
      setTimeout(() => setMood("neutral"), 150);
    }, 3000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sleepCheck = setInterval(() => {
      if (mood !== "sleep" && mood !== "warning" && Date.now() - lastInteraction > 60000) {
        setMood("sleep");
      }
    }, 5000);

    return () => clearInterval(sleepCheck);
  }, [mood, lastInteraction]);

  useEffect(() => {
    if (isNegative) {
      setMood("warning");
    } else if (mood === "warning") {
      setMood("neutral");
    }
  }, [isNegative]);

  type Mood =
    | "neutral"
    | "happy"
    | "blink"
    | "hi"
    | "questioning"
    | "sad"
    | "talk"
    | "left"
    | "right"
    | "stretch"
    | "sleep"
    | "warning";

  // Expressions map
  const expression: Record<Mood, string> = {
    neutral: "/icons/fineamascotte.png",
    happy: "/icons/fineasmile.png",
    blink: "/icons/fineablinkone.png",
    hi: "/icons/fineahi.png",
    questioning: "/icons/fineaquestioning.png",
    sad: "/icons/fineasad.png",
    talk: "/icons/fineatalk.png",
    left: "/icons/finealeft.png",
    right: "/icons/finearight.png",
    stretch: "/icons/fineasmile.png",
    sleep: "/icons/fineasleepy.png",
    warning: "/icons/fineawarning.png"
  };

  return (
    <motion.div
      className="fixed top-12 right-4 z-[999] w-[60px] h-[60px] flex items-center justify-center"
    >
      <motion.img
        src={expression[mood as Mood]}
        className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
        drag
        dragConstraints={{ top: 0, right: 0, left: -80, bottom: 90 }}
        onDrag={(e, info) => {
          setLastInteraction(Date.now());
          if (mood === "sleep") setMood("neutral");

          const stretchY = Math.max(info.offset.y, 0);
          const stretchX = Math.min(info.offset.x, 0); // only left

          const maxY = Math.min(stretchY, 70);
          const maxX = Math.max(stretchX, -70);

          if (maxY > 10 || Math.abs(maxX) > 10) setMood("stretch");
          if (maxY > 25 || Math.abs(maxX) > 25) setMood("questioning");
          if (maxY > 45 || Math.abs(maxX) > 45) setMood("sad");

          controls.start({
            scaleY: 1 + maxY / 120,
            scaleX: 1 + Math.abs(maxX) / 250
          });

          if (maxY > 55 || Math.abs(maxX) > 55) {
            controls.start({
              x: [0, -3, 3, -3, 3, 0],
              transition: { duration: 0.25 }
            });
          }
        }}
        onTapStart={() => {
          setLastInteraction(Date.now());
          if (mood === "sleep") setMood("neutral");
          setMood("happy");
        }}
        onTap={() => setTimeout(() => setMood("neutral"), 300)}
        onDragEnd={(e, info) => {
          setLastInteraction(Date.now());
          if (mood === "sleep") setMood("neutral");

          controls.start({ x: 0, y: 0, transition: { duration: 0.25 } });

          controls.start({
            scaleX: [1, 1.15, 0.9, 1],
            scaleY: [1, 0.85, 1.1, 1],
            transition: { duration: 0.35, ease: "easeOut" }
          });

          if (info.offset.y > 40 || info.offset.x < -40) {
            setMood("talk");
            setTimeout(() => {
              onOpen();
              setMood("neutral");
            }, 150);
          } else {
            setMood("neutral");
          }
          setDragAmount(0);
        }}
        animate={controls}
      />
    </motion.div>
  );
}