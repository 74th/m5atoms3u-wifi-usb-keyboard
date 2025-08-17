#include <functional>

class MorseCodeIPAddressIndicator
{
public:
    std::function<void()> led_on_fn;
    std::function<void()> led_off_fn;

    MorseCodeIPAddressIndicator(std::function<void()> led_on, std::function<void()> led_off)
        : led_on_fn(led_on), led_off_fn(led_off) {}

    void begin();
    void loop();
    void start(bool full_ip);
    void stop();
};