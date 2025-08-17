# スマホをPCのUSBキーボード・マウスにするAtomS3U

![alt text](docs/top.png)

## features

- スマートフォンがUSBキーボード・トラックパッドとして使えます
- ESP32でよくあるBluetoothを使うプロダクトと異なり、USBデバイスとして動作するため、PCのセットアップが不要です
- キーを入力しやすくするよう
- WiFiをUSB経由でセットアップでき、IPアドレスをモールス信号で知らせる機構があります

## 構造

![alt text](docs/architecture.drawio.svg)

AtomS3Uは、WiFiに接続し、HTTP Serverとして機能します。
HTTP Serverに、スマートフォンのWebブラウザからアクセスすると、操作するためのトラックパッドとキーボードのページが表示されます。
この時、Webソケットを使って、AtomS3Uに接続された状態になります。

キーボードのボタンや、トラックパッドスペースに触ると、Webソケット経由でAtomS3Uに操作した情報が伝わります。
AtomS3UはUSBデバイスとして接続されたPCに認識されるようになっており、USBキーボードのキーのタイプや、マウスの操作を行います。

## 機能

### キーボード・トラックパッドの機能

![alt text](docs/mouse_keyboard_function.drawio.svg)

キーボードには複数のレイアウトが用意されています。
物理キーボードならば、Shift+4のようにシフトを併用して入力の必要があるマークキーも1タップで入力できます。

![alt text](docs/keyboard_layouts.drawio.svg)

操作している動画はこちらです。

### WiFiのセットアップ

LEDが赤色に点灯している場合、WiFiに接続できていません。
WiFiのセットアップに、USBとブラウザ経由でセットアップできます。
PCに接続し、ブラウザを表示して、以下のページにて、SSID、パスワードをセットアップしてください。

🌐 https://esp32-serial-wifi-setup.74th.tech

![alt text](docs/web_serial_wifi_setup.png)

セットアップが完了すると、LEDが青色に点灯します。

### IPアドレスをモールス信号で知らせる

LEDが青色に点灯している場合、ボタンAを押すと、モールス信号でIPアドレスを知らせます。
IPアドレスは最後の1バイトを知らせます。

| 数字 | 信号  |
| ---- | ----- |
| 0    | ----- |
| 1    | .---- |
| 2    | ..--- |
| 3    | ...-- |
| 4    | ...._ |
| 5    | ..... |
| 6    | _.... |
| 7    | __... |
| 8    | ___.. |
| 9    | ____. |

例えば、`192.168.1.178` の場合は以下の信号になります

```
.---- --... ---..
```

この機能には https://github.com/74th/esp32-morse-code-ipaddress-indicator を使用しています。

## 技術

### WebSocket

ESP32-S3とWebSocketで通信するには、ライブラリ Links2004/WebSockets を使用して実装できました。

https://github.com/Links2004/arduinoWebSockets

### Web画面

ブラウザで表示するWeb画面は、Reactとviteを使用して実装しました。
viteでビルドしたフロントエンドを、ESP32内に組み込んでいます。

これを利用するには、ファイルをgz圧縮します。

PlatformIOを使用する場合、platform.iniに以下を追記します。

```
board_build.embed_files =
  data/index.html.gz
  data/assets/index.js.gz
  data/assets/style.css.gz
```

```
// data/index.html
extern const uint8_t _binary_data_index_html_gz_start[] asm("_binary_data_index_html_gz_start");
extern const uint8_t _binary_data_index_html_gz_end[] asm("_binary_data_index_html_gz_end");
```

### WebSocket上のキーボード、マウス操作のプロトコル

キーボード、マウスを送信するWebソケットのパケットのプロトコルには、CH9329というICのUARTで使われている仕様を参考にしました。
同じ製作をCH9329とESP32-C3を使って行っていたため、流用しました。

### WebブラウザでのWiFIのセットアップ

Webブラウザ上でWiFiのセットアップができる ESP32 Serial WiFi Setup というモジュールを作りました。

https://github.com/74th/esp32-serial-wifi-setup

これは、WebSerialを用いて、ESP32-S3のシリアルポートに接続します。
ESP32-S3のシリアルポートで、JSON RPC 2.0プロトコルを用いて、WiFiのSSIDやパスワードを設定できるようにしました。

USB接続だけでWiFiの設定ができるため、ファームウェアをビルドする必要もなく、便利です。

### IPアドレスのモールス信号通知

モールス信号でIPアドレスを通知できる ESP32 Morse Code IP Adress Indicator というモジュールを作りました。

https://github.com/74th/esp32-morse-code-ipaddress-indicator

OLED等のディスプレイがないM5Stack製品でも、利用者にIPアドレスが分かるようになるため、便利です。

ただし、利用者にモールス信号を読み取る能力が必要です。