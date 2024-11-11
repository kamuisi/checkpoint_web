#ifndef NVS_H
#define NVS_H
#include "nvs_flash.h"

void nvs_init();
void nvs_delete_ssid_pass(void *);
void nvs_save_ssid_pass(uint8_t* , uint8_t* , void * );
void nvs_set_ip(char *, void *);
esp_err_t nvs_get_ssid_password(uint8_t* ssid, uint8_t* password, char* ip, void * arg);

#endif 