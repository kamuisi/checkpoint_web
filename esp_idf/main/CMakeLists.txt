idf_component_register(SRCS "main.cpp" "src/app.c" "src/mesh.c" "src/mqtt.c" "components/i2c.cpp" "components/vl53l0x.cpp" "src/vl53l0x_handler.cpp" "src/gpio_handler.c" "src/nvs_handler.c"
                    INCLUDE_DIRS "." "inc" "components")
