import { CH9329_KEYCODE } from "./ch9329_keycode";
import { ModifierKeyName, MouseButtonName } from "./entities";

function byteToHexString(byteArray: Uint8Array): string {
    return Array.from(byteArray)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join(' ');
}

export class WebSocketConnector {
    private ws: WebSocket | null = null;
    private url: string;
    public onopen: (event: Event) => void = () => { };
    public onclose: (event: Event) => void = () => { };

    private left_click: boolean = false;
    private right_click: boolean = false;
    private middle_click: boolean = false;

    private shift: boolean = false;
    private ctrl: boolean = false;
    private alt: boolean = false;
    private win: boolean = false;

    private mouseDx: number = 0;
    private mouseDy: number = 0;
    private mouseWy: number = 0;

    private mouseMultiplier: number = 5.0;
    private wheelMultiplier: number = 0.30;


    constructor(url: string) {
        this.url = url;
    }

    connect() {
        console.log("start connect");
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.onopen(new Event('open'));
        };
        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.onclose(new Event('close'));
        };
        this.ws.onerror = (err) => {
            console.error('WebSocket error', err);
        };
        this.ws.onmessage = (event) => {
            console.log('WebSocket message:', event.data);
        };
    }

    SendText(message: string) {
        console.log("start send");
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            console.warn('WebSocket is not open');
        }
    }

    SendMouseMove(dx: number, dy: number, wy: number) {
        this.mouseDx += dx * this.mouseMultiplier;
        this.mouseDy += dy * this.mouseMultiplier;
        this.mouseWy += wy * this.wheelMultiplier;

        if (Math.abs(this.mouseDx) < 1 && Math.abs(this.mouseDy) < 1 && Math.abs(wy) > 1) {
            return;
        }

        console.log("start send");
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.connect();
            return;
        }

        let fdx = 0;
        let fdy = 0;
        let fwy = 0;
        if (this.mouseDx < -128) {
            fdx = -128;
        } else if (this.mouseDx > 127) {
            fdx = 127;
        } else if (this.mouseDx < 0) {
            fdx = Math.ceil(this.mouseDx);
        } else {
            fdx = Math.floor(this.mouseDx);
        }
        if (this.mouseDy < -128) {
            fdy = -128;
        } else if (this.mouseDy > 127) {
            fdy = 127;
        } else if (this.mouseDy < 0) {
            fdy = Math.ceil(this.mouseDy);
        } else {
            fdy = Math.floor(this.mouseDy);
        }
        if (this.mouseWy < -128) {
            fwy = -128;
        } else if (this.mouseWy > 127) {
            fwy = 127;
        } else if (this.mouseWy < 0) {
            fwy = Math.ceil(this.mouseWy);
        } else {
            fwy = Math.floor(this.mouseWy);
        }
        this.mouseDx -= fdx;
        this.mouseDy -= fdy;
        this.mouseWy -= fwy;

        this.sendMouseCode(fdx, fdy, fwy, this.left_click, this.right_click, this.middle_click);
    }

    SetMouseClick(button: MouseButtonName, state: boolean) {
        if (button === "left") {
            this.left_click = state;
        } else if (button === "right") {
            this.right_click = state;
        } else if (button === "middle") {
            this.middle_click = state;
        }

        this.sendMouseCode(0, 0, 0, this.left_click, this.right_click, this.middle_click);
    }

    sendMouseCode(dx: number = 0, dy: number = 0, wy: number = 0, left_click = false, right_click = false, middle_click = false) {
        console.log("start send");
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.connect();
            return;
        }

        const bytes = new Uint8Array([0x57, 0xAB, 0x00, 0x05, 0x05, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
        if (left_click) {
            bytes[6] |= 0x01;
        }
        if (right_click) {
            bytes[6] |= 0x02;
        }
        if (middle_click) {
            bytes[6] |= 0x04;
        }
        bytes[7] = dx;
        bytes[8] = dy;
        bytes[9] = wy;

        // checksum
        for (let i = 0; i < 10; i++) {
            bytes[10] += bytes[i];
        }
        console.log("send mouse move", byteToHexString(bytes));

        this.ws.send(bytes);
    }

    SetModifierKey(key: ModifierKeyName, state: boolean) {
        if (key == "shift") {
            this.shift = state;
        } else if (key == "ctrl") {
            this.ctrl = state;
        } else if (key == "alt") {
            this.alt = state;
        } else if (key == "win") {
            this.win = state;
        }
    }

    SendKey(key: string, shift: boolean = false, ctrl: boolean = false, alt: boolean = false, win: boolean = false) {
        if (!(key in CH9329_KEYCODE)) {
            console.warn("unknown key", key);
            return;
        }

        const code = [CH9329_KEYCODE[key]];

        const ok = this.sendKey(code, this.ctrl || ctrl, this.shift || shift, this.alt || alt, this.win || win);
        if (ok) {
            setTimeout(() => {
                this.sendKey([]);
            }, 100);
        }

    }
    sendKey(code: number[], ctrl = false, shift = false, alt = false, win = false): boolean {
        console.log("start send");
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.connect();
            return false;
        }

        const bytes = new Uint8Array([0x57, 0xAB, 0x00, 0x02, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        if (ctrl) {
            bytes[5] |= 0x01;
        }
        if (shift) {
            bytes[5] |= 0x02;
        }
        if (alt) {
            bytes[5] |= 0x04;
        }
        if (win) {
            bytes[5] |= 0x08;
        }

        for (let i = 0; i < code.length && i < 6; i++) {
            bytes[7 + i] = code[i];
        }

        // checksum
        for (let i = 0; i < 13; i++) {
            bytes[13] += bytes[i];
        }
        console.log("send key", byteToHexString(bytes));

        this.ws.send(bytes);

        return true;
    }

    setReleaseMoudeClick() {
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}