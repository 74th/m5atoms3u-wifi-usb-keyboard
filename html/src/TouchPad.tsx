"use client";
import { WebSocketConnector } from "./connector";
import { useRef, useState } from "react";

function TouchPad({ ws }: { ws: WebSocketConnector }) {
  const isMoveSpaceTouching = useRef(false);
  const isWheelSpaceTouching = useRef(false);
  const [leftButtonTouching, setLeftButtonTouching] = useState(false);
  const [middleButtonTouching, setMiddleButtonTouching] = useState(false);
  const [rightButtonTouching, setRightButtonTouching] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPoint = (e: React.TouchEvent | React.MouseEvent) => {
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX, y: touch.clientY };
    } else {
      return { x: e.clientX, y: e.clientY };
    }
  };

  const handleMoveSpaceTouchStart = (
    e: React.TouchEvent | React.MouseEvent
  ) => {
    isMoveSpaceTouching.current = true;
    lastPos.current = getPoint(e);
  };

  const handleMoveSpaceTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isMoveSpaceTouching.current || !lastPos.current) return;
    const point = getPoint(e);
    const dx = point.x - lastPos.current.x;
    const dy = point.y - lastPos.current.y;
    if (dx !== 0 || dy !== 0) {
      console.log("移動量", { dx, dy });
      ws.SendMouseMove(dx, dy, 0);
    }
    lastPos.current = point;
  };

  const handleMoveSpaceTouchEnd = () => {
    isMoveSpaceTouching.current = false;
    lastPos.current = null;
  };

  const handleWheelSpaceTouchStart = (
    e: React.TouchEvent | React.MouseEvent
  ) => {
    isWheelSpaceTouching.current = true;
    lastPos.current = getPoint(e);
  };

  const handleWheelSpaceTouchMove = (
    e: React.TouchEvent | React.MouseEvent
  ) => {
    if (!isWheelSpaceTouching.current || !lastPos.current) return;
    const point = getPoint(e);
    const dx = point.x - lastPos.current.x;
    const dy = point.y - lastPos.current.y;
    if (dx !== 0 || dy !== 0) {
      console.log("移動量", { dx, dy });
      ws.SendMouseMove(0, 0, dy);
    }
    lastPos.current = point;
  };

  const handleWheelSpaceTouchEnd = () => {
    isWheelSpaceTouching.current = false;
    lastPos.current = null;
  };

  const handleLeftButtonTouchStart = () => {
    setLeftButtonTouching(true);
    ws.SetMouseClick("left", true);
  };
  const handleLeftButtonTouchEnd = () => {
    setLeftButtonTouching(false);
    ws.SetMouseClick("left", false);
  };

  const handleMiddleButtonTouchStart = () => {
    setMiddleButtonTouching(true);
    ws.SetMouseClick("middle", true);
  };
  const handleMiddleButtonTouchEnd = () => {
    setMiddleButtonTouching(false);
    ws.SetMouseClick("middle", false);
  };

  const handleRightButtonTouchStart = () => {
    setRightButtonTouching(true);
    ws.SetMouseClick("right", true);
  };
  const handleRightButtonTouchEnd = () => {
    setRightButtonTouching(false);
    ws.SetMouseClick("right", false);
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <div
        style={{
          width: "85%",
          height: "80%",
          position: "absolute",
          top: "0px",
          backgroundColor: "black",
          border: "1px solid white",
          boxSizing: "border-box",
        }}
        onTouchStart={handleMoveSpaceTouchStart}
        onTouchMove={handleMoveSpaceTouchMove}
        onTouchEnd={handleMoveSpaceTouchEnd}
        onMouseDown={handleMoveSpaceTouchStart}
        onMouseMove={(e) => {
          if (isMoveSpaceTouching.current) handleMoveSpaceTouchMove(e);
        }}
        onMouseUp={handleMoveSpaceTouchEnd}
        onMouseLeave={handleMoveSpaceTouchEnd}
      ></div>
      <div
        style={{
          width: "15%",
          height: "80%",
          position: "absolute",
          top: "0px",
          right: "0px",
          backgroundColor: "black",
          border: "1px solid white",
          boxSizing: "border-box",
        }}
        onTouchStart={handleWheelSpaceTouchStart}
        onTouchMove={handleWheelSpaceTouchMove}
        onTouchEnd={handleWheelSpaceTouchEnd}
        onMouseDown={handleWheelSpaceTouchStart}
        onMouseMove={(e) => {
          if (isWheelSpaceTouching.current) handleWheelSpaceTouchMove(e);
        }}
        onMouseUp={handleWheelSpaceTouchEnd}
        onMouseLeave={handleWheelSpaceTouchEnd}
      ></div>
      <div
        style={{
          width: "40%",
          height: "20%",
          position: "absolute",
          left: "0px",
          bottom: "0px",
          backgroundColor: leftButtonTouching ? "gray" : "black",
          border: "1px solid white",
          boxSizing: "border-box",
        }}
        onTouchStart={handleLeftButtonTouchStart}
        onTouchEnd={handleLeftButtonTouchEnd}
        onMouseDown={handleLeftButtonTouchStart}
        onMouseUp={handleLeftButtonTouchEnd}
      ></div>
      <div
        style={{
          width: "20%",
          height: "20%",
          position: "absolute",
          right: "40%",
          bottom: "0px",
          backgroundColor: middleButtonTouching ? "gray" : "black",
          border: "1px solid white",
          boxSizing: "border-box",
        }}
        onTouchStart={handleMiddleButtonTouchStart}
        onTouchEnd={handleMiddleButtonTouchEnd}
        onMouseDown={handleMiddleButtonTouchStart}
        onMouseUp={handleMiddleButtonTouchEnd}
      ></div>
      <div
        style={{
          width: "40%",
          height: "20%",
          position: "absolute",
          right: "0px",
          bottom: "0px",
          backgroundColor: rightButtonTouching ? "gray" : "black",
          border: "1px solid white",
          boxSizing: "border-box",
        }}
        onTouchStart={handleRightButtonTouchStart}
        onTouchEnd={handleRightButtonTouchEnd}
        onMouseDown={handleRightButtonTouchStart}
        onMouseUp={handleRightButtonTouchEnd}
      ></div>
    </div>
  );
}

export default TouchPad;
