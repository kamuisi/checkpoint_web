#ifndef __APPS_H__
#define __APPS_H__
typedef struct 
{
    char* id;
    char* mac;
} nodeEsp;
void getStick();
void start_btn_task();
void send_setup_msg(char*, char*);
void send_disconnect_msg(char* );
bool send_connect_msg();
void send_sensor_msg();
bool send_pincap_layer(int , int, char*);

void task_mesh_rx ( void *pvParameter );
void task_send_bat_capacity ( void *pvParameter );
void task_send_bat_capacity_create();
void task_app_create( void );

#endif