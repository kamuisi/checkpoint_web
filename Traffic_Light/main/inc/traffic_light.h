#ifndef _TRAFFIC_LIGHT_H
#define _TRAFFIC_LIGHT_H

#include <stdint.h>


typedef struct
{
    uint8_t red;
    uint8_t green;
    uint8_t yellow;
} LightTime;

void TrafficLight_GPIOinit(void );

//start light
void TrafficLight_setTime(uint8_t green, uint8_t yellow, uint8_t red);
void TrafficLight_start(void );


//other
void TrafficLight_setLight(char* light);

#endif