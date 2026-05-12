import { Button } from "@/components/ui/button";
import { GeneratorSideBar } from "@/components/ui/generatorSidebar";
import { HistorySideBar } from "@/components/ui/historySidebar";
import { useImageStore } from "@/lib/store/useImageStore";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FiDownload, FiMaximize2 } from "react-icons/fi";
import { LuPencil } from "react-icons/lu";
import { RiAiGenerate2 } from "react-icons/ri";

export const Route = createFileRoute("/generator/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { images, revertCurrentImage } = useImageStore();
  const [lastGeneratedImage, setLastGeneratedImage] = useState(null);
  const latestImage = images[images.length - 1];
  const currentImage = lastGeneratedImage || images[images.length - 1];
  return (
    <div className="w-full">
      {images?.length > 0 ? (
        <UiAfterCompile
          lastGeneratedImage={lastGeneratedImage}
          setLastGeneratedImage={setLastGeneratedImage}
          revertCurrentImage={revertCurrentImage}
          currentImage={currentImage}
          latestImage={latestImage}
        />
      ) : (
       <UiAfterCompile
          lastGeneratedImage={lastGeneratedImage}
          setLastGeneratedImage={setLastGeneratedImage}
          revertCurrentImage={revertCurrentImage}
          currentImage={currentImage}
          latestImage={latestImage}
        />
      )}
    </div>
  );
}

export const UiAfterCompile = ({
  lastGeneratedImage,
  setLastGeneratedImage,
  revertCurrentImage,
  currentImage,
  latestImage,
}) => {
  return (
    <div className="flex gap-5 items-center w-full">
      <GeneratorSideBar
        lastGeneratedImage={lastGeneratedImage}
        setLastGeneratedImage={setLastGeneratedImage}
        onRevert={() => revertCurrentImage(currentImage)}
      />
      <div className="w-full flex justify-center">
        <div className="relative group">
          <img
            src={lastGeneratedImage || latestImage?.src || "/1.png"}
            alt="imga"
            className="w-225 h-225 object-contain rounded-sm border border-gray-700"
          />

          {/* Top Right Actions */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {/* Download */}
            <button
              onClick={async () => {
                try {
                  const imageUrl =
                    lastGeneratedImage || latestImage?.src || "/1.png";

                  const response = await fetch(imageUrl);
                  const blob = await response.blob();

                  const blobUrl = window.URL.createObjectURL(blob);

                  const link = document.createElement("a");
                  link.href = blobUrl;
                  link.download = `generated-${Date.now()}.png`;

                  document.body.appendChild(link);
                  link.click();

                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(blobUrl);
                } catch (err) {
                  console.error("Download failed", err);
                }
              }}
              className="bg-black/70 hover:bg-black text-white p-2 rounded-md transition"
            >
              <FiDownload size={18} />
            </button>

            {/* View Large */}
            <button
              onClick={() =>
                window.open(
                  lastGeneratedImage || latestImage?.src || "/1.png",
                  "_blank",
                )
              }
              className="bg-black/70 hover:bg-black text-white p-2 rounded-md transition"
            >
              <FiMaximize2 size={18} />
            </button>
          </div>

          {/* Bottom Left Pencil */}
          <button
            className="absolute bottom-3 left-3 bg-black/70 hover:bg-black text-white p-2 rounded-md transition"
            onClick={() => {
              console.log("Open drawing editor");
            }}
          >
            <LuPencil size={18} />
          </button>
        </div>
      </div>
      <HistorySideBar
        lastGeneratedImage={lastGeneratedImage}
        setLastGeneratedImage={setLastGeneratedImage}
      />
    </div>
  );
};

export const UiBeforeCompile = () => {
  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center">
      <span className="text-5xl font-bold text-white">Free AI Image Generator</span>
      <p className="text-xl py-5">Turn your ideas into images quickly using descriptions</p>
      <div className="shadow-md shadow-amber-100 rounded-md w-125 p-10">
        <input className="outline-none w-full" />
        <Button className="bg-blue-500 text-white text-lg px-10 flex items-center gap-x-2 justify-end">
          <RiAiGenerate2 size={40}/>
          Generate</Button>
      </div>
    </div>
  );
};
