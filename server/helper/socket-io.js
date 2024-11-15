const db = require('../controllers/controller')
module.exports = function (io, mqtt, activeNode, lightNode, startTime) {
    var nowNode = 0;
    io.on("connection", function (socket) {
        console.log("Socket connected")
        socket.emit("ESP-check-data", [...activeNode]);
        socket.on("disconnect", () => {
            console.log("Socket disconnected")
        })
        // socket.on('ESP-connect', (data) => {
        //     socket.userID = data;
        //     activeNode.add(data);
        //     console.log("ESP connected: ", socket.userID);
        //     io.sockets.emit('ESP-connect', data);
        // });
        // socket.on("ESP-connect", function (reason) {
        //     if (socket.userID) {
        //         activeNode.delete(socket.userID);
        //         console.log("ESP disconnect: " + socket.userID)
        //         io.emit('ESP-disconnect', socket.userID);
        //     }
        //     console.log("----------- " + reason + " -------------");
        // });
        socket.on('set-light-node', function (value) {
            lightNode.value = value
            console.log(lightNode)
        })
        socket.on("Set-range", function (value) {
            nowNode = value.node;
            mqtt.setRange(value);
            // console.log("io")
        });
        socket.on("Set-ip", function (ip) {
            // nowNode = value.node;
            mqtt.setIP(ip);
            // console.log("io")
        });
        socket.on("Check-esp", function (node) {
            nowNode = node;
            mqtt.checkEsp(node);
        });
        socket.on('AddTeam', data => {
            db.addTeam(data);
        })
        socket.on('DeleteTeam', data => {
            db.deleteTeam(data.name);
        })
        socket.on('GetTeam', () => {
            db.getTeam((teamList) => {
                // console.log(teamList);
                io.sockets.emit('ListTeam', teamList)
            });
        })
        socket.on("web-send-record", (data) => {
            console.log(data.team)
            db.addrecord(data);
        })
        socket.on("call-list", () => {
            db.getTeam((teamList) => {
                io.sockets.emit('update-leader-board', teamList)
            });
        })
        socket.on("record-team", async (data) => {
            await db.addrecordteam(data);
            await db.getTeam((teamList) => {
                io.sockets.emit('update-leader-board', teamList)
            });

        })
        socket.on("team-score-record", async (data) => {
            try {
                await db.addRecordScore(data);
                db.getScore(data, (scores) => {
                    io.sockets.emit('score-record', scores);
                });
                // console.log(data);
            } catch (error) {
                console.log(error);
            }
        })
        socket.on("get-team-score-record", () => {
            // db.getScore((scores)=>{
            //     io.sockets.emit('score-record',scores)
            // });
        });
        socket.on('Change-flow', (data) => {
            // console.log(data)
            db.addFlow(data);
        })
        socket.on('esp-send', (data) => {
            io.sockets.emit('esp-send', data)
            // console.log(data.id)
            // while (1){
            // var hrTime = process.hrtime()

            // console.log(Math.round((hrTime[0]-startTime[0]) * 100 + (hrTime[1]-startTime[1]) / 10000000))}
        })
        socket.on('start', () => {
            io.sockets.emit('start-res')
            console.log("start")
            mqtt.sendStartTraffic({ start: "all" })
        })
        socket.on('stop', () => {
            io.sockets.emit('stop-res')
        })
        socket.on('refresh', () => {
            io.sockets.emit('refresh-res')
        })
        socket.on('restart', () => {
            io.sockets.emit('restart-res')
        })
        socket.on('get-tick', () => {
            var hrTime = process.hrtime()
            io.sockets.emit('send-tick', Math.round((hrTime[0] - startTime[0]) * 100 + (hrTime[1] - startTime[1]) / 10000000));
        })
        socket.on('get-tick-setup', (data) => {
            var hrTime = process.hrtime()
            io.sockets.emit('send-tick-setup', { Data: data.id, Tick: (Math.round((hrTime[0] - startTime[0]) * 100 + (hrTime[1] - startTime[1]) / 10000000) - data.tick) });
        })
        socket.on('esp-send-1', (data) => {
            io.sockets.emit('esp-send-1', data)
            // console.log(data);
        })
        socket.on('esp-send-2', (data) => {
            io.sockets.emit('esp-send-2', data)
            // console.log(data);
        })
        socket.on('Change-team-web', (data) => {
            io.sockets.emit('Change-team-web', data)
        })
        socket.on("GetDual", () => {
            io.sockets.emit("GetDual");
        });

        socket.on('Change-team-side', (data) => {
            io.sockets.emit('Change-team-side', data)
        })
        socket.on('outline1', () => {
            io.sockets.emit('_outline1')
        })
        socket.on('outline2', () => {
            io.sockets.emit('_outline2')
        })
        socket.on('bonus1', () => {
            io.sockets.emit('_bonus1')
        })
        socket.on('bonus2', () => {
            io.sockets.emit('_bonus2')
        })
        socket.on('ignorecheckpoint1', (data) => {
            io.sockets.emit('_ignorecheckpoint1', data)
        })
        socket.on('ignorecheckpoint2', (data) => {
            io.sockets.emit('_ignorecheckpoint2', data)
        })
        socket.on('Connection-refresh', () => {
            mqtt.refreshConnection();
        })
        socket.on("set-light-time", (data) => {
            console.log(data)
            mqtt.setTrafficTime(data)
        })
        socket.on("Get-line", () => {
            db.getLine((lineList) => {
                io.sockets.emit('List-line', lineList)
                console.log("get line")
            });
        });
        socket.on("on_key", (data) => {
            io.sockets.emit('listen_key', data)
        });
    })
}