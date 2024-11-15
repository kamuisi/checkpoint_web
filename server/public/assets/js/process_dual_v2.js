var test = false;
var Socket_hostIP;
var Socket_port;
// $.getScript('./configClient/config.js', function () {
// 	Socket_hostIP = hostIP;
// 	Socket_port = port;
// });
var socket;
var startSignal = false;
var currentTeam = "team1";
var currentTeam1 = "team2";
var nextTeam = "";
var currentTurn = 1;
var maxTurn = 2;
var currentCheckpoint1 = 0;
var currentCheckpoint2 = 0;
var ignore_checkpoint1 = 0;
var ignore_checkpoint2 = 0;
var numCheckpointt1 = 0;
var numCheckpointt2 = 0;
var outline_flag_1 = false;
var outline_flag_2 = false;
var outline_time_Team1 = 0;
var outline_time_Team2 = 0;
var timeTeam1 = 0;
var timeTeam2 = 0;
var score_team1 = 0;
var score_team2 = 0;
const Score_checkpoint = 10;
const score_bonus = 15;
var bonusteam1 = false;
var bonusteam2 = false;
var distanceTime = { minute: 0, second: 0, mil: 0 };

var startTick = 0;
var currentTick = 0;
var functionPoint = null;

var map = null;
var types = null;
var limitTime = 5;
var maxCheckPointsTeam = 5;
var maxCheckPointsTeam1 = 5;
var maxCheckPointsTeam2 = 5;
var team1nstop = false;
var team2nstop = false;
var startTime = new Date().getTime();
// var state = true;
var delay = null;
var timeDelay = 0;
var startDelay = 0;

$.when(
    $.getScript('./configClient/config.js', function () {
        Socket_hostIP = hostIP;
        Socket_port = port;
    })).done(function () {
        // socket = io.connect('http://192.168.0.101:3001', { transports : ['websocket'] });
        socket = io.connect('http://' + Socket_hostIP + ':' + Socket_port, { transports: ['websocket'] });
        $(document).ready(function () {
            const nums = document.querySelectorAll(".nums span");
            const counter = document.querySelector(".counter");
            const finalMessage = document.querySelector(".final");
            const sound_start = document.getElementById("start_sound");
            const sound_car = document.getElementById("car_start_sound");
            const sound_eli = document.getElementById("eli_sound");
            const sound_congra = document.getElementById("congra_sound");

            // console.log(sound_start);
            /* tam thoi hide trang index */
            $("#main").hide();
            $('#win1').css({ 'display': 'none' });
            $('#win2').css({ 'display': 'none' });
            /* mac dinh chua co gi */
            $("#turn").html("Lượt " + currentTurn);
            resetAllCheckpoint();
            resetAllTimeDisplay();
            resetBonus();
            $("#team1").css({ 'display': 'none' });
            $("#team2").css({ 'display': 'none' })
            $("#team1").html("OUT TURN");
            $("#team2").html("OUT TURN");
            /* cap nhat ten doi moi */
            $("#nameofteam").html(currentTeam);
            $("#nameofteam-1").html(currentTeam1);
            document.getElementById("timerCount").innerHTML =
                "00" + ":" + "00" + ":" + "00";

            $("#btnStartStop").on("click", "#start", function () {
                socket.emit("start");
            });
            // code nay outline 2 lan la cook
            // class AsyncQueue { // tao queue de xu ly critical section 
            //     constructor() {
            //         this.queue = Promise.resolve();
            //     }

            //     async enqueue(task) {
            //         const result = this.queue.then(() => task());
            //         this.queue = result.catch(() => { });
            //         return result;
            //     }
            // }
            // const queue = new AsyncQueue();

            socket.on("start-res", () => {
                sound_car.play();
                // setTimeout(() => {sound_start.play();}, 0)
                sound_start.play();
                Start(() => {
                    setTimeout(() => {
                        $("#myModal").modal("hide");
                        if (startSignal != true) {
                            startSignal = true;
                            clearInterval(delay);
                            //open gate
                            //socket.emit("control-sign", {node: map[0].node, sign: '1'}); //open gate
                            socket.emit("control-sign", { node: "10", sign: "1" }); //open gate
                            socket.emit("control-sign", { node: "5", sign: "1" }); //open gate
                            socket.emit("Buzzer");
                            /* reset for new turn */
                            currentCheckpoint1 = 0;
                            currentCheckpoint2 = 0;
                            ignore_checkpoint1 = 0;
                            ignore_checkpoint2 = 0;
                            score_team1 = 0;
                            score_team2 = 0;
                            outline_time_Team1 = 0;
                            outline_time_Team2 = 0;
                            outline_flag_1 = false;
                            outline_flag_2 = false;
                            team1nstop = false;
                            team2nstop = false;
                            $("#start").removeClass("btn-success").addClass("btn-danger");
                            $("#start").html("DỪNG");
                            $("#start").attr("id", "stop");
                            $("#restart").addClass("disabled");
                            document.getElementById("timer_team_1").hidden = true;
                            document.getElementById("timer_team_2").hidden = true;
                            console.log("start");
                            distanceTime.minute = 0;
                            distanceTime.second = 0;
                            distanceTime.mil = 0;
                            maxCheckPointsTeam1 = 5;
                            maxCheckPointsTeam2 = 5;
                            // if (state == true)

                            startTime = new Date().getTime();
                            socket.emit("get-tick");
                            intervalUpdateTime();
                        }
                    }, 4500);
                });
            });
            $("#btnStartStop").on("click", "#stop", function () {
                socket.emit("stop");
            });
            socket.on("stop-res", () => {
                startSignal = false;
                clearInterval(functionPoint);
                team1nstop = false;
                team2nstop = false;
                socket.emit("control-sign", { node: "10", sign: "2" });
                socket.emit("control-sign", { node: "5", sign: "2" });
                $("#stop").removeClass("btn-danger").addClass("btn-warning");
                $("#stop").html("LƯỢT KẾ");
                $("#stop").attr("id", "refresh");
                $("#restart").removeClass("disabled");
                document.getElementById("timer_team_1").hidden = true;
                document.getElementById("timer_team_2").hidden = true;
                console.log("stop");
            });
            $("#btnStartStop").on("click", "#refresh", function () {
                socket.emit("refresh");
            });
            socket.on("refresh-res", () => {
                // clearInterval(delay);
                // startDelay = 0;
                // timeDelay = 0;
                // startTime = new Date().getTime();
                currentCheckpoint1 = 0;
                currentCheckpoint2 = 0;
                ignore_checkpoint1 = 0;
                ignore_checkpoint2 = 0;
                timeTeam1 = 0;
                timeTeam2 = 0;
                score_team1 = 0;
                score_team2 = 0;
                outline_time_Team1 = 0;
                outline_time_Team2 = 0;
                outline_flag_1 = false;
                outline_flag_2 = false;
                team1nstop = false;
                team2nstop = false;
                distanceTime = { minute: 0, second: 0, mil: 0 };
                resetAllCheckpoint();
                resetAllTimeDisplay();
                resetBonus();
                document.getElementById("timerCount").innerHTML =
                    "00" + ":" + "00" + ":" + "00";
                if (currentTurn == maxTurn) {
                    $("#refresh").removeClass("btn-warning").addClass("btn-secondary");
                    $("#refresh").html("HẾT");
                    $("#refresh").addClass("disabled");
                } else {
                    $("#refresh").removeClass("btn-warning").addClass("btn-success");
                    $("#refresh").html("BẮT ĐẦU");
                    $("#refresh").attr("id", "start");
                    currentTurn = currentTurn + 1;
                    $("#turn").html("Lượt " + currentTurn);
                }
                $("#team1").css({ display: "none" });
                $("#team2").css({ display: "none" });
                $('#win1').css({ 'display': 'none' });
                $('#win2').css({ 'display': 'none' });
                document.getElementById("timer_team_1").hidden = true;
                document.getElementById("timer_team_2").hidden = true;
                // $('#restart').addClass('disabled');
                console.log("refresh");
            });
            // Nhấn thi lại
            $("#restart").click(function () {
                socket.emit("restart");
            });
            socket.on("restart-res", () => {
                // clearInterval(delay);
                // startDelay = 0;
                // timeDelay = 0;
                numCheckpointt1 = 0;
                numCheckpointt2 = 0;
                currentCheckpoint1 = 0;
                currentCheckpoint2 = 0;
                ignore_checkpoint1 = 0;
                ignore_checkpoint2 = 0;
                timeTeam1 = 0;
                timeTeam2 = 0;
                score_team1 = 0;
                score_team2 = 0;
                outline_time_Team1 = 0;
                outline_time_Team2 = 0;
                outline_flag_1 = false;
                outline_flag_2 = false;
                team1nstop = false;
                team2nstop = false;
                distanceTime = { minute: 0, second: 0, mil: 0 };
                resetAllCheckpoint();
                resetAllTimeDisplay();
                resetBonus();
                document.getElementById("timerCount").innerHTML =
                    "00" + ":" + "00" + ":" + "00";
                $("#refresh").removeClass("disabled");
                $("#refresh").removeClass("btn-warning").addClass("btn-success");
                $("#refresh").removeClass("btn-secondary").addClass("btn-success");
                $("#refresh").html("BẮT ĐẦU");
                $("#refresh").attr("id", "start");
                $("#team1").css({ display: "none" });
                $("#team2").css({ display: "none" });
                $('#win1').css({ 'display': 'none' });
                $('#win2').css({ 'display': 'none' });
                document.getElementById("timer_team_1").hidden = true;
                document.getElementById("timer_team_2").hidden = true;
                currentTurn = 1;
                $("#turn").html("Lượt " + currentTurn);
                // $('#restart').addClass('disabled');
            });
            $(document).on("keypress", function (e) {
                if (e.which == 49) { // bat checkpoint
                    var timeTeam =
                        distanceTime.mil +
                        distanceTime.second * 100 +
                        distanceTime.minute * 60 * 100 +
                        startTick;
                    // if (!changeTeamSide)
                    socket.emit("esp-send-1", {
                        id: currentCheckpoint1 + 1,
                        tick: timeTeam,
                        arr: [5, false, 5, false]
                    });
                    // else
                    //   socket.emit("esp-send-2", {
                    //     id: currentCheckpoint1 + 1,
                    //     tick: timeTeam,
                    //   });
                }
                if (e.which == 50) { // bat checkpoint
                    // console.log("key 2:" + currentCheckpoint1);
                    var timeTeam =
                        distanceTime.mil +
                        distanceTime.second * 100 +
                        distanceTime.minute * 60 * 100 +
                        startTick;
                    // if (changeTeamSide)
                    //   socket.emit("esp-send-1", {
                    //     id: currentCheckpoint2 + 1,
                    //     tick: timeTeam,
                    //   });
                    // else
                    socket.emit("esp-send-2", {
                        id: currentCheckpoint2 + 1,
                        tick: timeTeam,
                        arr: [5, false, 5, false]
                    });
                }
                if (e.which == 52) {
                    socket.emit("ignorecheckpoint1");
                }
                if (e.which == 53) {
                    socket.emit("ignorecheckpoint2");
                }
                if (e.which == 55) { // tat checkpoint
                    if (!team1nstop) {
                        resetThisCheckpoint(1, currentCheckpoint1);
                        resetThisTimeDisplay(1, currentCheckpoint1);
                        if (currentCheckpoint1 >= 1) currentCheckpoint1 = currentCheckpoint1 - 1;
                    }
                }
                if (e.which == 56) { // tat checkpoint
                    if (!team2nstop) {
                        resetThisCheckpoint(2, currentCheckpoint2);
                        resetThisTimeDisplay(2, currentCheckpoint2);
                        if (currentCheckpoint2 >= 1) currentCheckpoint2 = currentCheckpoint2 - 1;
                    }
                }
                if (e.which == 51) {
                    socket.emit("bonus1");
                }
                if (e.which == 54) {
                    socket.emit("bonus2");
                }
                if (e.which == 57) {
                    socket.emit("outline1");
                }
                if (e.which == 42) {
                    socket.emit("outline2");
                }
                console.log(e.which);
            });

            socket.on("_bonus1", () => {
                // if (team1nstop && !outline_flag_1) { // outline 2 lan
                if (team1nstop) {
                    socket.emit("team-score-record", {
                        team_name: currentTeam,
                        cp: currentCheckpoint1 - ignore_checkpoint1,
                        time_finish: document.getElementById("timer_team_1").innerText.match(/(\d{2}:\d{2}:\d{2})/)[0],
                        score: score_team1 + score_bonus,
                        outline: outline_time_Team2
                    })
                    updateBonus(1);
                }
            })
            socket.on("_bonus2", () => {
                // if (team2nstop && !outline_flag_2) { // outline 2 lan
                if (team2nstop) {
                    socket.emit("team-score-record", {
                        team_name: currentTeam1,
                        cp: currentCheckpoint2 - ignore_checkpoint2,
                        time_finish: document.getElementById("timer_team_2").innerText.match(/(\d{2}:\d{2}:\d{2})/)[0],
                        score: score_team2 + score_bonus,
                        outline: outline_time_Team1
                    })
                    updateBonus(2);
                }
            })
            socket.on("_ignorecheckpoint1", () => {
                var timeTeam =
                    distanceTime.mil +
                    distanceTime.second * 100 +
                    distanceTime.minute * 60 * 100 +
                    startTick;
                ignore_checkpoint1 = ignore_checkpoint1 + 1;
                socket.emit("esp-send-1",
                    {
                        id: currentCheckpoint1 + 1,
                        tick: timeTeam,
                        ignore_flag: true
                    });
                //   clearTimeDisplay(currentCheckpoint1, 1);
                //   updateCheckpoint(currentCheckpoint1, 1);
                //   let a = $("#timecp" + currentCheckpoint1)
                //     .text()
                //     .split(":");
                //   timeTeam1 =
                //     /*parseInt(a[2]) + */ parseInt(a[1]) * 100 + parseInt(a[0]) * 60 * 100;
                //   console.log(a);
                //   console.log(timeTeam1);
            })
            socket.on("_ignorecheckpoint2", () => {
                var timeTeam =
                    distanceTime.mil +
                    distanceTime.second * 100 +
                    distanceTime.minute * 60 * 100 +
                    startTick;
                ignore_checkpoint2 = ignore_checkpoint2 + 1;
                socket.emit("esp-send-2",
                    {
                        id: currentCheckpoint2 + 1,
                        tick: timeTeam,
                        ignore_flag: true
                    });
                //     clearTimeDisplay(currentCheckpoint2, 2);
                //     updateCheckpoint(currentCheckpoint2, 2);
                //     let a = $("#timecp" + currentCheckpoint2 + "-1")
                //       .text()
                //       .split(":");
                //     timeTeam2 =
                //       /*parseInt(a[2]) + */ parseInt(a[1]) * 100 + parseInt(a[0]) * 60 * 100;
            });
            socket.on("_outline1", () => {
                // code nay outline 2 lan la cook
                // if (!outline_flag_1 && startSignal) {
                //     outline_time_Team1 = outline_time_Team1 + 1;
                //     if (!team1nstop) {
                //         sound_eli.play();
                //         team1nstop = true;
                //         outline_flag_1 = true;
                //         $("#team1").css({ display: "block" });
                //         document.getElementById("timer_team_1").hidden = false;
                //         queue.enqueue(async () => {
                //             if (team1nstop && team2nstop) {
                //                 startSignal = false;
                //                 clearInterval(functionPoint);
                //             }
                //         });
                //         socket.emit("team-score-record", {
                //             team_name: currentTeam,
                //             cp: currentCheckpoint1 - ignore_checkpoint1,
                //             time_finish: document.getElementById("timer_team_1").innerText.match(/(\d{2}:\d{2}:\d{2})/)[0],
                //             score: score_team1,
                //             outline: outline_time_Team1
                //         })
                //     }
                // }
                // else if (outline_flag_1 && outline_time_Team1 < 2) {
                //     document.getElementById("timer_team_1").hidden = true;
                //     $("#team1").css({ display: "none" });
                //     team1nstop = false;
                //     outline_flag_1 = false;
                //     queue.enqueue(async () => {
                //         if (!startSignal) {
                //             startSignal = true;
                //             intervalUpdateTime();
                //         }
                //     });
                // }
                if (startSignal) {
                    outline_flag_1 = !outline_flag_1;
                    if (outline_flag_1) {
                        sound_eli.play();
                        outline_time_Team1 = outline_time_Team1 + 1;
                        $("#team1").css({ display: "block" });
                    } 
                    else $("#team1").css({ display: "none" });
                }
            })
            socket.on("_outline2", () => {
                // code nay outline 2 lan la cook
                // if (!outline_flag_2 && startSignal) { 
                //     outline_time_Team2 = outline_time_Team2 + 1;
                //     if (!team2nstop) {
                //         sound_eli.play();
                //         team2nstop = true;
                //         outline_flag_2 = true;
                //         $("#team2").css({ display: "block" });
                //         document.getElementById("timer_team_2").hidden = false;
                //         queue.enqueue(async () => {
                //             if (team1nstop && team2nstop) {
                //                 startSignal = false;
                //                 clearInterval(functionPoint);
                //             }
                //         });
                //         socket.emit("team-score-record", {
                //             team_name: currentTeam1,
                //             cp: currentCheckpoint2 - ignore_checkpoint2,
                //             time_finish: document.getElementById("timer_team_2").innerText.match(/(\d{2}:\d{2}:\d{2})/)[0],
                //             score: score_team2,
                //             outline: outline_time_Team2
                //         })

                //     }
                // }
                // else if (outline_flag_2 && outline_time_Team2 < 2) {
                //     document.getElementById("timer_team_2").hidden = true;
                //     $("#team2").css({ display: "none" });
                //     team2nstop = false;
                //     outline_flag_2 = false;
                //     queue.enqueue(async () => {
                //         if (!startSignal) {
                //             startSignal = true;
                //             intervalUpdateTime();
                //         }
                //     });
                // }
                if (startSignal) {
                    outline_flag_2 = !outline_flag_2;
                    if (outline_flag_2) {
                        sound_eli.play();
                        outline_time_Team2 = outline_time_Team2 + 1;
                        $("#team2").css({ display: "block" });
                    } 
                    else $("#team2").css({ display: "none" });
                  }
            })
            socket.on("send-tick", (tick) => {
                startTick = tick;
                console.log(startTick);
            });
            socket.on("esp-send", (data) => {
                // console.log(data)
                const id = Number(data.Data);
                // console.log(id)
                // var hrTime = process.hrtime()
                // console.log(Math.round((hrTime[0]-startTime[0]) * 100 + (hrTime[1]-startTime[1]) / 10000000))
                // if (!changeTeamSide) {
                //     if ((id == Number(map[currentCheckpoint1 + 1 + team1nstop])
                //         || (types[id - 1] == "stop" && id == Number(map[currentCheckpoint1 + 2])))) {
                //         if (types[id - 1] == "stop" && id == Number(map[currentCheckpoint1 + 2])) {
                //             maxCheckPointsTeam1--
                //             team1nstop = true
                //         }
                //         socket.emit("esp-send-1", {
                //             id: currentCheckpoint1 + 1,
                //             tick: data.Tick,
                //             arr: [maxCheckPointsTeam1, team1nstop, maxCheckPointsTeam2, team2nstop]
                //         });
                //     } else if ((id == (currentCheckpoint2 + 1 + team2nstop <= 5 ? Number(map[currentCheckpoint2 + 1 + 5 + team2nstop]) : Number(map[currentCheckpoint2 + 1 - 5 + team2nstop]))
                //         || (types[id - 1] == "stop" && id == (currentCheckpoint2 + 2 <= 5 ? Number(map[currentCheckpoint2 + 2 + 5]) : Number(map[currentCheckpoint2 + 2 - 5]))))) {
                //         if (types[id - 1] == "stop" && id == (currentCheckpoint2 + 2 <= 5 ? Number(map[currentCheckpoint2 + 2 + 5]) : Number(map[currentCheckpoint2 + 2 - 5]))) {
                //             maxCheckPointsTeam2--
                //             team2nstop = true
                //         }
                //         socket.emit("esp-send-2", {
                //             id: currentCheckpoint2 + 1,
                //             tick: data.Tick,
                //             arr: [maxCheckPointsTeam1, team1nstop, maxCheckPointsTeam2, team2nstop]
                //         });
                //     }
                // } else {

                //     if ((id == (currentCheckpoint1 + 1 + team1nstop <= 5 ? Number(map[currentCheckpoint1 + 1 + 5 + team1nstop]) : Number(map[currentCheckpoint1 + 1 - 5 + team1nstop]))
                //         || (types[id - 1] == "stop" && id == (currentCheckpoint1 + 2 <= 5 ? Number(map[currentCheckpoint1 + 2 + 5]) : Number(map[currentCheckpoint1 + 2 - 5]))))) {
                //         if (types[id - 1] == "stop" && id == (currentCheckpoint1 + 2 <= 5 ? Number(map[currentCheckpoint1 + 2 + 5]) : Number(map[currentCheckpoint1 + 2 - 5]))) {
                //             maxCheckPointsTeam1--
                //             team1nstop = true
                //         }
                //         socket.emit("esp-send-1",
                //             {
                //                 id: currentCheckpoint1 + 1,
                //                 tick: data.Tick,
                //                 arr: [maxCheckPointsTeam1, team1nstop, maxCheckPointsTeam2, team2nstop]
                //             });
                //     } else if ((id == Number(map[currentCheckpoint2 + 1 + team2nstop])
                //         || (types[id - 1] == "stop" && id == Number(map[currentCheckpoint2 + 2])))) {
                //         if (types[id - 1] == "stop" && id == Number(map[currentCheckpoint2 + 2])) {
                //             maxCheckPointsTeam2--
                //             team2nstop = true
                //         }
                //         socket.emit("esp-send-2", {
                //             id: currentCheckpoint2 + 1,
                //             tick: data.Tick,
                //             arr: [maxCheckPointsTeam1, team1nstop, maxCheckPointsTeam2, team2nstop]
                //         });
                //     }
                // }
                if (id == currentCheckpoint1 + 1) {
                    socket.emit("esp-send-1",
                        {
                            id: currentCheckpoint1 + 1,
                            tick: data.Tick,
                            ignore_flag: false
                        });
                }
                if (id == currentCheckpoint2 + 6) {
                    socket.emit("esp-send-2",
                        {
                            id: currentCheckpoint2 + 1,
                            tick: data.Tick,
                            ignore_flag: false
                        });
                }
            });
            socket.on("esp-send-1", function (data) {
                console.log("node send esp: " + data.id); //du lieu esp gui
                console.log(data.tick);
                currentTick = data.tick;
                /* kiem tra tin hieu bat dau */
                if (startSignal && !team1nstop) {
                    //kiem tra xem gan den checkpoint cuoi hay chua?
                    // let currentCheckpointVal = currentCheckpoint1;
                    // if (currentCheckpointVal + 2 == maxCheckPoints) {
                    // 	socket.emit("end-point-signal");
                    // }
                    //xac nhan qua check point thanh cong
                    //cap nhat checkpoint moi
                    currentCheckpoint1 = currentCheckpoint1 + 1;
                    // currentCheckpointVal = currentCheckpoint1;
                    if (!data.ignore_flag) {
                        score_team1 = score_team1 + Score_checkpoint;
                    }
                    updateCheckpoint(currentCheckpoint1, 1, data.ignore_flag);
                    updateTimeDisplay(currentCheckpoint1, 1, data.ignore_flag);

                    //neu den duoc checkpoint cuoi cung => ngung tin gio + dung nhan du lieu tu node_mcu
                    console.log(currentCheckpoint1 + ":  " + maxCheckPointsTeam1 + ":  " + maxCheckPointsTeam2)
                    if (currentCheckpoint1 == maxCheckPointsTeam1 && maxCheckPointsTeam1 == maxCheckPointsTeam2 || currentCheckpoint1 == maxCheckPointsTeam) {
                        team1nstop = true;
                        document.getElementById("timer_team_1").hidden = false;
                        if (team1nstop && team2nstop) {
                            startSignal = false;
                            clearInterval(functionPoint);
                        }
                        socket.emit("team-score-record", {
                            team_name: currentTeam,
                            cp: currentCheckpoint1 - ignore_checkpoint1,
                            time_finish: document.getElementById("timer_team_1").innerText.match(/(\d{2}:\d{2}:\d{2})/)[0],
                            score: score_team1,
                            outline: outline_time_Team1
                        });
                    } else if (currentCheckpoint1 == maxCheckPointsTeam1 && maxCheckPointsTeam1 < maxCheckPointsTeam2)
                        // timeTeam1 = distanceTime.mil + distanceTime.second * 100 + distanceTime.minute * 60 * 100;
                        timeTeam1 = currentTick - startTick;
                    //gui ve server luu db
                    // socket.emit("web-send-record", {
                    //     team: currentTeam,
                    //     dualwith: currentTeam1,
                    //     turn: currentTurn,
                    //     time: timeTeam1,
                    //     cp: currentCheckpointVal - ignore_checkpoint1,
                    // });
                    //console.log("1a")
                }
            });
            socket.on("esp-send-2", function (data) {
                console.log("node send esp 2: " + data.id); //du lieu esp gui
                currentTick = data.tick;
                /* kiem tra tin hieu bat dau */
                if (startSignal && !team2nstop) {
                    //kiem tra xem gan den checkpoint cuoi hay chua?
                    // let currentCheckpointVal = currentCheckpoint2;
                    // if (currentCheckpointVal + 2 == maxCheckPoints2) {
                    //   socket.emit("end-point-signal");
                    // }
                    // currentCheckpoint1 = currentCheckpoint1 + 1;
                    // 		updateCheckpoint(currentCheckpoint1);
                    //xac nhan qua check point thanh cong
                    //cap nhat checkpoint moi
                    currentCheckpoint2 = currentCheckpoint2 + 1;
                    // currentCheckpointVal = currentCheckpoint2;
                    if (!data.ignore_flag) {
                        score_team2 = score_team2 + Score_checkpoint;
                    }
                    updateCheckpoint(currentCheckpoint2, 2, data.ignore_flag);
                    updateTimeDisplay(currentCheckpoint2, 2, data.ignore_flag);
                    //neu den duoc checkpoint cuoi cung => ngung tin gio + dung nhan du lieu tu node_mcu
                    if (currentCheckpoint2 == maxCheckPointsTeam2 && maxCheckPointsTeam1 == maxCheckPointsTeam2 || currentCheckpoint2 == maxCheckPointsTeam) {
                        team2nstop = true;
                        document.getElementById("timer_team_2").hidden = false;
                        if (team1nstop && team2nstop) {
                            startSignal = false;
                            clearInterval(functionPoint);
                        }
                        socket.emit("team-score-record", {
                            team_name: currentTeam1,
                            cp: currentCheckpoint2 - ignore_checkpoint2,
                            time_finish: document.getElementById("timer_team_2").innerText.match(/(\d{2}:\d{2}:\d{2})/)[0],
                            score: score_team2,
                            outline: outline_time_Team2
                        });
                    } else if (currentCheckpoint2 == maxCheckPointsTeam2 && maxCheckPointsTeam1 > maxCheckPointsTeam2)
                        timeTeam2 = currentTick - startTick;
                    //gui ve server luu db
                    // socket.emit("web-send-record", {
                    //     team: currentTeam1,
                    //     dualwith: currentTeam,
                    //     turn: currentTurn,
                    //     time: timeTeam2,
                    //     cp: currentCheckpointVal - ignore_checkpoint2,
                    // });
                }
            });

            function Start(callback) {
                $("#myModal").modal("show");
                resetDOM();
                runAnimation();
                callback();
            }

            function intervalUpdateTime() {
                functionPoint = setInterval(function () {
                    var now = new Date().getTime();

                    var distance = now - startTime;

                    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                    var mils = Math.floor(((distance % (1000 * 60)) / 10) % 100);

                    distanceTime.minute = minutes;
                    distanceTime.second = seconds;
                    distanceTime.mil = mils;
                    minutes = minutes >= 10 ? minutes : "0" + minutes;
                    seconds = seconds >= 10 ? seconds : "0" + seconds;
                    mils = mils >= 10 ? mils : "0" + mils;
                    document.getElementById("timerCount").innerHTML =
                        minutes + ":" + seconds + ":" + mils;
                    if (!team1nstop) {
                        document.getElementById("timer_team_1").innerHTML =
                            "Thời gian hoàn thành<br>" + minutes + ":" + seconds + ":" + mils;
                    }
                    if (!team2nstop) {
                        document.getElementById("timer_team_2").innerHTML =
                            "Thời gian hoàn thành<br>" + minutes + ":" + seconds + ":" + mils;
                    }
                    // 5 minutes
                    if (minutes >= limitTime && seconds >= 0) {
                        startSignal = false;
                        clearInterval(functionPoint);
                        team1nstop = true;
                        team2nstop = true;
                        document.getElementById("timer_team_1").hidden = false;
                        document.getElementById("timer_team_2").hidden = false;
                        socket.emit("team-score-record", {
                            team_name: currentTeam,
                            cp: currentCheckpoint1 - ignore_checkpoint1,
                            time_finish: document.getElementById("timer_team_1").innerText.match(/(\d{2}:\d{2}:\d{2})/)[0],
                            score: score_team1,
                            outline: outline_time_Team1
                        });
                        socket.emit("team-score-record", {
                            team_name: currentTeam1,
                            cp: currentCheckpoint2 - ignore_checkpoint2,
                            time_finish: document.getElementById("timer_team_2").innerText.match(/(\d{2}:\d{2}:\d{2})/)[0],
                            score: score_team2,
                            outline: outline_time_Team2
                        });
                    }
                }, 10);
            }

            function resetDOM() {
                counter.classList.remove("hide");
                finalMessage.classList.remove("show");

                nums.forEach((num) => {
                    num.classList.value = "";
                });

                nums[0].classList.add("in");
            }

            function runAnimation() {
                console.log(finalMessage);
                nums.forEach((num, idx) => {
                    const penultimate = nums.length - 1;
                    console.log(penultimate);
                    num.addEventListener("animationend", (e) => {
                        if (e.animationName === "goIn" && idx !== penultimate) {
                            num.classList.remove("in");
                            num.classList.add("out");
                        } else if (e.animationName === "goOut" && num.nextElementSibling) {
                            num.nextElementSibling.classList.add("in");
                        } else {
                            counter.classList.add("hide");
                            finalMessage.classList.add("show");
                        }
                    });
                });
            }

            function updateCheckpoint(number, team, ignore_flag) {
                let teamSel = team == 1 ? "" : "-1";
                if (ignore_flag) {
                    $("#checkpoint" + number + teamSel).css({
                        "background-color": "#ff0000",
                        "box-shadow":
                            "0 1px 18px 10px rgba(255, 0, 0, 0.219), 0 6px 20px 0  rgba(255, 0, 0, 0.219)",
                    });
                    return;
                }
                $("#checkpoint" + number + teamSel).css({
                    "background-color": "#7FFF00",
                    "box-shadow":
                        "0 1px 18px 10px rgba(127, 255, 0, 0.219), 0 6px 20px 0  rgba(127, 255, 0, 0.219)",
                });
            }

            function resetAllCheckpoint() {
                for (let i = 1; i <= 5; i++) {
                    $("#checkpoint" + i).css({
                        "background-color": "#bbb",
                        "box-shadow": "0 0px 0px 0px white, 0 0px 0px 0px white",
                    });
                    $("#checkpoint" + i + "-1").css({
                        "background-color": "#bbb",
                        "box-shadow": "0 0px 0px 0px white, 0 0px 0px 0px white",
                    });
                }
            }

            function resetThisCheckpoint(team, num_checkpoint) {
                let teamSel = team == 1 ? "" : "-1";
                $("#checkpoint" + num_checkpoint + teamSel).css({
                    "background-color": "#bbb",
                    "box-shadow": "0 0px 0px 0px white, 0 0px 0px 0px white",
                });
            }

            function updateTimeDisplay(number, team, ignore_flag) {
                if (ignore_flag) {
                    $("#timecp" + number + (team == 1 ? "" : "-1")).css({
                        color: "#8c8c8c",
                        "text-decoration": "line-through"
                    });
                    return;
                }
                var distanceTick = currentTick - startTick;
                console.log(distanceTick);
                if (distanceTick > 0) {
                    var tminutes = Math.floor(distanceTick / (100 * 60));
                    var tseconds = Math.floor((distanceTick / 100) % 60);
                    var tmils = Math.floor(distanceTick % 100);
                } else {
                    var tminutes = distanceTime.minute;
                    var tseconds = distanceTime.second;
                    var tmils = distanceTime.mil;
                }

                var minutes = tminutes >= 10 ? tminutes : "0" + tminutes;
                var seconds = tseconds >= 10 ? tseconds : "0" + tseconds;
                var mils = tmils >= 10 ? tmils : "0" + tmils;
                console.log(minutes + ":" + seconds + ":" + mils);
                // console.log('#timecp' + (team == 1 ? currentCheckpoint1 : currentCheckpoint2) + (team == 1 ? "" : "-1"));
                // if (!changeTeamSide) {

                $("#timecp" + number + (team == 1 ? "" : "-1")).text(
                    minutes + ":" + seconds + ":" + mils
                );
                $("#timecp" + number + (team == 1 ? "" : "-1")).css({ color: "#7FFF00" });
                // }
                // else {
                // 	console.log(team == 1 ? currentCheckpoint2 : currentCheckpoint1);
                // 	$('#timecp' + (team == 1 ? currentCheckpoint2 : currentCheckpoint1) + (team == 1 ? "" : "-1")).text(minutes + ":" + seconds + ":" + mils);
                // 	$('#timecp' + (team == 1 ? currentCheckpoint2 : currentCheckpoint1) + (team == 1 ? "" : "-1")).css({ 'color': '#7FFF00' });
                // }
            }

            function resetAllTimeDisplay() {
                for (let i = 1; i <= 5; i++) {
                    $("#timecp" + i).text("00:00:00");
                    $("#timecp" + i).css({
                        color: "white",
                        "text-decoration": "none"
                    });

                    $("#timecp" + i + "-1").text("00:00:00");
                    $("#timecp" + i + "-1").css({
                        color: "white",
                        "text-decoration": "none"
                    });
                }
            }

            function resetThisTimeDisplay(team, num_checkpoint) {
                let teamSel = team == 1 ? "" : "-1";
                $("#timecp" + num_checkpoint + teamSel).text("00:00:00");
                $("#timecp" + num_checkpoint + teamSel).css({
                    color: "white",
                    "text-decoration": "none"
                });
            }

            function updateBonus(team) {
                let teamSel = team == 1 ? "" : "-1";
                $("#bonus" + teamSel).css({
                    "background-color": "#ffff00",
                    "box-shadow":
                        "0 1px 18px 10px rgba(255, 255, 0, 0.219), 0 6px 20px 0  rgba(255, 255, 0, 0.219)",
                });
                $("#bonus_point" + teamSel).text(
                    score_bonus
                );
                $("#bonus_point" + teamSel).css({ color: "#ffff00" });
            }

            function resetBonus() {
                $("#bonus" + "").css({
                    "background-color": "#bbb",
                    "box-shadow": "0 0px 0px 0px white, 0 0px 0px 0px white",
                });
                $("#bonus_point" + "").text(
                    ""
                );
                $("#bonus_point" + "").css({ color: "white" });


                $("#bonus" + "-1").css({
                    "background-color": "#bbb",
                    "box-shadow": "0 0px 0px 0px white, 0 0px 0px 0px white",
                });
                $("#bonus_point" + "-1").text(
                    ""
                );
                $("#bonus_point" + "-1").css({ color: "white" });
            }

            socket.on("Change-team-web", function (data) {
                console.log(data);
                currentTeam = data.team1;
                currentTeam1 = data.team2;
                $("#nameofteam").html(currentTeam);
                $("#nameofteam-1").html(currentTeam1);
            });
            socket.emit("GetDual");

            socket.on("Change-team-side", function (data) {
                changeTeamSide = data;
            });
            socket.emit("Get-line");
            socket.on("List-line", (data) => {
                if (data.length != 0) {
                    types = data[0].type;
                    map = data[0].flow;
                    console.info(map);
                    console.info(types);
                }
            });
        });
    });


