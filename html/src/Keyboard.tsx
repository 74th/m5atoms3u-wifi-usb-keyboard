import { WebSocketConnector } from "./connector";
import { useState, useEffect, JSX } from "react";

function Key({
  ws,
  text,
  code,
  width,
  shift,
  onClick,
}: {
  ws: WebSocketConnector;
  text: string;
  width: string;
  code?: string;
  shift?: boolean;
  onClick?: () => void;
}) {
  const [touched, setTouched] = useState(false);

  if (code === undefined) {
    code = text;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      ws.SendKey(code, shift ? shift : false);
    }
  };

  const handleTouchStart = () => {
    setTouched(true);
  };
  const handleTouchEnd = () => {
    setTouched(false);
  };

  return (
    <div
      style={{
        width: width,
        height: "100%",
        border: "1px solid white",
        boxSizing: "border-box",
        backgroundColor: touched ? "gray" : "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      {text}
    </div>
  );
}

function ModifierKey({
  ws,
  text,
  keyName,
  width,
}: {
  ws: WebSocketConnector;
  text: string;
  keyName: "shift" | "ctrl" | "alt" | "win";
  width: string;
}) {
  const [pushed, setPushed] = useState(false);

  useEffect(() => {
    return () => {
      if (pushed) {
        ws.SetModifierKey(keyName, false);
      }
    };
  }, [keyName, pushed, ws]);

  const handleClick = () => {
    if (pushed) {
      ws.SetModifierKey(keyName, false);
    } else {
      ws.SetModifierKey(keyName, true);
    }
    setPushed(!pushed);
  };

  return (
    <div
      style={{
        width: width,
        height: "100%",
        border: "1px solid white",
        boxSizing: "border-box",
        backgroundColor: pushed ? "gray" : "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={handleClick}
      tabIndex={0}
    >
      {text}
    </div>
  );
}

export function Keyboard({ ws }: { ws: WebSocketConnector }) {
  const [pattern, setPattern] = useState(0);

  let buttons: JSX.Element = <></>;
  if (pattern === 0) {
    buttons = (
      <>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key text="1" ws={ws} width="10%"></Key>
          <Key text="2" ws={ws} width="10%"></Key>
          <Key text="3" ws={ws} width="10%"></Key>
          <Key text="4" ws={ws} width="10%"></Key>
          <Key text="5" ws={ws} width="10%"></Key>
          <Key text="6" ws={ws} width="10%"></Key>
          <Key text="7" ws={ws} width="10%"></Key>
          <Key text="8" ws={ws} width="10%"></Key>
          <Key text="9" ws={ws} width="10%"></Key>
          <Key text="0" ws={ws} width="10%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key text="Q" ws={ws} width="10%"></Key>
          <Key text="W" ws={ws} width="10%"></Key>
          <Key text="E" ws={ws} width="10%"></Key>
          <Key text="R" ws={ws} width="10%"></Key>
          <Key text="T" ws={ws} width="10%"></Key>
          <Key text="Y" ws={ws} width="10%"></Key>
          <Key text="U" ws={ws} width="10%"></Key>
          <Key text="I" ws={ws} width="10%"></Key>
          <Key text="O" ws={ws} width="10%"></Key>
          <Key text="P" ws={ws} width="10%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key text="A" ws={ws} width="10%"></Key>
          <Key text="S" ws={ws} width="10%"></Key>
          <Key text="D" ws={ws} width="10%"></Key>
          <Key text="F" ws={ws} width="10%"></Key>
          <Key text="G" ws={ws} width="10%"></Key>
          <Key text="H" ws={ws} width="10%"></Key>
          <Key text="J" ws={ws} width="10%"></Key>
          <Key text="K" ws={ws} width="10%"></Key>
          <Key text="L" ws={ws} width="10%"></Key>
          <Key text="." code="PERIOD" ws={ws} width="10%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <ModifierKey
            text="SFT"
            keyName="shift"
            ws={ws}
            width="15%"
          ></ModifierKey>
          <Key text="Z" ws={ws} width="10%"></Key>
          <Key text="X" ws={ws} width="10%"></Key>
          <Key text="C" ws={ws} width="10%"></Key>
          <Key text="V" ws={ws} width="10%"></Key>
          <Key text="B" ws={ws} width="10%"></Key>
          <Key text="N" ws={ws} width="10%"></Key>
          <Key text="M" ws={ws} width="10%"></Key>
          <Key text="ENT" code="RETURN" ws={ws} width="15%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key
            text="=%/"
            ws={ws}
            width="20%"
            onClick={() => {
              setPattern(1);
            }}
          ></Key>
          <ModifierKey
            text="CTL"
            keyName="ctrl"
            ws={ws}
            width="10%"
          ></ModifierKey>
          <Key text="SPACE" code="SPACE" ws={ws} width="25%"></Key>
          <ModifierKey
            text="ALT"
            keyName="alt"
            ws={ws}
            width="10%"
          ></ModifierKey>
          <ModifierKey
            text="WIN"
            keyName="win"
            ws={ws}
            width="10%"
          ></ModifierKey>
          <Key text="TAB" ws={ws} width="10%"></Key>
          <Key text="BS" code="BACK_SPACE" ws={ws} width="15%"></Key>
        </div>
      </>
    );
  } else if (pattern === 1) {
    buttons = (
      <>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key text="!" code="1" shift={true} ws={ws} width="10%"></Key>
          <Key text="@" code="2" shift={true} ws={ws} width="10%"></Key>
          <Key text="#" code="3" shift={true} ws={ws} width="10%"></Key>
          <Key text="$" code="4" shift={true} ws={ws} width="10%"></Key>
          <Key text="%" code="5" shift={true} ws={ws} width="10%"></Key>
          <Key text="^" code="6" shift={true} ws={ws} width="10%"></Key>
          <Key text="&" code="7" shift={true} ws={ws} width="10%"></Key>
          <Key text="*" code="8" shift={true} ws={ws} width="10%"></Key>
          <Key text="(" code="9" shift={true} ws={ws} width="10%"></Key>
          <Key text=")" code="0" shift={true} ws={ws} width="10%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key
            text="~"
            code="GRAVE_ACCENT"
            shift={true}
            ws={ws}
            width="10%"
          ></Key>
          <Key
            text="{"
            code="LEFT_BRACKET"
            shift={true}
            ws={ws}
            width="10%"
          ></Key>
          <Key
            text="}"
            code="RIGHT_BRACKET"
            shift={true}
            ws={ws}
            width="10%"
          ></Key>
          <Key
            text="|"
            code="BACK_SLASH"
            shift={true}
            ws={ws}
            width="10%"
          ></Key>
          <Key text=":" code="SEMICOLON" shift={true} ws={ws} width="10%"></Key>
          <Key text='"' code="QUOTE" shift={true} ws={ws} width="10%"></Key>
          <Key text="<" code="COMMA" shift={true} ws={ws} width="10%"></Key>
          <Key text=">" code="PERIOD" shift={true} ws={ws} width="10%"></Key>
          <Key text="_" code="MINUS" shift={true} ws={ws} width="10%"></Key>
          <Key text="+" code="EQUALS" shift={true} ws={ws} width="10%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key text="`" code="GRAVE_ACCENT" ws={ws} width="10%"></Key>
          <Key text="[" code="LEFT_BRACKET" ws={ws} width="10%"></Key>
          <Key text="]" code="RIGHT_BRACKET" ws={ws} width="10%"></Key>
          <Key text="\" code="BACK_SLASH" ws={ws} width="10%"></Key>
          <Key text=";" code="SEMICOLON" ws={ws} width="10%"></Key>
          <Key text="'" code="QUOTE" ws={ws} width="10%"></Key>
          <Key text="," code="COMMA" ws={ws} width="10%"></Key>
          <Key text="." code="PERIOD" ws={ws} width="10%"></Key>
          <Key text="_" code="MINUS" ws={ws} width="10%"></Key>
          <Key text="=" code="EQUALS" ws={ws} width="10%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key text="←" code="LEFT" ws={ws} width="20%"></Key>
          <Key text="↓" code="DOWN" ws={ws} width="20%"></Key>
          <Key text="↑" code="UP" ws={ws} width="20%"></Key>
          <Key text="→" code="RIGHT" ws={ws} width="20%"></Key>
          <Key text="HOME" ws={ws} width="10%"></Key>
          <Key text="END" ws={ws} width="10%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key
            text="ABC"
            ws={ws}
            width="20%"
            onClick={() => {
              setPattern(0);
            }}
          ></Key>
          <Key
            text="Fn"
            ws={ws}
            width="20%"
            onClick={() => {
              setPattern(2);
            }}
          ></Key>
          <Key text="PD" code="PAGE_UP" ws={ws} width="10%"></Key>
          <Key text="PU" code="PAGE_DOWN" ws={ws} width="10%"></Key>
          <Key text="漢" code="KANJI" ws={ws} width="10%"></Key>
          <Key text="英" code="EISU" ws={ws} width="10%"></Key>
          <Key text="ESC" code="ESCAPE" ws={ws} width="10%"></Key>
          <Key text="DEL" code="DELETE" ws={ws} width="10%"></Key>
        </div>
      </>
    );
  } else if (pattern === 2) {
    buttons = (
      <>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key text="F1" ws={ws} width="10%"></Key>
          <Key text="F2" ws={ws} width="10%"></Key>
          <Key text="F3" ws={ws} width="10%"></Key>
          <Key text="F4" ws={ws} width="10%"></Key>
          <Key text="F5" ws={ws} width="10%"></Key>
          <Key text="F6" ws={ws} width="10%"></Key>
          <Key text="F7" ws={ws} width="10%"></Key>
          <Key text="F8" ws={ws} width="10%"></Key>
          <Key text="F9" ws={ws} width="10%"></Key>
          <Key text="F10" ws={ws} width="10%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key text="F11" ws={ws} width="10%"></Key>
          <Key text="F12" ws={ws} width="10%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key text="CapsLock" code="CAPS_LOCK" ws={ws} width="20%"></Key>
          <Key text="PrintScreen" code="PRINT_SCREEN" ws={ws} width="20%"></Key>
          <Key text="ScrollLock" code="SCROOL_LOCK" ws={ws} width="20%"></Key>
          <Key text="Pause" code="PUASE" ws={ws} width="20%"></Key>
          <Key text="Insert" code="INSERT" ws={ws} width="20%"></Key>
        </div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        ></div>
        <div
          style={{
            width: "100%",
            height: "20%",
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Key
            text="ABC"
            ws={ws}
            width="20%"
            onClick={() => {
              setPattern(0);
            }}
          ></Key>
        </div>
      </>
    );
  }
  return <div style={{ width: "100%", height: "100%" }}>{buttons}</div>;
}
