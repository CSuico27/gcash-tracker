interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-4",
  lg: "w-12 h-12 border-4",
};

export default function Spinner({ size = "md", fullScreen = false, centered = false }: SpinnerProps & { centered?: boolean }) {
  const spinner = (
    <div className={`${sizeMap[size]} border-blue-500 border-t-transparent rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return <div className="flex items-center justify-center h-screen">{spinner}</div>;
  }

  if (centered) {
    return <div className="flex items-center justify-center">{spinner}</div>;
  }

  return spinner;
}