#include <stdio.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>

/**
 * FreeRTOS
 */

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "freertos/queue.h"
#include "freertos/event_groups.h"

/**
 * Drivers;
 */
#include "driver/gpio.h"
#include "driver/adc.h"
#include "esp_adc_cal.h"
/**
 * GPIOs Config;
 */
#include "app.h"

/**
 * Standard configurations loaded
 */
#include "sys_config.h"

/**
 * Logs;
 */
#include "esp_log.h"

/**
 * Rede mesh;
 */
#include "esp_mesh.h"
#include "esp_mesh_internal.h"
#include "esp_http_client.h"
#include "esp_mac.h"
/**
 * Lwip
 */
#include "lwip/err.h"
#include "lwip/sys.h"
#include <lwip/sockets.h>
/*
ESP timer
*/
#include "esp_timer.h"

/**
* Json
*/
#include "cJSON.h"

#include "mesh.h"

#include "mqtt.h"

#include "gpio_handler.h"

#include "nvs_handler.h"
/**
 * Constants;
 */
static const char *TAG = "app: ";

/**
 * Global Variables; 
 */
static esp_adc_cal_characteristics_t adc1_chars;
/* Route Table */
extern mesh_addr_t route_table[];
/* Mac address root */
extern char mac_address_root_str[];
/* Max range to measure */
extern uint16_t *max_range_extern;
/* Ip server */
extern char ip[50];
/* Contain node online */
nodeEsp activeNode[30];
int lengthOfActiveNode = 0;
/* Tick using for async */
long long Tick = 0;
long long previousTick = 0;

extern bool is_tick_be_get; 
/* nvs_handle */
extern nvs_handle my_handle;
/* Send signal url */
char post_url [200] = "http://192.168.0.101:3001/send-data";
/* Get tick url */
char get_url [200] = "http://192.168.0.101:3001/getTick";
/* Buffer using for mesh */
#define RX_SIZE          (200)
static uint8_t rx_buf[RX_SIZE] = { 0, };
#define TX_SIZE          (200)  
static uint8_t tx_buf[TX_SIZE] = { 0, };

/* Taking millis function */
unsigned long IRAM_ATTR millis(){return (unsigned long) (esp_timer_get_time() / 1000ULL);}
/* Press button 0 over 3s to reset ssid and password */
void clear_ssid_pass_button(void *pvParameters)
{   
    unsigned long   lastDebounceTime = 0, // the last time the output pin was toggled
                    debounceDelay = 50,   // the debounce time; increase if the output flickers
                    buttonPressTime = 0, //Amount of time the button has been held down
                    actualBtnState = 0,
                    timeSinceDebounce = 0;
    int lastButtonState = 1, buttonState;
    while (1)
    { 
        // read the state of the switch into a local variable:
        int reading = gpio_get_level(BUTTON_PIN);
        if (!reading)   
            actualBtnState = reading;
        if (reading != lastButtonState) // If the switch changed, due to noise or pressing:
        {
            led_on();
            lastDebounceTime = millis(); // reset the debouncing timer
        }
        timeSinceDebounce = millis() - lastDebounceTime;
        if (timeSinceDebounce > debounceDelay)
        {
            // whatever the reading is at, it's been there for longer than the debounce
            // delay, so take it as the actual current state:
            buttonState = reading;
            if (buttonState == 0)
            {
                buttonPressTime += timeSinceDebounce;
            }
            else if (buttonPressTime > 3000)
            { 
                buttonPressTime = 0;
                //Delete ssid and password
                nvs_delete_ssid_pass(&my_handle);
                led_off();
                esp_restart();
            }
            else
            {
                buttonPressTime = 0;
            }
        }
        // save the reading. Next time through the loop, it'll be the lastButtonState:
        lastButtonState = reading;
        vTaskDelay( debounceDelay/portTICK_PERIOD_MS );
    }
}
/* Creating delete ssid and password task */ 
void start_btn_task()
{
    xTaskCreate(clear_ssid_pass_button, "clear_ssid_pass_button", 1024*2, NULL, 10, NULL);
}
/* Function to send child*/
esp_err_t client_event_post_handler(esp_http_client_event_handle_t evt)
{
    switch (evt->event_id)
    {case HTTP_EVENT_ON_DATA: printf("HTTP_EVENT_ON_DATA: %.*s\n", evt->data_len, (char *)evt->data);   break;
    default:    break;
    }
    return ESP_OK;
}

void post_rest_function(void * post_data)
{  sprintf(post_url,"http://%s:3001/send-data",ip);
    esp_http_client_config_t config_post = {
        .url = post_url,
        .method = HTTP_METHOD_POST,
        .cert_pem = NULL,
        .event_handler = client_event_post_handler};
        
    esp_http_client_handle_t client = esp_http_client_init(&config_post);

    esp_http_client_set_post_field(client, post_data, strlen(post_data));
    esp_http_client_set_header(client, "Content-Type", "application/json");

    esp_err_t err = esp_http_client_perform(client);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open HTTP connection: %s", esp_err_to_name(err));
    } 
    esp_http_client_cleanup(client);
    vTaskDelete(NULL);
}
long long takeTick(){
    return Tick + (millis() - previousTick)/10;
}

void getStick(){
    char output_buffer[2048] = {0};   
    int content_length = 0;
    #if DEBUG
    ESP_LOGI(TAG,"%s",ip);
    #endif
    sprintf(get_url, "http://%s:3001/getTick", ip);
    esp_http_client_config_t config = {
        .url = get_url,
    };
    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_method(client, HTTP_METHOD_GET);
    esp_err_t err = esp_http_client_open(client, 0);
    ESP_LOGI(TAG,"HTTP Get");
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open HTTP connection: %s", esp_err_to_name(err));
    } else {
        content_length = esp_http_client_fetch_headers(client);
        if (content_length < 0) {
            ESP_LOGE(TAG, "HTTP client fetch headers failed");
        } else {
            int data_read = esp_http_client_read_response(client, output_buffer, 2048);
            if (data_read >= 0) {
                ESP_LOGI(TAG, "HTTP GET Status = %d, content_length = %lld",
                esp_http_client_get_status_code(client),
                esp_http_client_get_content_length(client));
                ESP_LOGI(TAG, "%s", (char*) output_buffer);
                cJSON *root = cJSON_Parse((char*)output_buffer);
                Tick = cJSON_GetObjectItem(root,"tick")->valueint;
                previousTick = millis();
                Tick += 27;
                // ESP_LOGI(TAG, "%lld", Tick);
                
            } else {
                ESP_LOGE(TAG, "Failed to read response");
            }
        }
    }
    esp_http_client_close(client);
    is_tick_be_get = 1;
};
void task_send_data(char *post_data){
    xTaskCreate(post_rest_function, "post_rest_function", 1024*4, post_data, 2, NULL);
}
void send_mesh(char* data_t)
{
    mesh_data_t data;
    int route_table_size;
    data.data = tx_buf;
    data.size = TX_SIZE;   
    data.proto = MESH_PROTO_JSON;
    snprintf( (char*)tx_buf, TX_SIZE, data_t); 
    data.size = strlen((char*)tx_buf) + 1;

    esp_mesh_get_routing_table((mesh_addr_t *) &route_table,
                        CONFIG_MESH_ROUTE_TABLE_SIZE * 6, &route_table_size);
    char mac_str[30];
    for( int i = 0; i < route_table_size; i++ ) 
    {
        sprintf(mac_str, MACSTR, MAC2STR(route_table[i].addr));
        if( strcmp( mac_address_root_str, mac_str) != 0 )
        {   esp_err_t err; 
            err = esp_mesh_send(&route_table[i], &data, MESH_DATA_P2P, NULL, 0);
            if (err) 
            {
                #if DEBUG 
                    ESP_LOGI( TAG, "ERROR : Sending Mesh Message!\r\n" ); 
                #endif
            } else {
                #if DEBUG 
                        ESP_LOGI( TAG, "ROOT (%s) sends (%s) to NON-ROOT (%s)\r\n", mac_address_root_str, tx_buf, mac_str );                         
                #endif
            }
            vTaskDelay(200);
        }
    }
}
void send_sensor_msg()
{
    char mac_str[30]; 
    esp_err_t err;
    mesh_data_t data;
    data.data = tx_buf;
    data.size = TX_SIZE;
    data.proto = MESH_PROTO_JSON;
    cJSON *root;
    root=cJSON_CreateObject();
    cJSON_AddStringToObject(root, "Topic", "Send-Data");
    cJSON_AddStringToObject(root, "Data", NODE_ID);
    cJSON_AddNumberToObject(root, "Tick", takeTick());
    char *rendered=cJSON_Print(root);
    if(esp_mesh_is_root()){
        // mqtt_app_publish("ESP-send", NODE_ID); 
        task_send_data(rendered); 
    } else {
        snprintf( (char*)tx_buf, TX_SIZE,  rendered ); 
        data.size = strlen((char*)tx_buf) + 1;
        err = esp_mesh_send(NULL, &data, MESH_DATA_P2P, NULL, 0);   
        if (err) 
        {
            ESP_LOGI( TAG, "ERROR : Sending Sensor Message!\r\n" );   
        } else {
                uint8_t chipid[20];
                esp_efuse_mac_get_default(chipid);
                snprintf( mac_str, sizeof( mac_str ), ""MACSTR"", MAC2STR( chipid ) );
                #if DEBUG 
                ESP_LOGI( TAG, "\r\nNON-ROOT sends (%s) (%s) to ROOT (%s)\r\n", mac_str, tx_buf, mac_address_root_str );      
                #endif                   
        }
    }
}
    /*Respond mqtt msg Root to Nonroot*/
void send_setup_msg(char * topic, char * data){
    cJSON *root;
    if(strcmp(topic,"range")==0){
        root = cJSON_Parse(data);
        char* ID = cJSON_GetObjectItem(root,"node")->valuestring;
        if (strcmp(ID, NODE_ID)==0){
            *max_range_extern = cJSON_GetObjectItem(root,"range")->valueint;
            #if DEBUG 
            ESP_LOGI( TAG, "%d", *max_range_extern );   
            #endif
            #if DEBUG 
            ESP_LOGI(TAG,"It root");
            #endif
        } else {
            cJSON_AddStringToObject(root, "Topic", topic);
            char *rendered = cJSON_Print(root);   
            send_mesh(rendered);
        }
    } else if (strcmp(topic,"check")==0){
        root = cJSON_Parse(data);
        char* ID = cJSON_GetObjectItem(root,"node")->valuestring;
        if (strcmp(ID, NODE_ID)==0){
            mqtt_app_publish("ESP-connect", NODE_ID);
        } else {
            cJSON_AddStringToObject(root, "Topic", topic);
            char *rendered = cJSON_Print(root);   
            send_mesh(rendered);
        }
    }  else if (strcmp(topic,"ip")==0){
        root = cJSON_Parse(data);
        char* ip_setup = cJSON_GetObjectItem(root,"ip")->valuestring;
        cJSON_AddStringToObject(root, "Topic", topic);
        char *rendered = cJSON_Print(root);   
        send_mesh(rendered);
        nvs_set_ip(ip_setup, &my_handle);
    }
}
void send_disconnect_msg(char* macID){    
    #if SEND_DISCONNECT
    if (esp_mesh_is_root()){
        for (int i = 0; i < lengthOfActiveNode; i++){
            if (strcmp(macID, activeNode[i].mac)==0){
                mqtt_app_publish("ESP-disconnect", activeNode[i].id);
            }
        }
    } else {
        uint8_t chipid[20];
        char mac_str[30];
        esp_efuse_mac_get_default(chipid);
        snprintf( mac_str, sizeof( mac_str ), ""MACSTR"", MAC2STR( chipid ) );
        cJSON *root;
        root = cJSON_CreateObject();
        cJSON_AddStringToObject(root, "Topic", "Disconnect-Mesh");
        cJSON_AddStringToObject(root, "MAC", macID);
        char *rendered = cJSON_Print(root);
        snprintf( (char*)tx_buf, TX_SIZE,  rendered ); 
        
        mesh_data_t data;
        data.data = tx_buf;
        data.size = strlen((char*)tx_buf) + 1;
        esp_err_t err = esp_mesh_send(NULL, &data, MESH_DATA_P2P, NULL, 0);
        if (err) 
        {   
            #if DEBUG 
                ESP_LOGI( TAG, "ERROR : Sending Disconnected Message!\r\n" ); 
            #endif
        } else {
            #if DEBUG 
                ESP_LOGI( TAG, "\r\nNON-ROOT sends (%s) (%s) to ROOT (%s)\r\n", mac_str, tx_buf, mac_address_root_str );                         
            #endif
        }
        
    } 
    #endif
}
bool send_connect_msg()
{   
    if (esp_mesh_is_root()){
        mqtt_app_publish("ESP-connect", NODE_ID);
        return true;
    } else {
    uint8_t chipid[20];
    char mac_str[30];
    esp_efuse_mac_get_default(chipid);
    snprintf( mac_str, sizeof( mac_str ), ""MACSTR"", MAC2STR( chipid ) );
    
    cJSON *root;
    root = cJSON_CreateObject();
    cJSON_AddStringToObject(root, "Topic", "Connect-Mesh");
    cJSON_AddStringToObject(root, "ID", NODE_ID);
    cJSON_AddStringToObject(root, "MAC", mac_str);
    char *rendered = cJSON_Print(root);
    snprintf( (char*)tx_buf, TX_SIZE,  rendered ); 
    
    mesh_data_t data;
    data.data = tx_buf;
    data.size = strlen((char*)tx_buf) + 1;
    esp_err_t err = esp_mesh_send(NULL, &data, MESH_DATA_P2P, NULL, 0);
    if (err) 
    {   return false;
        #if DEBUG 
            ESP_LOGI( TAG, "ERROR : Sending Connect Message!\r\n" ); 
        #endif
    } else {
        return true;
        #if DEBUG 
            ESP_LOGI( TAG, "\r\nNON-ROOT sends (%s) (%s) to ROOT (%s)\r\n", mac_str, tx_buf, mac_address_root_str );                         
        #endif
    }
    return false;
    }
}
/**
 * Button Manipulation Task
 */
void task_mesh_rx ( void *pvParameter )
{
    esp_err_t err;
    mesh_addr_t from;

    mesh_data_t data;
    data.data = rx_buf;
    data.size = RX_SIZE;

    char mac_address_str[30];
    int flag = 0;

    ESP_LOGI(TAG,"Rx start");

    for( ;; )
    {
        data.size = RX_SIZE;
        if( esp_mesh_is_root() )
        {   //Is it root node? Then turn on the led building
            led_on();      
        }
       /**
        * Waits for message reception
        */
        err = esp_mesh_recv( &from, &data, portMAX_DELAY, &flag, NULL, 0 );
        if( err != ESP_OK || !data.size ) 
        {
            #if DEBUG 
                ESP_LOGI( TAG, "err:0x%x, size:%d", err, data.size );
            #endif
            continue;
        }
        char myJson[100];
        snprintf(myJson, 100, (char*) data.data);
        
        cJSON *root = cJSON_Parse(myJson);
        char* topic = cJSON_GetObjectItem(root,"Topic")->valuestring;
        /**
         * Is it routed for ROOT Node?
         */
        if( esp_mesh_is_root() ) 
        {
            //**ROOT handle message
            if (strcmp(topic,"Send-Data")==0){
                char* nodeData = cJSON_GetObjectItem(root,"Data")->valuestring;
                // mqtt_app_publish("ESP-send", nodeData); 
                task_send_data(myJson);
                #if DEBUG
                ESP_LOGI(TAG, "NON-ROOT(MAC:%s)- Node %s: %s, ", mac_address_str, topic, nodeData);  

                #endif
            } else
            if (strcmp(topic,"Connect-Mesh")==0){
                char* id = cJSON_GetObjectItem(root,"ID")->valuestring;
                mqtt_app_publish("ESP-connect", id); 
                #if SEND_DISCONNECT
                char* mac = cJSON_GetObjectItem(root,"MAC")->valuestring;
                for (int i = 0; i <= lengthOfActiveNode; i++){
                    if (i == lengthOfActiveNode){
                        activeNode[lengthOfActiveNode].id = id;
                        activeNode[lengthOfActiveNode++].mac = mac;
                        break;}
                    if (lengthOfActiveNode != 0)
                        if (strcmp(mac,activeNode[i].mac)==0) {
                            activeNode[i].id = id;
                            break;}
                            // ESP_LOGI(TAG, "Active node HERE");   
                    // ESP_LOGI(TAG, "Active node%s",activeNode[i].mac);
                }
                #endif
                snprintf( mac_address_str, sizeof(mac_address_str), ""MACSTR"", MAC2STR(from.addr) );
                #if DEBUG
                ESP_LOGI(TAG, "NON-ROOT(MAC:%s)- Node %s: %s, ", mac_address_str, topic, id);  
                ESP_LOGI(TAG, "Tried to publish %s", id);  
                #endif               
            } else
            if (strcmp(topic,"Send-pin-layer")==0){
                char* ID = cJSON_GetObjectItem(root,"node")->valuestring;
                int voltage = cJSON_GetObjectItem(root,"pin")->valueint;
                int layer = cJSON_GetObjectItem(root,"layer")->valueint;  
                send_pincap_layer(voltage, layer, ID);
            }
            #if SEND_DISCONNECT
            else
            if (strcmp(topic,"Disconnect-Mesh")==0){
                char* macID = cJSON_GetObjectItem(root,"MAC")->valuestring;
                #if DEBUG
                ESP_LOGI(TAG, "NON-ROOT(MAC:%s)- Node %s: %s, ", mac_address_str, topic, macID);  
                ESP_LOGI(TAG, "Tried to publish %s", macID);  
                #endif
                send_disconnect_msg(macID);
            }
            #endif
            #if DEBUG 
                ESP_LOGI( TAG,"ROOT(MAC:%s) - Msg: %s, ", mac_address_root_str, data.data );
                ESP_LOGI( TAG, "send by NON-ROOT: %s\r\n", mac_address_str );
            #endif
        } 

        else 
        {   
            uint8_t mac_address[10];
            esp_efuse_mac_get_default( mac_address );
            snprintf( mac_address_str, sizeof( mac_address_str ), ""MACSTR"", MAC2STR( mac_address ) );
            if (strcmp(topic,"range")==0){
                *max_range_extern = cJSON_GetObjectItem(root,"range")->valueint;
                #if DEBUG 
                ESP_LOGI(TAG, "MQTT send %s", myJson);  
                #endif
            } else if (strcmp(topic,"check")==0){
                char *node =  cJSON_GetObjectItem(root,"node")->valuestring;
                if (strcmp(node, NODE_ID)==0){
                    while (!send_connect_msg())
                        vTaskDelay(200/portTICK_PERIOD_MS);
                }
            } else if (strcmp(topic,"ip")==0){
                char *ip_setup =  cJSON_GetObjectItem(root,"ip")->valuestring;
                nvs_set_ip(ip_setup, &my_handle);
            }
            #if DEBUG 
                ESP_LOGI( TAG, "NON-ROOT(MAC:%s)- Msg: %s, ", mac_address_str, (char*)data.data );  
                snprintf( mac_address_str, sizeof(mac_address_str), ""MACSTR"", MAC2STR(from.addr) );
                ESP_LOGI( TAG, "send by ROOT: %s\r\n", mac_address_str );
            #endif  
        }
        vTaskDelay( 5/portTICK_PERIOD_MS );   
    }
    vTaskDelete(NULL);
}
bool send_pincap_layer(int voltage, int layer, char* ID){
    char mac_str[30]; 
    esp_err_t err;
    mesh_data_t data;
    data.data = tx_buf;
    data.size = TX_SIZE;
    data.proto = MESH_PROTO_JSON;   

    cJSON *root;
    root=cJSON_CreateObject();
    cJSON_AddNumberToObject(root, "pin", voltage);
    cJSON_AddNumberToObject(root, "layer", layer);
    cJSON_AddStringToObject(root, "node", ID);
    if(esp_mesh_is_root()){ 
        char *rendered=cJSON_Print(root);       
        mqtt_app_publish("ESP-cap-layer", rendered); 
        return 1;
    } else {
        cJSON_AddStringToObject(root, "Topic", "Send-pin-layer");
        char *rendered=cJSON_Print(root);       
        snprintf( (char*)tx_buf, TX_SIZE,  rendered ); 
        data.size = strlen((char*)tx_buf) + 1;
        err = esp_mesh_send(NULL, &data, MESH_DATA_P2P, NULL, 0);   
        if (err) 
        {   
            #if DEBUG 
            ESP_LOGI( TAG, "ERROR : Sending Pin Cap Message!\r\n" );
            #endif       
            return 0;  
        } else {
                uint8_t chipid[20];
                esp_efuse_mac_get_default(chipid);
                snprintf( mac_str, sizeof( mac_str ), ""MACSTR"", MAC2STR( chipid ) );
                #if DEBUG 
                ESP_LOGI( TAG, "\r\nNON-ROOT sends (%s) (%s) to ROOT (%s)\r\n", mac_str, tx_buf, mac_address_root_str );      
                #endif        
                return 1;           
        }
        return 0;
    }
}
void task_send_bat_capacity_create(){
    
     if( xTaskCreate( task_send_bat_capacity, "task_send_bat_capacity", 1024 * 5, NULL, 1, NULL) != pdPASS )
        {
            #if DEBUG
            ESP_LOGI( TAG, "ERROR - task_mesh_rx NOT ALLOCATED :/\r\n" );  
            #endif
            return;   
        }
}
void task_send_bat_capacity ( void *pvParameter )
{   
    esp_adc_cal_characterize(ADC_UNIT_2, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, 0, &adc1_chars);
    adc2_config_channel_atten(ADC2_CHANNEL_0, ADC_ATTEN_DB_11);
    uint32_t voltage;
    while (1) 
    {   
        int adc_value, adc = 0;
        for (int i = 0; i < 64; i++) {
        adc2_get_raw(ADC2_CHANNEL_0, ADC_WIDTH_BIT_DEFAULT, &adc_value);
        adc += adc_value;
        }
        adc = adc / 64;
        voltage = esp_adc_cal_raw_to_voltage(adc, &adc1_chars);
        // printf("Raw: %d, voltage: %d mV\n", adc*2, voltage*2);
        while (!send_pincap_layer(voltage*2, esp_mesh_get_layer(), NODE_ID)){
            vTaskDelay(5000/ portTICK_PERIOD_MS); 
        }
        vTaskDelay(300000/ portTICK_PERIOD_MS);    
    }
}

void task_app_create( void )
{   
    #if DEBUG
    ESP_LOGI( TAG, "task_app_create() called" );
    if( esp_mesh_is_root() )
    {     
        ESP_LOGI( TAG, "ROOT NODE\r\n");     
    }
    else
    {   
        ESP_LOGI( TAG, "CHILD NODE\r\n");         
    }
    #endif
    /**
     * Creates a Task to receive message;
     */
    if( xTaskCreatePinnedToCore( task_mesh_rx, "task_mesh_rx", 1024 * 5, NULL, 2, NULL, 0) != pdPASS )
    {
        #if DEBUG
        ESP_LOGI( TAG, "ERROR - task_mesh_rx NOT ALLOCATED :/\r\n" );  
        #endif
        return;   
    }
}
