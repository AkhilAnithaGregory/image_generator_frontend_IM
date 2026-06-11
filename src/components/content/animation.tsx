import Lottie from "lottie-react";

interface AnimationProps {
  animationData?: unknown;
}

export default function AnimationComponent({ animationData }: AnimationProps) {
  return (
    <Lottie
      animationData={animationData as unknown}
      loop={true}
      style={{
        width: 300,
        height: 300,
      }}
    />
  );
}
