import React, { useRef } from "react";
import { Stage, Layer, Line } from "react-konva";
import type Konva from "konva";

export type LineType = {
  tool: "pen" | "eraser";
  points: number[];
};

interface DrawingCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  width: number;
  height: number;
  tool: "pen" | "eraser";
  lines: LineType[];
  setLines: React.Dispatch<React.SetStateAction<LineType[]>>;
}

export default function DrawingCanvas({
  stageRef,
  width,
  height,
  tool,
  lines,
  setLines,
}: DrawingCanvasProps) {
  const isDrawing = useRef(false);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    isDrawing.current = true;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setLines((prev) => [...prev, { tool, points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;

      const updated: LineType = {
        ...last,
        points: [...last.points, point.x, point.y],
      };

      return [...prev.slice(0, -1), updated];
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: "absolute",
        inset: 0,
      }}
    >
      <Layer>
        {lines.map((line, i) => (
          <Line
            key={i}
            points={line.points}
            stroke={line.tool === "eraser" ? "black" : "red"}
            strokeWidth={line.tool === "eraser" ? 30 : 5}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation={
              line.tool === "eraser" ? "destination-out" : "source-over"
            }
          />
        ))}
      </Layer>
    </Stage>
  );
}
