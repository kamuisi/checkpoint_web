const aedes = require('aedes')({id: "ITCar_Broker"})
const server = require('net').createServer(aedes.handle)
const dotenv = require('dotenv');
dotenv.config({path: '../server/config/config.env'});

const port = process.env.mqttport;
const ip = process.env.hostIP;

server.listen(port, ip, function () {
  console.log('Server Mqtt started and listening on host', ip,' and port', port, '.')
})

// fired when a client connects
aedes.on('client', function (client) {
  console.log('Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
})

// fired when a client disconnects
aedes.on('clientDisconnect', function (client) {
  console.log('Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
})

// fired when a message is published
aedes.on('publish', async function (packet, client) {
  console.log('Client \x1b[31m' + (client ? client.id : 'BROKER_' + aedes.id) + '\x1b[0m has published', packet.payload.toString(), 'on', packet.topic, 'to broker', aedes.id)
})