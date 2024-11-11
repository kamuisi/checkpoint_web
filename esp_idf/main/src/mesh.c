/**
 * Lib C
 */
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
 * ESP hall;
 */

#include "esp_wifi.h"
#include "esp_system.h"

/**
 * Callback do WiFi e MQTT;
 */
#include "esp_event.h"

/**
 * Logs;
 */
#include "esp_log.h"

/**
 * Mesh Net;
 */
#include "esp_mesh.h"
#include "esp_mesh_internal.h"
#include "esp_mac.h"

/**
 * Lwip
 */
#include "lwip/err.h"
#include "lwip/sys.h"
#include <lwip/sockets.h>

/**
 * Drivers
 */
#include "nvs_handler.h"

#include "driver/gpio.h"

/**
 * Standard configurations loaded
 */
#include "sys_config.h"

/**
 * App;
 */
#include "app.h"

#include "mesh.h"

#include "mqtt.h"

#include "gpio_handler.h"

/**
* Json
*/
#include "cJSON.h"

/**
* Smart config
*/
#include "esp_wpa2.h"
#include "esp_netif.h"
#include "esp_smartconfig.h"

/**
 * Global defs
 */
static const char *TAG = "mesh";

/* Root mac address */
char mac_address_root_str[50];
/* Route Table */
mesh_addr_t route_table[CONFIG_MESH_ROUTE_TABLE_SIZE];
/* Mesh ID */
static const uint8_t MESH_ID[6] = { 0x77, 0x77, 0x77, 0x77, 0x77, 0x77 };
/* Parent address -not using- */
static mesh_addr_t mesh_parent_addr;
/* Node mesh layer */
static int mesh_layer = -1;
static esp_netif_t *sta_netif = NULL;
/* Mesh send connect flag */
static bool is_esp_mesh_sent_connect = false;

static bool is_esp_connect_wifi = false;

bool is_tick_be_get = false;
/* ssid and password */
uint8_t ssid[33] = { 0 };
uint8_t password[65] = { 0 };
/* ip server */
char ip[50];
/* tick for sync */
extern long long Tick;
/* nvs_handle */
nvs_handle my_handle;
/* number retry connect mesh */
int s_retry_num = 0;

/* Smart config */
EventGroupHandle_t s_wifi_event_group;
static const int CONNECTED_BIT = BIT0;
static const int ESPTOUCH_DONE_BIT = BIT1;
/* Is smart config ran? -not using- */
static bool smart_config = 0;

/* Wifi event handler */
static void wf_event_handler(void* arg, esp_event_base_t event_base,
                                int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        if (s_retry_num < 10) {
            esp_wifi_connect();
            s_retry_num++;
            ESP_LOGI(TAG, "retry to connect to the AP");
        } else {
            xEventGroupSetBits(s_wifi_event_group, WIFI_FAIL_BIT);
        }
        ESP_LOGI(TAG,"connect to the AP fail");
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "got ip:" IPSTR, IP2STR(&event->ip_info.ip));
        s_retry_num = 0;
        xEventGroupSetBits(s_wifi_event_group, WIFI_CONNECTED_BIT);
    }
}
/* Init wifi */
static void wifi_init_start(void)
{   
    s_wifi_event_group = xEventGroupCreate();
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    sta_netif = esp_netif_create_default_wifi_sta();
    assert(sta_netif);


    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK( esp_wifi_init(&cfg) );

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                                                        ESP_EVENT_ANY_ID,
                                                        &wf_event_handler,
                                                        NULL,
                                                        &instance_any_id));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                                                        IP_EVENT_STA_GOT_IP,
                                                        &wf_event_handler,
                                                        NULL,
                                                        &instance_got_ip));

    wifi_config_t wifi_config = {
        .sta = {
	     .threshold.authmode = WIFI_AUTH_WPA2_PSK,
            .pmf_cfg = {
                .capable = true,
                .required = false
            },
        },
    };
    memcpy((uint8_t *) &wifi_config.sta.ssid, ssid, strlen((char*)ssid));
    memcpy((uint8_t *) &wifi_config.sta.password, password, strlen((char*)password));
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA) );
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config) );
    ESP_ERROR_CHECK(esp_wifi_start());

    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
            WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
            pdFALSE,
            pdFALSE,
            portMAX_DELAY);

    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "connected to ap SSID:%s password:%s",
                 ssid, password);
        is_esp_connect_wifi = true;
    } else if (bits & WIFI_FAIL_BIT) {
        ESP_LOGI(TAG, "Failed to connect to SSID:%s, password:%s",
                 ssid, password);
    } else {
        ESP_LOGE(TAG, "UNEXPECTED EVENT");
    }

    /* The event will not be processed after unregister */
    ESP_ERROR_CHECK(esp_event_handler_instance_unregister(IP_EVENT, IP_EVENT_STA_GOT_IP, instance_got_ip));
    ESP_ERROR_CHECK(esp_event_handler_instance_unregister(WIFI_EVENT, ESP_EVENT_ANY_ID, instance_any_id));
    vEventGroupDelete(s_wifi_event_group);
}
/* Smart config event handler */
static void event_handler(void* arg, esp_event_base_t event_base,
                                int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        xTaskCreate(smartconfig_task, "smartconfig_task", 4096, NULL, 3, NULL);
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        esp_wifi_connect();
        xEventGroupClearBits(s_wifi_event_group, CONNECTED_BIT);
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        xEventGroupSetBits(s_wifi_event_group, CONNECTED_BIT);
    } else if (event_base == SC_EVENT && event_id == SC_EVENT_SCAN_DONE) {
        ESP_LOGW(TAG, "Scan done");
    } else if (event_base == SC_EVENT && event_id == SC_EVENT_FOUND_CHANNEL) {
        ESP_LOGW(TAG, "Found channel");
    } else if (event_base == SC_EVENT && event_id == SC_EVENT_GOT_SSID_PSWD) {
        smartconfig_event_got_ssid_pswd_t *evt = (smartconfig_event_got_ssid_pswd_t *)event_data;
        uint8_t rvd_data[33] = { 0 };
        memcpy(ssid, evt->ssid, sizeof(evt->ssid));
        memcpy(password, evt->password, sizeof(evt->password));
        #if DEBUG
        ESP_LOGW(TAG, "Got SSID and password");
        ESP_LOGW(TAG, "SSID:%s", ssid);
        ESP_LOGW(TAG, "PASSWORD:%s", password);
        #endif
        nvs_save_ssid_pass(ssid, password, &my_handle);
        ESP_ERROR_CHECK( esp_wifi_disconnect() );
        xEventGroupSetBits(s_wifi_event_group, ESPTOUCH_DONE_BIT);
    }
}
void wifi_mesh_start(void)
{   
    
    esp_err_t err = nvs_get_ssid_password(ssid, password, ip, &my_handle);
    switch (err) {
        case ESP_OK:
            wifi_init_start();  
            while (!is_esp_connect_wifi)
            {
                vTaskDelay( 50/portTICK_PERIOD_MS );
            }
            getStick();
            while (!is_tick_be_get)
            {
                vTaskDelay( 50/portTICK_PERIOD_MS );
            }
            esp_wifi_disconnect();
            mesh_app_start();
            break;
        case ESP_ERR_NVS_NOT_FOUND:
            #if DEBUG
            ESP_LOGW(TAG,"The ssid and password is not initialized yet! Run smart config.");
            #endif
            memset(ssid, 0, sizeof(ssid));
            ESP_ERROR_CHECK(esp_netif_init());
            s_wifi_event_group = xEventGroupCreate();
            ESP_ERROR_CHECK(esp_event_loop_create_default());
            sta_netif = esp_netif_create_default_wifi_sta();
            assert(sta_netif);

            wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
            ESP_ERROR_CHECK( esp_wifi_init(&cfg) );

            ESP_ERROR_CHECK( esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL) );
            ESP_ERROR_CHECK( esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, NULL) );
            ESP_ERROR_CHECK( esp_event_handler_register(SC_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL) );

            ESP_ERROR_CHECK( esp_wifi_set_mode(WIFI_MODE_STA) );
            ESP_ERROR_CHECK( esp_wifi_start() );
            break;
        default :
            printf("Error (%s) reading!\n", esp_err_to_name(err));
    }   
}


void smartconfig_task(void * parm)
{
    EventBits_t uxBits;
    ESP_ERROR_CHECK( esp_smartconfig_set_type(SC_TYPE_ESPTOUCH) );
    smartconfig_start_config_t cfg = SMARTCONFIG_START_CONFIG_DEFAULT();
    ESP_ERROR_CHECK( esp_smartconfig_start(&cfg) );
    while (1) {
        uxBits = xEventGroupWaitBits(s_wifi_event_group, CONNECTED_BIT | ESPTOUCH_DONE_BIT, true, false, portMAX_DELAY);
        if(uxBits & CONNECTED_BIT) {
            ESP_LOGI(TAG, "WiFi Connected to ap");
        }
        if(uxBits & ESPTOUCH_DONE_BIT) {
            ESP_LOGI(TAG, "smartconfig over");
            esp_smartconfig_stop();
            smart_config = 1;
            mesh_app_start();
            vTaskDelete(NULL);
        }
    }
}
/**
 * Calls reception thread to change messages
 */
void esp_mesh_rx_start( void )
{
    static bool is_esp_mesh_rx_started = false;
    if( !is_esp_mesh_rx_started )
    {
        is_esp_mesh_rx_started = true;
        task_app_create();
    }
}
/**
 * Callback function
 */
void mesh_event_handler(void *arg, esp_event_base_t event_base,
                        int32_t event_id, void *event_data)
{
    mesh_addr_t id = {0,};
    static uint8_t last_layer = 0;
    ESP_LOGD(TAG, "esp_event_handler:%ld", event_id);

    switch (event_id) {
    case MESH_EVENT_STARTED: {
        esp_mesh_get_id(&id);
        ESP_LOGI(TAG, "<MESH_EVENT_STARTED>ID:"MACSTR"", MAC2STR(id.addr));
        mesh_layer = esp_mesh_get_layer();
    }
    break;
    case MESH_EVENT_STOPPED: {
        ESP_LOGI(TAG, "<MESH_EVENT_STOPPED>");
        mesh_layer = esp_mesh_get_layer();
    }
    break;
    case MESH_EVENT_CHILD_CONNECTED: {
        mesh_event_child_connected_t *child_connected = (mesh_event_child_connected_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_CHILD_CONNECTED>aid:%d, "MACSTR"",
                 child_connected->aid,
                 MAC2STR(child_connected->mac));
    }
    break;
    case MESH_EVENT_CHILD_DISCONNECTED: {
        mesh_event_child_disconnected_t *child_disconnected = (mesh_event_child_disconnected_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_CHILD_DISCONNECTED>aid:%d, "MACSTR"",
                 child_disconnected->aid,
                 MAC2STR(child_disconnected->mac));
        char mac_id[20];
        snprintf( mac_id, sizeof( mac_id ), ""MACSTR"", MAC2STR( child_disconnected->mac ) );
        #if SEND_DISCONNECT
        send_disconnect_msg(mac_id);
        #endif
    }
    break;
    case MESH_EVENT_ROUTING_TABLE_ADD: {
        mesh_event_routing_table_change_t *routing_table = (mesh_event_routing_table_change_t *)event_data;
        ESP_LOGW(TAG, "<MESH_EVENT_ROUTING_TABLE_ADD>add %d, new:%d",
                 routing_table->rt_size_change,
                 routing_table->rt_size_new);
    }
    break;
    case MESH_EVENT_ROUTING_TABLE_REMOVE: {
        mesh_event_routing_table_change_t *routing_table = (mesh_event_routing_table_change_t *)event_data;
        ESP_LOGW(TAG, "<MESH_EVENT_ROUTING_TABLE_REMOVE>remove %d, new:%d",
                 routing_table->rt_size_change,
                 routing_table->rt_size_new);
    }
    break;
    case MESH_EVENT_NO_PARENT_FOUND: {
        mesh_event_no_parent_found_t *no_parent = (mesh_event_no_parent_found_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_NO_PARENT_FOUND>scan times:%d",
                 no_parent->scan_times);
    }
    /* TODO handler for the failure */
    break;
    case MESH_EVENT_PARENT_CONNECTED: {
        mesh_event_connected_t *connected = (mesh_event_connected_t *)event_data;
        esp_mesh_get_id(&id);
        mesh_layer = connected->self_layer;
        memcpy(&mesh_parent_addr.addr, connected->connected.bssid, 6);
        ESP_LOGI(TAG,
                 "<MESH_EVENT_PARENT_CONNECTED>layer:%d-->%d, parent:"MACSTR"%s, ID:"MACSTR"",
                 last_layer, mesh_layer, MAC2STR(mesh_parent_addr.addr),
                 esp_mesh_is_root() ? "<ROOT>" :
                 (mesh_layer == 2) ? "<layer2>" : "", MAC2STR(id.addr));
        last_layer = mesh_layer;
        if (esp_mesh_is_root()) 
        {
            /**
             * FIXED IP?
             */
            #if !FIXED_IP
                esp_netif_dhcpc_start(sta_netif);
            #endif
        }
        /**
         * Initialize the message reception thread 
         */
        esp_mesh_rx_start();
        stop_blink_led();
        if (!esp_mesh_is_root())
        if (!is_esp_mesh_sent_connect){
            while (!send_connect_msg()){
                    vTaskDelay( 200/portTICK_PERIOD_MS);
            }
            is_esp_mesh_sent_connect = true;
        }
        esp_mesh_set_self_organized(0, 0);
    }
    break;
    
    /**
     * Parent desconnection event
     */
    case MESH_EVENT_PARENT_DISCONNECTED: {
        mesh_event_disconnected_t *disconnected = (mesh_event_disconnected_t *)event_data;
        ESP_LOGI(TAG,
                 "<MESH_EVENT_PARENT_DISCONNECTED>reason:%d",
                 disconnected->reason);
        mesh_layer = esp_mesh_get_layer();
        esp_mesh_set_self_organized(1, 1);
        blink_led();
    }
    break;

    /**
     * Layer change event
     */
    case MESH_EVENT_LAYER_CHANGE: {
        mesh_event_layer_change_t *layer_change = (mesh_event_layer_change_t *)event_data;
        mesh_layer = layer_change->new_layer;
        ESP_LOGI(TAG, "<MESH_EVENT_LAYER_CHANGE>layer:%d-->%d%s", 
                 last_layer, mesh_layer,
                 esp_mesh_is_root() ? "<ROOT>" :
                 (mesh_layer == 2) ? "<layer2>" : "");
        last_layer = mesh_layer;
    }
    break;
    /**
     * Root address event
     */
    case MESH_EVENT_ROOT_ADDRESS: {
        mesh_event_root_address_t *root_addr = (mesh_event_root_address_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_ROOT_ADDRESS>root address:"MACSTR"",
                 MAC2STR(root_addr->addr));
        /**
         * Storage ROOT Address event
         */
        if(esp_mesh_is_root()) 
        {       
          
            uint8_t chipid[20];
            esp_efuse_mac_get_default( chipid );
            snprintf( mac_address_root_str, sizeof( mac_address_root_str ), ""MACSTR"", MAC2STR( chipid ) );
        }
        
    }
    break;
    /**
     * Init vote routine event
     */
    case MESH_EVENT_VOTE_STARTED: {
        mesh_event_vote_started_t *vote_started = (mesh_event_vote_started_t *)event_data;
        ESP_LOGI(TAG,
                 "<MESH_EVENT_VOTE_STARTED>attempts:%d, reason:%d, rc_addr:"MACSTR"",
                 vote_started->attempts,
                 vote_started->reason,
                 MAC2STR(vote_started->rc_addr.addr));
    }
    break;
    case MESH_EVENT_VOTE_STOPPED: {
        ESP_LOGI(TAG, "<MESH_EVENT_VOTE_STOPPED>");
    break;
    }
    /**
     * Software forced request for root exchange 
     */
    case MESH_EVENT_ROOT_SWITCH_REQ: {
        mesh_event_root_switch_req_t *switch_req = (mesh_event_root_switch_req_t *)event_data;
        ESP_LOGI(TAG,
                 "<MESH_EVENT_ROOT_SWITCH_REQ>reason:%d, rc_addr:"MACSTR"",
                 switch_req->reason,
                 MAC2STR( switch_req->rc_addr.addr));
    }
    break;
    /**
     * Callback acknowledgemnts
     */
    case MESH_EVENT_ROOT_SWITCH_ACK: {
        /* new root */
        mesh_layer = esp_mesh_get_layer();
        esp_mesh_get_parent_bssid(&mesh_parent_addr);
        ESP_LOGI(TAG, "<MESH_EVENT_ROOT_SWITCH_ACK>layer:%d, parent:"MACSTR"", mesh_layer, MAC2STR(mesh_parent_addr.addr));
    }
    break;
    /**
     * Messages sent by root can be addressed to an external IP.
     * When we use this mesh stack feature, this event will be used
     * in notification of states (toDS - for DS (distribute system))
     */
    case MESH_EVENT_TODS_STATE: {
        mesh_event_toDS_state_t *toDs_state = (mesh_event_toDS_state_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_TODS_REACHABLE>state:%d", *toDs_state);
    }
    break;
    /**
     * MESH_EVENT_ROOT_FIXED forces the child device to maintain the same settings as the
     * parent device on the mesh network; 
     */
    case MESH_EVENT_ROOT_FIXED: {
        mesh_event_root_fixed_t *root_fixed = (mesh_event_root_fixed_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_ROOT_FIXED>%s",
                 root_fixed->is_fixed ? "fixed" : "not fixed");
    }
    break;
    /**
     * Event called when there is another and best possible candidate to be root of the network; 
     * The current root passes control to the new root to take over the network;
     */
    case MESH_EVENT_ROOT_ASKED_YIELD: {
        mesh_event_root_conflict_t *root_conflict = (mesh_event_root_conflict_t *)event_data;
        ESP_LOGI(TAG,
                 "<MESH_EVENT_ROOT_ASKED_YIELD>"MACSTR", rssi:%d, capacity:%d",
                 MAC2STR(root_conflict->addr),
                 root_conflict->rssi,
                 root_conflict->capacity);
    }
    break;
    /**
     * Channel switch event
     */
    case MESH_EVENT_CHANNEL_SWITCH: {
        mesh_event_channel_switch_t *channel_switch = (mesh_event_channel_switch_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_CHANNEL_SWITCH>new channel:%d", channel_switch->channel);
    }
    break;
    case MESH_EVENT_SCAN_DONE: {
        mesh_event_scan_done_t *scan_done = (mesh_event_scan_done_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_SCAN_DONE>number:%d",
                 scan_done->number);
    }
    break;
    case MESH_EVENT_NETWORK_STATE: {
        mesh_event_network_state_t *network_state = (mesh_event_network_state_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_NETWORK_STATE>is_rootless:%d",
                 network_state->is_rootless);
    }
    break;
    /**
     * Event called when the root device stops connecting to the router and
     * the child device stops connecting to the parent device;
     */
    case MESH_EVENT_STOP_RECONNECTION: {
        ESP_LOGI(TAG, "<MESH_EVENT_STOP_RECONNECTION>");
    }
    break;
    /**
     * Event called when the device encounters a mesh network to be paired
     */
    case MESH_EVENT_FIND_NETWORK: {
        mesh_event_find_network_t *find_network = (mesh_event_find_network_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_FIND_NETWORK>new channel:%d, router BSSID:"MACSTR"",
                 find_network->channel, MAC2STR(find_network->router_bssid));
    }
    break;
    /**
     * Event called when the device finds and exchanges for another router 
     * (linksys, dlink ...) with the same SSID;
     */
    case MESH_EVENT_ROUTER_SWITCH: {
        mesh_event_router_switch_t *router_switch = (mesh_event_router_switch_t *)event_data;
        ESP_LOGI(TAG, "<MESH_EVENT_ROUTER_SWITCH>new router:%s, channel:%d, "MACSTR"",
                 router_switch->ssid, router_switch->channel, MAC2STR(router_switch->bssid));
    }
    break;
    default:
        ESP_LOGI(TAG, "unknown id:%ld", event_id);
        break;
    }
}

void ip_event_handler(void *arg, esp_event_base_t event_base,
                      int32_t event_id, void *event_data)
{
    ip_event_got_ip_t *event = (ip_event_got_ip_t *) event_data;
    ESP_LOGI(TAG, "<IP_EVENT_STA_GOT_IP>IP:" IPSTR, IP2STR(&event->ip_info.ip));
#if !CONFIG_MESH_USE_GLOBAL_DNS_IP
    esp_netif_t *netif = event->esp_netif;
    esp_netif_dns_info_t dns;
    ESP_ERROR_CHECK(esp_netif_get_dns_info(netif, ESP_NETIF_DNS_MAIN, &dns));
#endif
    if (esp_mesh_is_root()) {
                            mqtt_app_start();
                            vTaskDelay( 1000/portTICK_PERIOD_MS);
                            send_connect_msg();
                        } 
}

/**
 * Mesh stack init
 */
void mesh_app_start( void )
{
    /*  tcpip stack init */
    esp_netif_init();
    // ESP_ERROR_CHECK(esp_netif_init());
    /* for mesh
     * stop DHCP server on softAP interface by default
     * stop DHCP client on station interface by default
     * */
    ESP_ERROR_CHECK(esp_netif_dhcpc_start(sta_netif));
    ESP_ERROR_CHECK(esp_netif_dhcpc_stop(sta_netif));

#if FIXED_IP
    /**
     * The ESP32 ROOT of the Mesh network is one that receives the IP address of the Router;
     * Do you want to work with the fixed IP address on the network? 
     * That is, you want to configure; ROOT with Static IP?
     */
    tcpip_adapter_ip_info_t sta_ip;
    sta_ip.ip.addr = ipaddr_addr( IP_ADDRESS );
    sta_ip.gw.addr = ipaddr_addr( GATEWAY_ADDRESS );
    sta_ip.netmask.addr = ipaddr_addr( NETMASK_ADDRESS );
    tcpip_adapter_set_ip_info(WIFI_IF_STA, &sta_ip);
#endif

    /**
     * WiFi Init
     */
    // if (!smart_config)
    // ESP_ERROR_CHECK(esp_event_loop_create_default());
    wifi_init_config_t config = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK( esp_wifi_init( &config ) );
    ESP_ERROR_CHECK( esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &ip_event_handler, NULL));
    ESP_ERROR_CHECK( esp_wifi_set_storage( WIFI_STORAGE_FLASH ) );
    ESP_ERROR_CHECK( esp_wifi_start() );

    /**
     * Mesh init
     */
    ESP_ERROR_CHECK( esp_mesh_init() );
    ESP_ERROR_CHECK( esp_mesh_set_max_layer( CONFIG_MESH_MAX_LAYER ));
    ESP_ERROR_CHECK( esp_mesh_set_vote_percentage(1) );
    // ESP_ERROR_CHECK( esp_mesh_set_ap_assoc_expire(30) );
    /* Enable mesh PS function */
    ESP_ERROR_CHECK(esp_mesh_enable_ps());
    /* better to increase the associate expired time, if a small duty cycle is set. */
    ESP_ERROR_CHECK(esp_mesh_set_ap_assoc_expire(60));
    /* better to increase the announce interval to avoid too much management traffic, if a small duty cycle is set. */
    ESP_ERROR_CHECK(esp_mesh_set_announce_interval(600, 3300));

    mesh_cfg_t cfg = MESH_INIT_CONFIG_DEFAULT();
    
    /**
     * Register the Mesh network ID. All non-root who wish to participate 
     * in this mesh network must have the same ID and the login and password  
     * to access the network (informed further down in the code);
     */
    memcpy((uint8_t *) &cfg.mesh_id, MESH_ID, 6);
    
    /**
     * Registers the callback function of the Mesh network;
     * The callback function is responsible for signaling to you, the user
     * the states of the internal operations of the Mesh network;
     */
    /**
     * Define channel frequency
     */
    cfg.channel = CONFIG_MESH_CHANNEL;

    /**
     * Defines the ssid and password that will be used for communication between nodes
     * Mesh network; This SSID and PASSWORD is that of YOUR ROUTER FROM YOUR HOME or COMPANY;
     */
    cfg.router.ssid_len = strlen((char*)ssid);
    memcpy((uint8_t *) &cfg.router.ssid, ssid, cfg.router.ssid_len);
    memcpy((uint8_t *) &cfg.router.password, password, strlen((char*)password));

    /**
     * The Mesh network requires authentication and will be configured as an access point;
     */
    ESP_ERROR_CHECK(esp_mesh_set_ap_authmode(CONFIG_MESH_AP_AUTHMODE));

    /**
     * Defines the maximum number of non-root (node) in each node of the network;
     * If 'max_connection' is equal to 1, then only one node per layer will be allowed;
     * Example: 3x ESP32 would be: A (root) -> B (non-root) -> C (non-root); So there would be
     * 3 layers the Mesh network;
     */
    cfg.mesh_ap.max_connection = CONFIG_MESH_AP_CONNECTIONS;

    /**
     * SSID and Password for network access BETWEEN Mesh network nodes;
     * This SSID and PASSWORD is used only by devices on the network;
     */
    memcpy((uint8_t *) &cfg.mesh_ap.password, CONFIG_MESH_AP_PASSWD, strlen(CONFIG_MESH_AP_PASSWD));
    ESP_ERROR_CHECK(esp_mesh_set_config(&cfg));
    ESP_ERROR_CHECK(esp_event_handler_register(MESH_EVENT, ESP_EVENT_ANY_ID, &mesh_event_handler, NULL));
    /**
     * Mesh start;
     */
    ESP_ERROR_CHECK(esp_mesh_start());
}
