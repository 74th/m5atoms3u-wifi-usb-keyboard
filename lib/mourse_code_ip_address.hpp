#include <functional>

namespace MourseCodeIPAdress
{

    class WiFiSetupManager
    {
    public:
        std::function<void()> led_on_fn;
        std::function<void()> led_off_fn;

        void begin();
        void loop();
        void start(bool full_ip);
        void stop();
    };
};