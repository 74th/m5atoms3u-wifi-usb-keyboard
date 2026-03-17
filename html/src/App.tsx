"use client";

import { WebSocketConnector } from "./connector";
import { useRef, useEffect, useState } from "react";
import TouchPad from "./TouchPad";
import { Keyboard } from "./Keyboard";

type KeyMapResult = {
  key?: string;
  modifier?: "shift" | "ctrl" | "alt" | "win";
};

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) {
    return false;
  }

  const tag = el.tagName?.toLowerCase();
  return (
    el.isContentEditable ||
    tag === "input" ||
    tag === "textarea" ||
    tag === "select"
  );
}

function mapKeyboardEvent(event: KeyboardEvent): KeyMapResult {
  switch (event.code) {
    case "ShiftLeft":
    case "ShiftRight":
      return { modifier: "shift" };
    case "ControlLeft":
    case "ControlRight":
      return { modifier: "ctrl" };
    case "AltLeft":
    case "AltRight":
      return { modifier: "alt" };
    case "MetaLeft":
    case "MetaRight":
      return { modifier: "win" };

    case "Enter":
    case "NumpadEnter":
      return { key: "RETURN" };
    case "Escape":
      return { key: "ESCAPE" };
    case "Backspace":
      return { key: "BACK_SPACE" };
    case "Tab":
      return { key: "TAB" };
    case "Space":
      return { key: "SPACE" };

    case "Minus":
    case "NumpadSubtract":
      return { key: "MINUS" };
    case "Equal":
    case "NumpadAdd":
      return { key: "EQUALS" };
    case "BracketLeft":
      return { key: "LEFT_BRACKET" };
    case "BracketRight":
      return { key: "RIGHT_BRACKET" };
    case "Backslash":
      return { key: "BACK_SLASH" };
    case "Semicolon":
      return { key: "SEMICOLON" };
    case "Quote":
      return { key: "QUOTE" };
    case "Backquote":
      return { key: "GRAVE_ACCENT" };
    case "Comma":
      return { key: "COMMA" };
    case "Period":
      return { key: "PERIOD" };
    case "Slash":
      return { key: "SLASH" };

    case "CapsLock":
      return { key: "CAPS_LOCK" };
    case "PrintScreen":
      return { key: "PRINT_SCREEN" };
    case "ScrollLock":
      return { key: "SCROOL_LOCK" };
    case "Pause":
      return { key: "PAUSE" };
    case "Insert":
      return { key: "INSERT" };
    case "Home":
      return { key: "HOME" };
    case "PageUp":
      return { key: "PAGE_UP" };
    case "Delete":
      return { key: "DELETE" };
    case "End":
      return { key: "END" };
    case "PageDown":
      return { key: "PAGE_DOWN" };
    case "ArrowRight":
      return { key: "RIGHT" };
    case "ArrowLeft":
      return { key: "LEFT" };
    case "ArrowDown":
      return { key: "DOWN" };
    case "ArrowUp":
      return { key: "UP" };
    case "NumLock":
      return { key: "NUM_LOCK" };
  }

  if (/^Key[A-Z]$/.test(event.code)) {
    return { key: event.code.replace("Key", "") };
  }

  if (/^Digit[0-9]$/.test(event.code)) {
    return { key: event.code.replace("Digit", "") };
  }

  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(event.code)) {
    return { key: event.code };
  }

  if (/^Numpad[0-9]$/.test(event.code)) {
    return { key: event.code.replace("Numpad", "") };
  }

  return {};
}

function App() {
  const wsRef = useRef<WebSocketConnector | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);
  const [connected, setConnected] = useState(false);
  const [captureEnabled, setCaptureEnabled] = useState(true);

  useEffect(() => {
    // Determine the WebSocket connection URL
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!captureEnabled) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      if (!wsRef.current) {
        return;
      }

      const mapped = mapKeyboardEvent(event);
      if (!mapped.key && !mapped.modifier) {
        return;
      }

      event.preventDefault();

      if (mapped.modifier) {
        wsRef.current.SetModifierKey(mapped.modifier, true);
        return;
      }

      if (event.repeat) {
        return;
      }

      wsRef.current.SendKey(mapped.key!);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!captureEnabled) {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      if (!wsRef.current) {
        return;
      }

      const mapped = mapKeyboardEvent(event);
      if (!mapped.modifier) {
        return;
      }

      event.preventDefault();
      wsRef.current.SetModifierKey(mapped.modifier, false);
    };

    const handleWindowBlur = () => {
      if (!wsRef.current) {
        return;
      }
      wsRef.current.SetModifierKey("shift", false);
      wsRef.current.SetModifierKey("ctrl", false);
      wsRef.current.SetModifierKey("alt", false);
      wsRef.current.SetModifierKey("win", false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    captureRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [captureEnabled]);

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
      <div
        ref={captureRef}
        tabIndex={0}
        style={{ position: "absolute", top: "0px", left: "0px", zIndex: 1000 }}
      >
        <div>WebSocket status: {connected ? "✅" : "❌"}</div>
        <button onClick={() => setCaptureEnabled((v) => !v)}>
          Capture &#9000; {captureEnabled ? "✅" : "❌"}
        </button>
      </div>
    </div>
  );
}

export default App;
