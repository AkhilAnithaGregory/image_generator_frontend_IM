import { useEffect, useState } from "react";

const messages = [
  "Analyzing your prompt...",
  "Generating the image...",
  "Adding details and textures...",
  "Enhancing quality...",
  "Finalizing your artwork...",
];

export default function LoadingText({ isLoading }: { isLoading: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) return;

    const text = messages[messageIndex];
    let current = 0;

    setDisplayedText("");

    const typingInterval = setInterval(() => {
      current++;

      setDisplayedText(text.slice(0, current));

      if (current >= text.length) {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [messageIndex, isLoading]);

  if (!isLoading) return null;

  return (
    <div className="text-black text-center text-5xl">
      {displayedText}
      <span className="animate-pulse">|</span>
    </div>
  );
}
