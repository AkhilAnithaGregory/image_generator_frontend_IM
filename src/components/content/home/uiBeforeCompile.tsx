import { Button } from "@/components/ui/button";
import { RiAiGenerate2, RiImageCircleAiFill } from "react-icons/ri";
import { useState } from "react";
import { useProjectStore } from "@/lib/store/useProjectStore";
import DefaultLayout from "@/lib/layouts/defaultLayout";
import { LuImagePlus } from "react-icons/lu";
import { Spinner } from "@/components/ui/spinner";

export const UiBeforeCompile = () => {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [prompt, setPrompt] = useState("");
  console.log("images", images);
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

    setImages(previews.slice(0, 4));
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

      const response = await fetch("http://localhost:3001/api/generate", {
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
      <div className="h-screen w-full flex flex-col justify-center items-center text-white">
        <span className="text-5xl font-bold">
          NEXORA - Free AI Image Generator
        </span>

        <p className="text-xl py-5 text-gray-300">
          Turn your ideas into images quickly using descriptions
        </p>

        <div className="shadow-[0_20px_50px_rgba(8,112,184,0.7)] rounded-xl w-1/2 p-10 bg-[#0f172a]">
          <div className="flex items-start gap-x-5 pb-4">
            {images?.length === 0 ? (
              <div className="relative outline-dashed outline-[#334155] rounded-md w-40 h-40 bg-[#1f2937]">
                <input
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                <span className="absolute top-2 right-2 text-gray-400 text-sm">
                  {images?.length}/4
                </span>

                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <LuImagePlus size={30} />
                  <span>Image refs</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 w-1/3 gap-2">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img.preview}
                    className="w-20 h-20 rounded"
                  />
                ))}
                {images.length < 4 && (
                  <div className="relative outline-dashed outline-[#334155] h-25 w-25 rounded-md bg-[#1f2937]">
                    <input
                      type="file"
                      multiple
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />

                    <span className="absolute top-2 right-2 text-gray-400 text-sm">
                      {images?.length}/4
                    </span>

                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <LuImagePlus size={20} />
                      <span>Image refs</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              className="w-3/4 text-lg resize-none bg-transparent outline-none text-white placeholder-gray-400"
              placeholder={`Generate or edit images with just a description.
            Example:
            - A futuristic city at sunset
            - Remove object from image`}
            />
          </div>
          <div className="grid grid-cols-4 gap-x-2 items-end">
            <div className="mb-3 sm:mb-0">
              <label className="text-sm text-gray-400 block mb-1 text-start">
                AI Model
              </label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full p-2 bg-gray-800 rounded"
              >
                <option value="gemini-3.1-flash-image-preview">
                  Gemini 3.1 Flash Image Preview
                </option>
                <option value="gemini-3-pro-image-preview">
                  Gemini 3 Pro Image Preview
                </option>
              </select>
            </div>

            <div className="mb-3 sm:mb-0">
              <label className="text-sm text-gray-400 block mb-1 text-start">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-2 bg-gray-800 rounded"
              >
                <option value="DSLR, 85mm lens, shallow depth of field, soft natural lighting, sharp focus on subject">
                  Portrait
                </option>
                <option value="wide angle lens, 16mm, deep depth of field, natural lighting, highly detailed">
                  Landscape
                </option>
                <option value="cinematic lighting, anamorphic lens, film still, dramatic shadows, depth of field">
                  Cinematic
                </option>
                <option value="macro lens, studio lighting, ultra sharp, clean background, high detail">
                  Product / Close-up
                </option>
              </select>
            </div>

            <div className="mb-3 sm:mb-0">
              <label className="text-sm text-gray-400 block mb-1 text-start">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full p-2 bg-gray-800 rounded"
              >
                <option value="1:1">1:1</option>
                <option value="16:9">16:9</option>
              </select>
            </div>

            <div className="flex justify-end w-full">
              <Button
                onClick={handleGenerate}
                variant="generator"
                disabled={isGenerating}
                className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-10 flex items-center gap-x-2"
              >
                {isGenerating ? (
                  <>
                    <Spinner />
                    Generating...
                  </>
                ) : (
                  <>
                    <RiImageCircleAiFill />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};
