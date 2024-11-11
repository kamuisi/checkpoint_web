#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdarg.h>

/**
 * FreeRTOS
 */
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "freertos/event_groups.h"

/**
 * WiFi
 */
#include "esp_wifi.h"

/**
 * Logs
 */
#include "esp_log.h"

/**
 * Callback
 */
#include "esp_event.h"

/**
 * Aplications (App);
 */
extern "C" {
#include "app.h"

/**
 * Mesh APP
 */
#include "mesh.h"

/* Gpio handler */
#include "gpio_handler.h"

#include "nvs_handler.h"
}
/**
 * PINOUT; 
 */
#include "sys_config.h"

#include "vl53l0x_handler.h"

#include "vl53l0x.h"

#include "i2c.h"


/**
 * Constants;
 */
// static const char *TAG = "main: ";

/**
 * Prototypes Functions;
 */
// void app_main( void );
extern "C" {
void app_main(void);
}
VL53L0X vl53l0x_c;
vl53l0x_t vl53l0x = {
    .i2c = &i2c,
    .sensor = &vl53l0x_c,
    .max_range = 250,
    .range = 0
};
uint16_t *max_range_extern = &vl53l0x.max_range;
/**
 * Program begins here:)
 */
void app_main( void )
{
    /* Nvs flash init */
    nvs_init();

    /* Batcap init(); */
    task_send_bat_capacity_create();
    /**
     * Initial GPIOs;
     */
	gpios_setup();
    /**
     * Initial reset ssid and password button;
     */
    start_btn_task();
    /**
     * Initial of stack mesh;
     */
    wifi_mesh_start();
    /**
     * Initial of task sensor
     */
    sensor_start(&vl53l0x);
}
