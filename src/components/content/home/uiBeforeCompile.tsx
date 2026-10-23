import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useProjectStore } from "@/lib/store/useProjectStore";
import DefaultLayout from "@/lib/layouts/defaultLayout";
import { LuImagePlus, LuSparkles, LuWand } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import LoadingText from "@/components/ui/loadingText";
import { BASE_URL } from "@/lib/defaultValues";

export const UiBeforeCompile = () => {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [modelName, setModelName] = useState("gemini-3.1-flash-image-preview");
  const [style, setStyle] = useState(
    "DSLR, 85mm lens, shallow depth of field, soft natural lighting, sharp focus on subject",
  );
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const { createProject } = useProjectStore();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const files = Array.from(fileList) as File[];

    const previews = files
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setImages((prev) => [...prev, ...previews].slice(0, 4));
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && images.length === 0) {
      alert("Enter prompt or upload image");
      return;
    }

    const formData = new FormData();

    images.forEach((img) => {
      formData.append("images", img.file);
    });

    formData.append("prompt", prompt);
    formData.append("aspectRatio", aspectRatio);
    formData.append("modelName", modelName);
    formData.append("style", style);

    try {
      setIsGenerating(true);

      const response = await fetch(`${BASE_URL}/generate`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      const newImage = {
        id: `node-${Date.now()}`,
        src: data.image,
        prompt,
        parentId: null,
        previousImage: null,
        uploadedImages: data.uploadedImages || [],
        drawingImage: data.drawingImage || null,
        modelName: data.modelName,
        aspectRatio: data.aspectRatio,
        generatedAt: Date.now(),
      };

      createProject(prompt, newImage);

      setPrompt("");
      setImages([]);
    } catch (err) {
      console.error(err);
      alert("Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DefaultLayout>
      {/* Full screen loading overlay when generating */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <LoadingText isLoading={isGenerating} />
        </div>
      )}

      <div
        className="min-h-full w-full flex flex-col justify-center items-center text-white px-4 py-8 sm:py-14 overflow-y-auto"
        style={{
          background:
            "linear-gradient(180deg, #080b12 0%, #0c1018 50%, #080b12 100%)",
        }}
      >
        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <LuSparkles size={18} className="text-blue-400" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-[0.18em]">
            Nexora AI Studio
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-tight text-center leading-tight m-0">
          Turn Ideas Into Images
        </h1>

        <p className="text-sm sm:text-base text-gray-400 pb-6 sm:pb-8 text-center max-w-lg px-2 leading-relaxed">
          Generate, branch, and edit high-resolution visuals with AI.
        </p>

        {/* Main Creation Card */}
        <div
          className="w-full max-w-2xl rounded-2xl p-4 sm:p-6 border border-white/8 shadow-2xl backdrop-blur-xl"
          style={{ background: "rgba(12, 15, 23, 0.85)" }}
        >
          {/* Prompt + Upload Area */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4 mb-4">
            {images?.length === 0 ? (
              <div className="relative border border-dashed border-white/[0.12] rounded-xl h-24 sm:h-28 sm:w-28 sm:min-w-[112px] bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex items-center justify-center cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="absolute top-1.5 right-2 text-gray-500 text-[10px] font-mono">
                  {images?.length}/4
                </span>
                <div className="flex flex-row sm:flex-col items-center justify-center text-gray-400 gap-2 sm:gap-1.5">
                  <LuImagePlus size={20} className="text-blue-400" />
                  <span className="text-xs">Add Reference</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-2 gap-2 sm:min-w-[112px]">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative group w-full aspect-square sm:w-13 sm:h-13 rounded-lg overflow-hidden border border-white/8 bg-black"
                  >
                    <img
                      src={img.preview}
                      className="w-full h-full object-cover"
                      alt={`Reference ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                      title="Remove reference"
                    >
                      <IoClose size={11} />
                    </button>
                  </div>
                ))}
                {images.length < 4 && (
                  <div className="relative border border-dashed border-white/[0.1] rounded-lg w-full aspect-square sm:w-13 sm:h-13 bg-white/[0.02] flex items-center justify-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <LuImagePlus size={14} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="A high-tech cyberpunk explorer in a neon-lit rainstorm, intricate reflection, cinematic 8k..."
                className="w-full p-3 sm:p-3.5 bg-white/3 border border-white/8 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none focus:border-white/20 transition-colors resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 items-end">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-medium uppercase tracking-[0.05em]">
                Model
              </label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full p-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs outline-none focus:border-white/15 transition-colors cursor-pointer"
              >
                <option
                  value="gemini-3.1-flash-image-preview"
                  className="bg-[#0f1219]"
                >
                  Gemini 3.1 Flash
                </option>
                <option value="gemini-2.5-flash-image" className="bg-[#0f1219]">
                  Gemini 2.5 Flash
                </option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-medium uppercase tracking-[0.05em]">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs outline-none focus:border-white/15 transition-colors cursor-pointer"
              >
                <option
                  value="DSLR, 85mm lens, shallow depth of field, soft natural lighting, sharp focus on subject"
                  className="bg-[#0f1219]"
                >
                  Photorealistic
                </option>
                <option
                  value="futuristic cyberpunk city, neon glow, wet reflections, high contrast, atmospheric fog"
                  className="bg-[#0f1219]"
                >
                  Cyberpunk
                </option>
                <option
                  value="modern anime illustration, Makoto Shinkai style, vibrant colors, detailed sky, cinematic lighting"
                  className="bg-[#0f1219]"
                >
                  Anime Art
                </option>
                <option
                  value="classic oil painting, textured brush strokes, moody lighting, renaissance aesthetic"
                  className="bg-[#0f1219]"
                >
                  Oil Painting
                </option>
                <option
                  value="3D digital art, octane render, unreal engine 5, ray tracing, studio lighting"
                  className="bg-[#0f1219]"
                >
                  3D Digital / Octane
                </option>
                <option
                  value="epic fantasy concept art, matte painting, highly detailed, dramatic lighting"
                  className="bg-[#0f1219]"
                >
                  Fantasy Concept Art
                </option>
                <option
                  value="clean minimalist vector art, flat design, bold shapes, elegant palette"
                  className="bg-[#0f1219]"
                >
                  Minimalist Vector
                </option>
                <option value="" className="bg-[#0f1219]">
                  None / Default
                </option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-medium uppercase tracking-[0.05em]">
                Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full p-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-xs outline-none focus:border-white/15 transition-colors cursor-pointer"
              >
                <option value="1:1" className="bg-[#0f1219]">
                  1:1 Square
                </option>
                <option value="3:4" className="bg-[#0f1219]">
                  3:4 Portrait
                </option>
                <option value="16:9" className="bg-[#0f1219]">
                  16:9 Widescreen
                </option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm h-10 w-full rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LuWand size={15} />
                <span>Generate</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};
