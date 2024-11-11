#ifndef __GPIO_H__
#define __GPIO_H__

#include "driver/gpio.h"

void led_on();
void led_off();
void gpios_setup( );
void gpio_init(gpio_num_t gpio_num,gpio_mode_t gpio_mode);
void blink_led_task(void *);
void blink_led();
void stop_blink_led();
#endif