import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ImageItem } from "@/lib/store/useProjectStore";

type SelectedImage = ImageItem & {
  previousImage?: string | null;
  drawingImage?: string | null;
  modelName?: string | null;
  aspectRatio?: string | null;
  uploadedImages?: string[];
};

interface ImageDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedImage?: SelectedImage | null;
}

function ImageDialog({ open, setOpen, selectedImage }: ImageDialogProps) {
  console.log("selectedImage",selectedImage)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="min-w-lvh bg-white">
        <span className="text-black text-xl">Image Details</span>

        {selectedImage && (
          <div className={`${selectedImage.previousImage ? "grid grid-cols-2 gap-6" : "mx-auto w-full"}`}>
            {selectedImage.previousImage && (
              <div>
                <h3 className="mb-2 font-semibold">Before Edit</h3>

                {selectedImage.previousImage ? (
                  <div className="relative border rounded overflow-hidden">
                    <img
                      src={selectedImage.previousImage}
                      alt="previous"
                      className="w-full"
                    />

                    {selectedImage.drawingImage && (
                      <img
                        src={selectedImage.drawingImage}
                        alt="drawing"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      />
                    )}
                  </div>
                ) : (
                  <div className="border rounded p-4 text-center">
                    No previous image
                  </div>
                )}
              </div>
            )}
            <div className={`${selectedImage.previousImage ? "" : "mx-auto w-full flex items-center flex-col"}`}>
              <h3 className="mb-2 font-semibold">Generated Result</h3>

              <img
                src={selectedImage.src || ""}
                alt="generated"
                className={`${selectedImage.previousImage ? "w-full border rounded" : "w-1/2 flex flex-col justify-center"}`}
              />
            </div>
          </div>
        )}

        {selectedImage?.prompt && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Prompt:</p>

            <p>{selectedImage.prompt}</p>
          </div>
        )}
        {selectedImage?.modelName && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">AI Model</p>

            <p>{selectedImage.modelName}</p>
          </div>
        )}
        {selectedImage?.aspectRatio && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Aspect Ratio</p>

            <p>{selectedImage.aspectRatio}</p>
          </div>
        )}
        {(selectedImage?.uploadedImages?.length ?? 0) > 0 && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Uploaded Images</p>
            <span className="flex items-start flex-wrap">
              {selectedImage?.uploadedImages?.map(
                (prevImage: string, index: number) => (
                  <img
                    className="w-20 object-cover"
                    src={prevImage}
                    alt={"prevImage" + index}
                  />
                ),
              )}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ImageDialog;
