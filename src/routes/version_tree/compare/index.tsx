import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCompareStore } from "@/lib/store/useCompareStore";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/version_tree/compare/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const compareList = useCompareStore((state) => state.compareList);
  const clearCompare = useCompareStore((state) => state.clearCompare);

  useEffect(() => {
    if (!compareList || compareList.length === 0) {
      navigate({ to: "/" });
    }
  }, [compareList, navigate]);

  if (!compareList || compareList.length < 2) {
    return null;
  }

  const handleRemove = () => {
    clearCompare();
    navigate({ to: "/" });
  };

  return (
    <section className="w-full p-10">
      <div className="text-2xl font-bold mb-3">Compare Branch</div>
      <div className="grid grid-cols-2 items-center relative">
        <div>
          <h3 className="bg-[#2c4e73] rounded-tl-xl text-xl text-white py-2">
            V {compareList[0]?.id}
          </h3>
          <div className="border border-[#2c4e73] rounded-bl-xl p-10 w-full">
            <img
              className="w-3/4 flex justify-center mx-auto"
              src={compareList[0]?.src || ""}
              alt={compareList[0]?.id}
            />
          </div>
        </div>
        <div>
          <h3 className="bg-[#db7322] rounded-tr-xl text-xl text-white py-2">
            V {compareList[1]?.id}
          </h3>
          <div className="border border-[#db7322] rounded-br-xl p-10 w-full">
            <img
              className="w-3/4 flex justify-center mx-auto"
              src={compareList[1]?.src || ""}
              alt={compareList[1]?.id}
            />
          </div>
        </div>
      </div>
      <h3 className="text-start text-xl py-2">Prompt</h3>
      <div className="grid grid-cols-2 items-center border border-[#273041] rounded-md">
        <p className="text-start border-r p-3">{compareList[0]?.prompt}</p>
        <p className="text-start p-3">{compareList[1]?.prompt}</p>
      </div>
      <h3 className="text-start text-xl py-2">AI Model</h3>
      <div className="grid grid-cols-2 items-center border border-[#273041] rounded-md">
        <p className="text-start border-r p-3">
          Gemini 3.1 Flash Image Preview
        </p>
        <p className="text-start p-3">Gemini 3.1 Flash Image Preview</p>
      </div>
      <h3 className="text-start text-xl py-2">Setup</h3>
      <div className="grid grid-cols-2 items-center border border-[#273041] rounded-md">
        <p className="text-start border-r p-3">Portrait</p>
        <p className="text-start p-3">Landscape</p>
      </div>

      <div className="flex items-center justify-end my-5 gap-x-2">
        <Button variant="secondary">Compare Again</Button>
        <Button variant="destructive" onClick={handleRemove}>Remove</Button>
      </div>
    </section>
  );
}
