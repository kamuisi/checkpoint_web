#ifndef _SYSCONFIG__H
#define _SYSCONFIG__H

/**
 * Debugger?
 */
#define DEBUG 1

#define SEND_DISCONNECT 1
/**
 * NODE_ID
 */
#define NODE_ID "1"

#define END_NODE 0

#define STOP_STATION_NODE 0
/**
 * GPIOs defs
 */
// #define LED_BUILDING         ( 2 ) 
#define LED_BUILDING         ( 27 ) 
#define GPIO_OUTPUT_PIN_SEL  ( 1ULL<<LED_BUILDING )

#define BUTTON_PIN               ( 0 )
#define GPIO_INPUT_PIN_SEL   ( 1ULL<<BUTTON )

/**
 * Info wifi your ssid & passwd
 */
#define WIFI_SSID       "3 Thang"
#define WIFI_PASSWORD   "123bathang"
#define SERVER_IP       "192.168.1.147"

/**
 * Globals defs
 */
#define TRUE  1
#define FALSE 0

#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT      BIT1
#endif 