import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCompareStore } from "@/lib/store/useCompareStore";
import { Button } from "@/components/ui/button";
import DefaultLayout from "@/lib/layouts/defaultLayout";
import { LuArrowLeft, LuGitCompare } from "react-icons/lu";

export const Route = createFileRoute("/version_tree/compare/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const compareList = useCompareStore((state) => state.compareList);
  const clearCompare = useCompareStore((state) => state.clearCompare);

  useEffect(() => {
    if (!compareList || compareList.length === 0) {
      navigate({ to: "/version_tree" });
    }
  }, [compareList, navigate]);

  if (!compareList || compareList.length < 2) {
    return null;
  }

  const handleBack = () => {
    clearCompare();
    navigate({ to: "/version_tree" });
  };

  return (
    <DefaultLayout>
      <section className="w-full h-full overflow-y-auto p-4 sm:p-8 bg-[#080b12] text-white">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <LuGitCompare size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Compare Versions</h1>
                <p className="text-xs text-gray-500">Side-by-side comparison of generated variations</p>
              </div>
            </div>

            <Button
              onClick={handleBack}
              className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-gray-300 text-xs px-4 py-2 rounded-xl transition-all w-fit"
            >
              <LuArrowLeft size={14} className="mr-1.5" />
              Back to Tree
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[compareList[0], compareList[1]].map((img, idx) => (
              <div
                key={img?.id || idx}
                className="bg-[#0f131d] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl"
              >
                <div className={`px-4 py-3 text-xs font-medium border-b border-white/[0.06] flex items-center justify-between ${idx === 0 ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>
                  <span>Variation {idx + 1}</span>
                  <span className="font-mono opacity-60 text-[11px]">{img?.id}</span>
                </div>
                <div className="p-4 bg-[#080b12] flex items-center justify-center min-h-[300px]">
                  <img
                    src={img?.src || ""}
                    alt="Comparison variation"
                    className="max-h-[360px] w-auto object-contain rounded-xl border border-white/[0.08]"
                  />
                </div>
                <div className="p-4 space-y-3 bg-[#0f131d]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Prompt</span>
                    <p className="text-xs text-gray-300 bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04] leading-relaxed">
                      {img?.prompt || "No prompt provided"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                      <span className="text-[10px] text-gray-500 block">Model</span>
                      <span className="text-gray-300 text-[11px]">{(img as any)?.modelName || "Gemini Flash"}</span>
                    </div>
                    <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                      <span className="text-[10px] text-gray-500 block">Aspect Ratio</span>
                      <span className="text-gray-300 text-[11px]">{(img as any)?.aspectRatio || "1:1"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
}
