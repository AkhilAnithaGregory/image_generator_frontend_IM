import { useEffect, useState } from "react";
import { LuSparkles } from "react-icons/lu";
import { RiImageCircleAiFill } from "react-icons/ri";

const stages = [
  { title: "Dreaming up concepts", subtitle: "Parsing your creative prompt and style guidelines..." },
  { title: "Synthesizing composition", subtitle: "Composing perspective, layout, and visual flow..." },
  { title: "Refining details & textures", subtitle: "Sculpting surfaces, materials, and fine details..." },
  { title: "Balancing lighting & contrast", subtitle: "Simulating volumetric light and color grading..." },
  { title: "Finalizing high-res render", subtitle: "Polishing pixels for maximum fidelity..." },
];

export default function LoadingText({ isLoading }: { isLoading: boolean }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % stages.length);
    }, 3200);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  const currentStage = stages[stageIndex];

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center animate-fade-in select-none">
      {/* Radiant Glowing AI Orb */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Outer ambient glow */}
        <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600/40 via-purple-600/30 to-pink-500/30 blur-2xl animate-pulse" />

        {/* Orbit ring 1 */}
        <div className="w-20 h-20 rounded-full border border-blue-400/30 animate-[spin_6s_linear_infinite] flex items-center justify-center relative">
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
        </div>

        {/* Orbit ring 2 */}
        <div className="absolute w-14 h-14 rounded-full border border-purple-400/40 animate-[spin_4s_linear_infinite_reverse] flex items-center justify-center">
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
        </div>

        {/* Core Icon */}
        <div className="absolute w-11 h-11 rounded-2xl bg-[#0f131d]/90 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
          <RiImageCircleAiFill size={22} className="text-blue-400 animate-pulse" />
        </div>
      </div>

      {/* Stage Title */}
      <div className="space-y-1.5 mb-5 min-h-[56px] flex flex-col justify-center">
        <div className="flex items-center justify-center gap-2 text-white font-semibold text-lg tracking-tight">
          <LuSparkles size={16} className="text-amber-400 animate-bounce" />
          <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            {currentStage.title}
          </span>
        </div>
        <p className="text-xs text-gray-400 max-w-xs transition-opacity duration-300">
          {currentStage.subtitle}
        </p>
      </div>

      {/* Sleek indeterminate shimmer progress bar */}
      <div className="w-56 h-1.5 rounded-full bg-white/[0.08] overflow-hidden relative border border-white/[0.04]">
        <div className="absolute top-0 bottom-0 w-2/5 rounded-full bg-gradient-to-r from-transparent via-blue-500 to-purple-500 animate-[shimmer_1.8s_infinite]" />
      </div>

      <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase mt-3">
        AI Generating • Please Wait
      </span>
    </div>
  );
}
