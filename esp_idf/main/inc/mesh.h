#ifndef __MESH_H__
#define __MESH_H__
unsigned long IRAM_ATTR millis();

void mesh_app_start( void ); 
void wifi_mesh_start(void);
void smartconfig_task(void *);
void mesh_app_start( void );
void esp_mesh_rx_start( void );
void mesh_event_handler( void *, esp_event_base_t , int32_t , void * );


#endif