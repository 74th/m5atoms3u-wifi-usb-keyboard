#include <Arduino.h>

#include <M5Unified.h>

#include "USB.h"
#include "USBHIDKeyboard.h"
#include "USBHIDMouse.h"

#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>

#include <WebSocketsServer.h>
#include <WebServer.h>
#include <mdns.h>
#include <Adafruit_NeoPixel.h>

#include <wifi_settings.hpp>
#include <morse_code_ip_address.hpp>

void MorseLEDOn();
void MorseLEDOff();

// data/index.html
extern const uint8_t _binary_data_index_html_gz_start[] asm("_binary_data_index_html_gz_start");
extern const uint8_t _binary_data_index_html_gz_end[] asm("_binary_data_index_html_gz_end");
// data/assets/index.js.gz
extern const uint8_t _binary_data_assets_index_js_gz_start[] asm("_binary_data_assets_index_js_gz_start");
extern const uint8_t _binary_data_assets_index_js_gz_end[] asm("_binary_data_assets_index_js_gz_end");
// data/assets/style.css.gz
extern const uint8_t _binary_data_assets_style_css_gz_start[] asm("_binary_data_assets_style_css_gz_start");
extern const uint8_t _binary_data_assets_style_css_gz_end[] asm("_binary_data_assets_style_css_gz_end");

USBHID HID;
USBHIDKeyboard Keyboard;
USBHIDMouse Mouse;

#define ENABLE_USB_DEVICE 1

#define LED_PIN GPIO_NUM_35

#define LED_COLOR_SETUP Adafruit_NeoPixel::Color(0, 32, 0)
#define LED_COLOR_NORMAL Adafruit_NeoPixel::Color(0, 0, 32)
#define LED_COLOR_CONNECT Adafruit_NeoPixel::Color(32, 32, 0)
#define LED_COLOR_OPERATION Adafruit_NeoPixel::Color(0, 32, 32)

WiFiMulti wifiMulti;
WebSocketsServer webSocket = WebSocketsServer(81);
WebServer server(80);
Adafruit_NeoPixel pixels(1, LED_PIN, NEO_GRB + NEO_KHZ800);
MorseCodeIPAddress morseCodeIPAddress(MorseLEDOn, MorseLEDOff);

    uint8_t prevKeys[6] = {0, 0, 0, 0, 0, 0};
uint8_t prevModifier = 0;
uint8_t prevMouseKey = 0;

void hexdump(const void *mem, uint32_t len, uint8_t cols = 16)
{
  const uint8_t *src = (const uint8_t *)mem;
  Serial.printf("[HEXDUMP] Address: 0x%08X len: 0x%X (%d)\r\n", (ptrdiff_t)src, len, len);
  for (uint32_t i = 0; i < len; i++)
  {
    if (i % cols == 0)
    {
      Serial.printf("[0x%08X] 0x%08X: ", (ptrdiff_t)src, i);
    }
    Serial.printf("%02X ", *src);
    src++;
  }
  Serial.printf("\r\n");
}

void MorseLEDOn()
{
  pixels.setPixelColor(0, pixels.Color(255, 255, 255));
  pixels.show();
}

void MorseLEDOff()
{
  pixels.setPixelColor(0, LED_COLOR_NORMAL);
  pixels.show();
}

void handleKeyboardEvent(uint8_t *payload)
{
  for (int i = 0; i < 6; i++)
  {
    if (payload[7 + i] == 0)
      continue;

    for (int j = 0; j < 6; j++)
    {
      if (prevKeys[j] == payload[7 + i])
        continue;
    }
#ifdef ENABLE_DEBUG_PRINT
    Serial.printf("Key Pressed: %02X\r\n", payload[7 + i]);
#endif
#ifdef ENABLE_USB_DEVICE
    Keyboard.press(payload[7 + i]);
#endif
  }
  for (int i = 0; i < 6; i++)
  {
    if (prevKeys[i] == 0)
      continue;
    for (int j = 0; j < 6; j++)
    {
      if (prevKeys[i] == payload[7 + j])
        continue;
    }
#ifdef ENABLE_DEBUG_PRINT
    Serial.printf("Key Released: %02X\r\n", prevKeys[i]);
#endif
#ifdef ENABLE_USB_DEVICE
    Keyboard.release(prevKeys[i]);
#endif
  }
  for (int i = 0; i < 6; i++)
  {
    prevKeys[i] = payload[7 + i];
  }

  uint8_t modifier = payload[5];

  for (int i = 0; i < 8; i++)
  {
    uint8_t b = 1 << i;
    if (prevModifier & b == modifier & b)
      continue;
    if (modifier & b)
    {
#ifdef ENABLE_DEBUG_PRINT
      Serial.printf("Key Pressed: %02X\r\n", 0x80 + i);
#endif
#ifdef ENABLE_USB_DEVICE
      Keyboard.press(0x80 + i);
#endif
    }
    if (prevModifier & b)
    {
#ifdef ENABLE_DEBUG_PRINT
      Serial.printf("Key Released: %02X\r\n", 0x80 + i);
#endif
#ifdef ENABLE_USB_DEVICE
      Keyboard.release(0x80 + i);
#endif
    }
  }
  prevModifier = modifier;
}

void handleMouseEvent(uint8_t *payload)
{
  int8_t x = payload[7];
  int8_t y = payload[8];
  int8_t w = payload[9];
#ifdef ENABLE_DEBUG_PRINT
  Serial.printf("Mouse x=%02d,y=%02d,w=%02d\r\n", x, y, w);
#endif
#ifdef ENABLE_USB_DEVICE
  Mouse.move(x, y, w);
#endif

  uint8_t mouseKey = payload[6];
  for (int i = 0; i < 3; i++)
  {
    uint8_t b = 1 << i;

    if (b & prevMouseKey == b & mouseKey)
      continue;

    if (b & mouseKey)
    {
#ifdef ENABLE_DEBUG_PRINT
      Serial.printf("Mouse press=%d\r\n", b);
#endif
#ifdef ENABLE_USB_DEVICE
      Mouse.press(b);
#endif
    }
    if (b & prevMouseKey)
    {
#ifdef ENABLE_DEBUG_PRINT
      Serial.printf("Mouse release=%d\r\n", b);
#endif
#ifdef ENABLE_USB_DEVICE
      Mouse.release(b);
#endif
    }
  }
  prevMouseKey = payload[6];
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length)
{

  switch (type)
  {
  case WStype_DISCONNECTED:
#ifdef ENABLE_DEBUG_PRINT
    Serial.printf("[%u] Disconnected!\n", num);
#endif
    pixels.setPixelColor(0, LED_COLOR_NORMAL);
    pixels.show();
    break;
  case WStype_CONNECTED:
  {
    IPAddress ip = webSocket.remoteIP(num);
#ifdef ENABLE_DEBUG_PRINT
    Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
#endif

    webSocket.sendTXT(num, "Connected");
    pixels.setPixelColor(0, LED_COLOR_CONNECT);
    pixels.show();
  }
  break;

  case WStype_BIN:
#ifdef ENABLE_DEBUG_PRINT
    Serial.printf("[%u] get binary length: %u\r\n", num, length);
#endif

    if (length == 0)
    {
      break;
    }

#ifdef ENABLE_DEBUG_PRINT
    hexdump(payload, length);
#endif

    if (payload[0] == 0x57)
    {
      if (payload[3] == 0x02)
      {
        handleKeyboardEvent(payload);
      }

      if (payload[3] == 0x05)
      {
        handleMouseEvent(payload);
      }
    }

    break;
  case WStype_TEXT:
  case WStype_ERROR:
  case WStype_FRAGMENT_TEXT_START:
  case WStype_FRAGMENT_BIN_START:
  case WStype_FRAGMENT:
  case WStype_FRAGMENT_FIN:
    break;
  }
}

static void sendStatic(const char *mime,
                       const uint8_t *gzStart, const uint8_t *gzEnd)
{
  server.sendHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  server.sendHeader("Pragma", "no-cache");
  server.sendHeader("Expires", "0");
  server.sendHeader("Content-Encoding", "gzip");
  server.send_P(200, mime,
                reinterpret_cast<const char *>(gzStart),
                gzEnd - gzStart);
}

void setup()
{
  M5.begin();

#ifdef ENABLE_USB_DEVICE
  HID.begin();
  USB.begin();
  Keyboard.begin();
  Mouse.begin();
#endif

#ifdef ENABLE_DEBUG_PRINT
  Serial.begin(115200);

  Serial.setDebugOutput(true);

  Serial.println();
  Serial.println();
  Serial.println();
#endif

  pixels.begin();

  pixels.setPixelColor(0, LED_COLOR_SETUP);
  pixels.show();

  delay(1000);

  wifiMulti.addAP(WIFI_SSID, WIFI_PASSWORD);

  while (wifiMulti.run() != WL_CONNECTED)
  {
    delay(100);
  }

#ifdef ENABLE_DEBUG_PRINT
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());
  Serial.flush();
#endif

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  server.on("/", HTTP_GET, []()
            { sendStatic("text/html",
                         _binary_data_index_html_gz_start,
                         _binary_data_index_html_gz_end); });
  server.on("/assets/index.js", HTTP_GET, []()
            { sendStatic("application/javascript",
                         _binary_data_assets_index_js_gz_start,
                         _binary_data_assets_index_js_gz_end); });
  server.on("/assets/style.css", HTTP_GET, []()
            { sendStatic("text/css",
                         _binary_data_assets_style_css_gz_start,
                         _binary_data_assets_style_css_gz_end); });
  server.begin();

  pixels.setPixelColor(0, LED_COLOR_NORMAL);
  pixels.show();
}

void loop()
{
  M5.update();
  webSocket.loop();
  server.handleClient();
  if (M5.BtnA.wasClicked())
  {
#ifdef ENABLE_DEBUG_PRINT
    Serial.print("Connected! IP address: ");
    Serial.println(WiFi.localIP());
    Serial.flush();
    morseCodeIPAddress.start(false);
#endif
  }

  morseCodeIPAddress.loop();
}