const aedes = require('aedes')({id: "ITCar_Broker"})
const server = require('net').createServer(aedes.handle)
const port = 1883;
// const ip = "192.168.1.147"
// const ip = "192.168.0.111"
const ip = "192.168.1.5";
// const ip = "localhost"
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