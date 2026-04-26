import { useState } from "react";

export const GeneratorSideBar = () => {
  const [images, setImages] = useState([]);

  const handleImageChange = (event) => {
    console.log("event.target.files", event.target.files, typeof event.target.files);
    const files = Array.from(event.target.files);

    // Validate file types (only images)
    const validImages = files.filter((file) => file.type.startsWith("image/"));
    console.log("validImages", validImages, typeof validImages);
    if (validImages.length !== files.length) {
      alert("Some files were not images and have been ignored.");
    }

    // Convert to preview URLs
    const imagePreviews = validImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    console.log("imagePreviews", typeof imagePreviews, imagePreviews);
    setImages(imagePreviews);
  };

  return (
    <div className="h-screen w-xs text-white bg-black border-x border-gray-700 p-4 text-start space-y-3">
      <div className="space-y-3">
        <h3 className="text-xl">Version History</h3>
        <textarea
          rows={3}
          className="border focus:outline-none ring-0 rounded-md p-2 w-full"
        />
      </div>
      <div className="space-y-3">
        <h4 className="text-md">AI Model</h4>
        <select className="border focus:outline-none ring-0 rounded-md p-2 w-full">
          <option value="volvo">1.2.2</option>
        </select>
      </div>
      <div className="space-y-3">
        <h4 className="text-md">Aspect Ration</h4>
        <select className="border focus:outline-none ring-0 rounded-md p-2 w-full">
          <option value="volvo">16:9</option>
        </select>
      </div>
      <div className="flex items-center gap-x-4 overflow-x-auto max-w-full">
        {images.map((img: { preview: string }, index) => (
          <div key={index} className="text-center shrink-0">
            <img
              src={img.preview}
              alt={`preview-${index}`}
              className="w-25 h-25 object-cover rounded-lg border border-gray-300"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col space-y-4">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
        />
        <button>Generate</button>
        <button>Fork New Variant</button>
      </div>
    </div>
  );
};
