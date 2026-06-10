import Lottie from "lottie-react"

export default function AnimationComponent({ animationData }) {
  console.log(Lottie);
  return (
    <Lottie
      animationData={animationData}
      loop={true}
      style={{
        width: 300,
        height: 300,
      }}
    />
  );
}
