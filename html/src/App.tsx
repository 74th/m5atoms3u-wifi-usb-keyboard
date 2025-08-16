"use client";
import { WebSocketConnector } from "./connector";
import { useRef, useEffect, useState } from "react";
import TouchPad from "./TouchPad";
import { Keyboard } from "./Keyboard";

function App() {
  const wsRef = useRef<WebSocketConnector | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // WebSocket接続先URLを決定
    let wsUrl = "";
    const params = new URLSearchParams(window.location.search);
    const target = params.get("target");
    if (target) {
      wsUrl = `ws://${target}`;
    } else {
      wsUrl = `ws://${window.location.hostname}:81`;
    }
    if (!wsRef.current) {
      wsRef.current = new WebSocketConnector(wsUrl);
      wsRef.current.onopen = () => {
        setConnected(true);
      };
      wsRef.current.onclose = () => {
        setConnected(false);
      };
      wsRef.current.connect();
    }
    return () => {};
  }, []);

  return (
    <div style={{ width: "99vw", height: "99vh", color: "white" }}>
      <div
        style={{
          width: "100%",
          height: "60%",
          position: "absolute",
          top: "0px",
        }}
      >
        {wsRef.current ? <TouchPad ws={wsRef.current} /> : null}
      </div>
      <div
        style={{
          width: "100%",
          height: "40%",
          bottom: "0px",
          position: "absolute",
        }}
      >
        {wsRef.current ? <Keyboard ws={wsRef.current} /> : null}
      </div>
      <div style={{ position: "absolute", top: "0px", left: "0px" }}>
        WebSocket接続状態: {connected ? "接続中" : "未接続"}
      </div>
    </div>
  );
}

export default App;
