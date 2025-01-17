var mqtt = require('mqtt');
// var config = require('../config/config')
const dotenv = require('dotenv');
dotenv.config({path: './config/config.env'});
var client = mqtt.connect('mqtt://' + process.env.hostIP + ":" + process.env.mqttport, {
    clientId: 'Server_Client',
    reconnectPeriod: 1000,
    keepalive: 300,
    clean: false,
});
module.exports = function (io, activeNode) {
    client.on('connect', function () {
        client.subscribe('ESP-send', {qos: 1});
        client.subscribe('ESP-cap-layer', {qos: 1});
        client.subscribe('ESP-connect', {qos: 1});
        client.subscribe('ESP-disconnect', {qos: 1});
    });

    client.on('message', function (topic, message) {
        switch (topic) {
            case 'ESP-send':
                console.log('Node send: '+ message.toString());
                io.sockets.emit('esp-send', message.toString());
                break;
            case 'ESP-connect':
                console.log("connect: " + message.toString());
                activeNode.add(message.toString());
                io.sockets.emit('ESP-connect', message.toString());
                break;
            case 'ESP-disconnect':
                let date_ob = new Date();
                // current date
                // adjust 0 before single digit date
                let date = ("0" + date_ob.getDate()).slice(-2);
                // current month
                let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
                // current year
                let year = date_ob.getFullYear();
                // current hours
                let hours = date_ob.getHours();
                // current minutes
                let minutes = date_ob.getMinutes();
                // current seconds
                let seconds = date_ob.getSeconds();
                console.log("disconnect: "+ message.toString() + " "+ year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
                activeNode.delete(message.toString());
                io.sockets.emit('ESP-disconnect', message.toString());
                break;
            case 'ESP-cap-layer':
                console.log(message.toString());
                io.sockets.emit('esp-cap-layer', message.toString());
                break;
        }
    });
    exports.startCrossLight = function(data) {
        client.publish('cross-light',JSON.stringify(data),{qos:1, retain: false})
        console.log("Cross light")
    }
    exports.setLight = function (data) {
        client.publish('light',JSON.stringify(data),{qos:1, retain: false})
    }
    exports.sendStartTraffic = function(data) {
        client.publish('light',JSON.stringify(data),{qos:1, retain: false})
    }
    exports.setTrafficTime = function (data) {
        client.publish('light-time',JSON.stringify(data),{qos:1, retain: false})
    }

    exports.setRange = function (data) {
        // console.log('Data Range: ', data);
        client.publish('range', JSON.stringify(data), {qos: 1, retain: false});
    }
    exports.setIP = function (data) {
        // console.log('Data Range: ', data);
        client.publish('ip', JSON.stringify(data), {qos: 1, retain: false});
    }
    exports.checkEsp = function (data) {
        console.log('Data Range: ', data);
        client.publish('check', JSON.stringify(data), {qos: 1, retain: false});
    }
    exports.refreshConnection = function () {
        activeNode.clear();
        client.publish('refresh','r', {qos: 1, retain: false});
    }
    return exports;
}
