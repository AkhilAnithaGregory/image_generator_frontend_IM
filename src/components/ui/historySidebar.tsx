import { useImageStore } from "@/lib/store/useImageStore";

export const HistorySideBar = ({
  lastGeneratedImage,
  setLastGeneratedImage,
}) => {
  const { images, setSelectedNodeId } = useImageStore();
  return (
    <div className="h-screen overflow-auto w-xl text-white bg-black border-x border-gray-700 p-4 space-y-3">
      <h3 className="text-xl">Version History</h3>

      <ol className="relative border-s border-default">
        {images?.map((img) => (
          <li key={img.id} className="mb-10 ms-4 text-start">
            <div
              className={`${img.src === lastGeneratedImage ? "bg-[#374151]" : "bg-white"} absolute w-3 h-3 rounded-full mt-1.5 -start-1.5 border border-buffer`}
            ></div>
            <div
              className="grid grid-cols-3 gap-2 border border-[#82defc] items-center rounded-md p-2 cursor-pointer"
              onClick={() => {
                setSelectedNodeId(img.id);
                setLastGeneratedImage(img.src);
              }}
            >
              <div className="w-20  col-span-1">
                <img
                  src={img.src}
                  className="w-full h-full object-cover rounded-sm"
                />
              </div>
              <div className="col-span-2">
                <div className="text-[#82defc]">V {img.id}</div>
                <p className="h-15 overflow-hidden">{img.prompt}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
