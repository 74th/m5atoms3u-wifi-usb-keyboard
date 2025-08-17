#include <functional>
#include <Arduino.h>
#include <WiFi.h>
#include "MorseCodeIPAddressIndicator.hpp"

// モールス信号のパターン定義（数字0-9）
// ドット=短点（150ms）、ダッシュ=長点（450ms）
const char *morse_digits[] = {
    "-----", // 0
    ".----", // 1
    "..---", // 2
    "...--", // 3
    "....-", // 4
    ".....", // 5
    "-....", // 6
    "--...", // 7
    "---..", // 8
    "----."  // 9
};

const char *morse_period = ".-.-.-";

// モールス信号のタイミング設定
const unsigned long DOT_DURATION = 250;               // ドット（短点）の長さ
const unsigned long DASH_DURATION = DOT_DURATION * 3; // ダッシュ（長点）の長さ
const unsigned long SIGNAL_GAP = DOT_DURATION;        // 信号間の間隔
const unsigned long DIGIT_GAP = DASH_DURATION;        // 文字間の間隔（数字/ドット）

// モールス信号の状態管理
enum MorseState
{
    MORSE_IDLE,
    MORSE_ON,
    MORSE_SIGNAL_GAP,
    MORSE_DIGIT_GAP
};

static MorseState morse_state = MORSE_IDLE;
static unsigned long morse_start_time = 0;
static uint8_t current_digit_index = 0;
static uint8_t current_signal_index = 0;
static bool morse_active = false;
static bool signal_started = false; // 各信号の開始フラグ

uint8_t local_ip = {0};
uint8_t ip_text[32] = {0};
uint8_t ip_text_len = 0;

// 与えられた文字のモールスパターンを取得（数字と'.'に対応）
static inline const char *get_morse_pattern_for_char(char ch)
{
    if (ch >= '0' && ch <= '9')
    {
        return morse_digits[ch - '0'];
    }
    else if (ch == '.')
    {
        return morse_period;
    }
    return nullptr; // 対応外文字
}

void MorseCodeIPAddressIndicator::begin() {
}

void MorseCodeIPAddressIndicator::start(bool full_ip)
{
    uint32_t now_ms = millis();

    // IP文字列の作成
    IPAddress ip = WiFi.localIP();
    if (full_ip)
    {
        // 例: 192.168.1.117
        ip_text_len = (uint8_t)snprintf((char *)ip_text, sizeof(ip_text), "%u.%u.%u.%u", ip[0], ip[1], ip[2], ip[3]);
    }
    else
    {
        // 最後の1バイトのみ
        local_ip = ip[3];
        ip_text_len = (uint8_t)snprintf((char *)ip_text, sizeof(ip_text), "%u", (unsigned)local_ip);
    }

    // モールス信号の開始
    morse_active = true;
    morse_state = MORSE_IDLE;
    current_digit_index = 0;
    current_signal_index = 0;
    morse_start_time = now_ms;

    if (full_ip)
    {
        Serial.print("[MORSE] Start Morse transmission - Full IP: ");
        Serial.println((char *)ip_text);
    }
    else
    {
        Serial.print("[MORSE] Start Morse transmission - Last octet: ");
        Serial.print((char *)ip_text);
        Serial.println();
    }

    // モールス信号パターンの詳細表示
    Serial.println("[MORSE] Planned patterns:");
    for (int i = 0; i < ip_text_len; i++)
    {
        char ch = (char)ip_text[i];
        const char *pattern = get_morse_pattern_for_char(ch);
        if (pattern)
        {
            Serial.printf("  [%d] '%c': %s\r\n", i, ch, pattern);
        }
        else
        {
            Serial.printf("  [%d] '%c': <unsupported>\r\n", i, ch);
        }
    }
}

void MorseCodeIPAddressIndicator::loop()
{
    uint32_t now_ms = millis();

    if (!morse_active)
    {
        return;
    }

    unsigned long elapsed = now_ms - morse_start_time;

    switch (morse_state)
    {
    case MORSE_IDLE:
        // 新しい文字の開始
        if (current_digit_index < ip_text_len)
        {
            char ch = (char)ip_text[current_digit_index];
            const char *pattern = get_morse_pattern_for_char(ch);
            if (pattern && pattern[0] != '\0')
            {
                current_signal_index = 0;
                morse_state = MORSE_ON;
                morse_start_time = now_ms;
                signal_started = false; // 新しい文字の開始時にリセット
                Serial.printf("[MORSE] Start sending char '%c' (pattern: %s)\r\n", ch, pattern);

                // 最初の信号を即座に開始
                char signal = pattern[0];
                led_on_fn();
                Serial.printf("[MORSE] Signal '%c' (%s) ON start (%dms)\r\n",
                              signal,
                              (signal == '.') ? "dot" : "dash",
                              (int)((signal == '.') ? DOT_DURATION : DASH_DURATION));
                signal_started = true;
            }
            else
            {
                // 対応外文字はスキップ
                current_digit_index++;
                morse_state = MORSE_IDLE;
                morse_start_time = now_ms;
            }
        }
        else
        {
            // 全ての文字を送信完了、停止
            morse_active = false;
            led_off_fn();
            Serial.printf("[MORSE] All characters sent, Morse transmission finished\r\n");
        }
        break;

    case MORSE_ON:
    {
        char ch = (char)ip_text[current_digit_index];
        const char *pattern = get_morse_pattern_for_char(ch);
        if (!pattern)
        {
            // 対応外文字はスキップ
            current_digit_index++;
            morse_state = MORSE_IDLE;
            morse_start_time = now_ms;
            break;
        }

        if (current_signal_index < strlen(pattern))
        {
            char signal = pattern[current_signal_index];
            unsigned long duration = (signal == '.') ? DOT_DURATION : DASH_DURATION;

            // 信号開始時の処理は既に状態遷移時に実行済み
            // ここでは時間経過のみチェック
            if (elapsed >= duration)
            {
                led_off_fn();
                morse_state = MORSE_SIGNAL_GAP;
                morse_start_time = now_ms;
                current_signal_index++;
                signal_started = false; // 次の信号のためにリセット
                Serial.printf("[MORSE] Signal '%c' finished, inter-signal gap (%dms)\r\n",
                              signal, (int)SIGNAL_GAP);
            }
        }
    }
    break;

    case MORSE_SIGNAL_GAP:
        if (elapsed >= SIGNAL_GAP)
        {
            char ch = (char)ip_text[current_digit_index];
            const char *pattern = get_morse_pattern_for_char(ch);

            if (!pattern)
            {
                // 対応外文字
                current_digit_index++;
                morse_state = MORSE_DIGIT_GAP;
                morse_start_time = now_ms;
            }
            else if (current_signal_index < strlen(pattern))
            {
                // 同じ文字の次の信号
                morse_state = MORSE_ON;
                morse_start_time = now_ms;
                signal_started = false; // 次の信号開始前にリセット

                // 次の信号を即座に開始
                char signal = pattern[current_signal_index];
                led_on_fn();
                Serial.printf("[MORSE] Signal '%c' (%s) ON start (%dms)\r\n",
                              signal,
                              (signal == '.') ? "dot" : "dash",
                              (int)((signal == '.') ? DOT_DURATION : DASH_DURATION));
                signal_started = true;
            }
            else
            {
                // この文字の送信完了、次の文字へ
                current_digit_index++;
                morse_state = MORSE_DIGIT_GAP;
                morse_start_time = now_ms;
                Serial.printf("[MORSE] Char '%c' finished, inter-character gap (%dms)\r\n",
                              ch, (int)DIGIT_GAP);
            }
        }
        break;

    case MORSE_DIGIT_GAP:
        if (elapsed >= DIGIT_GAP)
        {
            morse_state = MORSE_IDLE;
            morse_start_time = now_ms;
        }
        break;
    }
}

void MorseCodeIPAddressIndicator::stop()
{
    morse_active = false;
    led_off_fn();
    Serial.printf("[MORSE] Transmission stopped\r\n");
}
