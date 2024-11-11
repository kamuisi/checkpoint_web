#include "traffic_light.h"
#include "gpio_handler.h"
#include "sys_config.h"
#include "string.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

LightTime LT = {
    .red = 10,
    .green = 8,
    .yellow = 1
};

void TrafficLight_GPIOinit(void){
    // init for traffic light
    gpio_init(RED_LED, GPIO_MODE_OUTPUT);
    gpio_init(YELLOW_LED, GPIO_MODE_OUTPUT);
    gpio_init(GREEB_LED, GPIO_MODE_OUTPUT);
    gpio_set_level(RED_LED, LED_ON_LEVEL);
    gpio_set_level(GREEB_LED, LED_OFF_LEVEL);
    gpio_set_level(YELLOW_LED, LED_OFF_LEVEL);
}

// start light
void TrafficLight_setTime(uint8_t green, uint8_t yellow, uint8_t red){
    LT.green = green;
    LT.red = red;
    LT.yellow = yellow;
}
void TrafficLight_start(void){
    gpio_set_level(RED_LED, LED_ON_LEVEL);
    gpio_set_level(GREEB_LED, LED_OFF_LEVEL);
    gpio_set_level(YELLOW_LED, LED_OFF_LEVEL);
    vTaskDelay((LT.red * 1000) / portTICK_PERIOD_MS);

    // gpio_set_level(RED_LED,LED_ON_LEVEL);
    // gpio_set_level(GREEB_LED,LED_OFF_LEVEL);
    // gpio_set_level(YELLOW_LED,LED_OFF_LEVEL);
    // vTaskDelay((time.yel * 1000)/portTICK_PERIOD_MS)

    gpio_set_level(RED_LED, LED_OFF_LEVEL);
    gpio_set_level(GREEB_LED, LED_ON_LEVEL);
    gpio_set_level(YELLOW_LED, LED_OFF_LEVEL);
    // vTaskDelay((time.green*1000) / portTICK_PERIOD_MS);
}

// other
void TrafficLight_setLight(char *light){
    gpio_set_level(RED_LED, LED_OFF_LEVEL);
    gpio_set_level(GREEB_LED, LED_OFF_LEVEL);
    gpio_set_level(YELLOW_LED, LED_OFF_LEVEL);
    printf("%s\n", light);
    if (strcmp(light, "green") == 0)
    {
        gpio_set_level(GREEB_LED, LED_ON_LEVEL);
    }
    else if (strcmp(light, "yellow") == 0)
    {
        gpio_set_level(RED_LED, LED_ON_LEVEL);
    }
    else if (strcmp(light, "red") == 0)
    {
        printf("Off Red");
        gpio_set_level(RED_LED, LED_ON_LEVEL);
    }
}