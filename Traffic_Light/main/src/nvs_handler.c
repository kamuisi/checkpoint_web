#include "nvs_handler.h"

#include "sys_config.h"

#include "esp_log.h"
/**
 * FreeRTOS
 */
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
static const char *TAG = "nvs";
void nvs_init()
{
    esp_err_t ret = nvs_flash_init();
        if (ret == ESP_ERR_NVS_NO_FREE_PAGES) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
        #if DEBUG
        ESP_LOGI(TAG,"Init");
        #endif
        }
        #if DEBUG
        ESP_LOGI(TAG,"Init 2");
        #endif
        ESP_ERROR_CHECK(ret);
}
void nvs_delete_ssid_pass(void * arg)
{
    nvs_handle* my_handle = (nvs_handle*) arg;
    esp_err_t err = nvs_open("storage", NVS_READWRITE, my_handle);
    if (err != ESP_OK) {
        #if DEBUG
        ESP_LOGW(TAG, "Error (%s) opening NVS handle!\n", esp_err_to_name(err));
        #endif
    } else 
    {
        ESP_ERROR_CHECK(nvs_erase_key(*my_handle, "ssid"));
        ESP_ERROR_CHECK(nvs_erase_key(*my_handle, "password"));
        ESP_ERROR_CHECK(nvs_erase_key(*my_handle, "ip"));
        #if DEBUG
        ESP_LOGW(TAG, "Committing updates in NVS ... ");
        #endif
        err = nvs_commit(*my_handle);
        #if DEBUG
        printf((err != ESP_OK) ? "Failed!\n" : "Done\n");
        #endif
        // Close
        nvs_close(*my_handle);
    }
}
void nvs_save_ssid_pass(uint8_t* ssid, uint8_t* password, void * arg)
{
    nvs_handle* my_handle = (nvs_handle*) arg;
    esp_err_t err = nvs_open("storage", NVS_READWRITE, my_handle);
    if (err != ESP_OK) {
        #if DEBUG
        ESP_LOGW(TAG,"Error (%s) opening NVS handle!", esp_err_to_name(err));
        #endif
    } else {
        #if DEBUG
        ESP_LOGW(TAG,"Adding ssid and password to NVS ... ");
        #endif
        err = nvs_set_str(*my_handle, "ssid", (const char*)ssid);
        printf(TAG,(err != ESP_OK) ? "Add ssid to nvs failed!\n" : "Add ssid to nvs done\n");
        err = nvs_set_str(*my_handle, "password", (const char*)password);
        printf(TAG,(err != ESP_OK) ? "Add password to nvs failed!\n" : "Add password to nvs done\n");
        #if DEBUG
        ESP_LOGW(TAG,"Committing updates in NVS ... ");
        #endif
        err = nvs_commit(*my_handle);
        #if DEBUG
        printf((err != ESP_OK) ? "Commit failed!\n" : "Commit done\n");
        #endif
        // Close
        nvs_close(*my_handle);
    }
}
void nvs_set_ip(char * ip_set, void * arg)
{
    nvs_handle* my_handle = (nvs_handle*) arg;
    esp_err_t err = nvs_open("storage", NVS_READWRITE, my_handle);
    if (err != ESP_OK) {
        #if DEBUG
        ESP_LOGW(TAG,"Error (%s) opening NVS handle!", esp_err_to_name(err));
        #endif
    } else 
    {
        #if DEBUG
        ESP_LOGI(TAG,"Add ip ... ");
        #endif
        err = nvs_set_str(*my_handle, "ip", ip_set);
        printf(TAG,(err != ESP_OK) ? "Add ip to nvs failed!\n" : "Add ip to nvs done\n");
        #if DEBUG
        ESP_LOGI(TAG,"Committing updates in NVS ... ");
        #endif
        err = nvs_commit(*my_handle);
        #if DEBUG
        printf((err != ESP_OK) ? "Commit failed!\n" : "Commit done\n");
        #endif
        // Close
        nvs_close(*my_handle);
        vTaskDelay(1000/portTICK_PERIOD_MS);
        esp_restart();
    }
}

esp_err_t nvs_get_ssid_password(uint8_t* ssid, uint8_t* password, char* ip, void * arg)
{
    nvs_handle* my_handle = (nvs_handle*) arg;
    esp_err_t err = nvs_open("storage", NVS_READWRITE, my_handle);
    if (err != ESP_OK) {
        #if DEBUG
        ESP_LOGW(TAG, "Error (%s) opening NVS handle!", esp_err_to_name(err));
        #endif
        return err;
    } else {
        // Read ssid and password router from flash
        #if DEBUG
        ESP_LOGW(TAG,"Reading ssid and password from NVS ... ");
        #endif
        size_t required_size = 100;
        err = nvs_get_str(*my_handle, "ssid", (char *)ssid, &required_size);
        switch (err) {
        case ESP_OK:
            ESP_LOGW(TAG,"Ssid = %s", ssid);
            size_t required_size_pw = 100;
            nvs_get_str(*my_handle, "password", (char *)password, &required_size_pw);
            size_t required_size_ip = 100;
            if (ESP_OK != nvs_get_str(*my_handle, "ip", (char *)ip, &required_size_ip))
            {
                nvs_close(*my_handle);
                nvs_commit(*my_handle);
                nvs_set_ip(SERVER_IP, my_handle);
            }
            nvs_commit(*my_handle);
            #if DEBUG
            ESP_LOGW(TAG,"Password = %s", password);
            ESP_LOGW(TAG,"ip = %s", ip);
            #endif
            // Close nvs flash
            nvs_close(*my_handle);
            break;
        default :
            printf("Error (%s) reading!\n", esp_err_to_name(err));
        }
        return err;
    } 
}