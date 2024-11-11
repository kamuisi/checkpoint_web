var test = false;
var Socket_hostIP;
var Socket_port;
var socket;
var startSignal = false;
var currentTeam = "team1";
var currentTeam1 = "team2";
var nextTeam = "";
var currentTurn = 1;
var maxTurn = 10;
var currentCheckpoint1 = 0;
var currentCheckpoint2 = 0;
var currentTurnTeam = [1,1,1,1]
let currentCheckpoint = [1,-1,-1,-1]
var numCheckpointt1 = 0;
var numCheckpointt2 = 0;
var outlineTeam1 = false;
var outlineTeam2 = false;
var timeTeam1 = 0;
var timeTeam2 = 0;
var resultTeam1 = 0;
var resultTeam2 = 0;
var distanceTime = { minute: 0, second: 0, mil: 0 };

var changeTeamSide = false;
var startTick = 0;
var currentTick = 0;
var functionPoint = null;

var map = null;
var types = null;
var limitTime = 5;
var maxCheckPointsTeam = 5;
var maxCheckPointsTeam1 = 5;
var maxCheckPointsTeam2 = 5;
var team1nstop = 0;
var team2nstop = 0;
var startTime = new Date().getTime();
// var state = true;
var delay = null;
var timeDelay = 0;
var startDelay = 0;
let teamScore = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
let teamName = ["LTK", "NhwngtenLieu", "UTE_AIS", "FPTU_AI"]
var boardActive = 4;
$.when(
$.getScript('./configClient/config.js',function(){
    Socket_hostIP = hostIP;
    Socket_port = port;
})).done(function(){
  socket = io.connect('http://' + Socket_hostIP + ':' + Socket_port, { transports : ['websocket'] });
  // socket = io.connect('http://192.168.0.101:3001', { transports : ['websocket'] });
  $(document).ready(function () {
    const nums = document.querySelectorAll(".nums span");
    const counter = document.querySelector(".counter");
    const finalMessage = document.querySelector(".final");
    const sound_start = document.getElementById("start_sound");
    const sound_car = document.getElementById("car_start_sound");
    const sound_eli = document.getElementById("eli_sound");
    const sound_congra = document.getElementById("congra_sound");
    const sound_pass = document.getElementById('checkpoint_passed')
    // console.log(sound_start);
    /* tam thoi hide trang index */
    $("#main").hide();
    $('#win1').css({ 'display': 'none' });
    $('#win2').css({ 'display': 'none' });
    /* mac dinh chua co gi */
    // $("#turn").html("Lượt " + currentTurn);
    // updateTimeDisplay(currentCheckpoint1, 1);
    // updateTimeDisplay(currentCheckpoint2, 2);
    // $("#team1").css({ 'display': 'none' });
    // $("#team2").css({ 'display': 'none' })
    // $("#team1").html("OUT TURN");
    // $("#team2").html("OUT TURN");
    /* cap nhat ten doi moi */
    
    $("#nameofteam-0").html(teamName[0]);
    $("#nameofteam-1").html(teamName[1]);
    $("#nameofteam-2").html(teamName[2]);
    $("#nameofteam-3").html(teamName[3]);

    document.getElementById("timerCount").innerHTML =
      "00" + ":" + "00" + ":" + "00";
  
    socket.on("start-res", ( ) => {
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
            // socket.emit("control-sign", { node: "10", sign: "1" }); //open gate
            // socket.emit("control-sign", { node: "5", sign: "1" }); //open gate
            // socket.emit("Buzzer");
            /* reset for new turn */
            currentCheckpoint1 = 0;
            $("#start").removeClass("btn-success").addClass("btn-danger");
            $("#start").html("DỪNG");
            $("#start").attr("id", "stop");
            $("#restart").addClass("disabled");
            // console.log("start");
            distanceTime.minute = 0;
            distanceTime.second = 0;
            distanceTime.mil = 0;
            // maxCheckPointsTeam1 = 5;
            // maxCheckPointsTeam2 = 5;
            // team1nstop = false;
            // team2nstop = false;
            // if (state == true)
  
            startTime = new Date().getTime();
            socket.emit("get-tick");
            intervalUpdateTime();
          }
        }, 4500);
      });
    });
    socket.on("stop-res", () => {
      startSignal = false;
      clearInterval(functionPoint);
      //close gate
      //socket.emit("control-sign", {node: map[0].node, sign: '2'});
      // socket.emit("control-sign", { node: "10", sign: "2" });
      // socket.emit("control-sign", { node: "5", sign: "2" });
      $("#stop").removeClass("btn-danger").addClass("btn-warning");
      $("#stop").html("LƯỢT KẾ");
      $("#stop").attr("id", "refresh");
      $("#restart").removeClass("disabled");
      // console.log("timeteam1: ", timeTeam1);
      // console.log("timeteam2: ", timeTeam2);
      // console.log("currencheckpoint: ", currentCheckpoint1);
      // console.log("currencheckpoint1: ", currentCheckpoint2);
      // if (!changeTeamSide) {
      // if (
      //   currentCheckpoint1 > currentCheckpoint2 ||
      //   (currentCheckpoint1 == currentCheckpoint2 && timeTeam1 < timeTeam2)
      // ) {
      //   resultTeam1 = resultTeam1 + 1;
      //   $("#result").html(resultTeam1);
      // } else if (
      //   currentCheckpoint1 < currentCheckpoint2 ||
      //   (currentCheckpoint1 == currentCheckpoint2 && timeTeam1 > timeTeam2)
      // ) {
      //   resultTeam2 = resultTeam2 + 1;
      //   $("#result-1").html(resultTeam2);
      // } else {
      //   $("#result").html(resultTeam1);
      //   $("#result-1").html(resultTeam2);
      // }
      // console.log(timeTeam1+ "`````" +timeTeam2)
      // if (resultTeam1 == 2) {$('#win1').css({ 'display': 'block' }); sound_congra.play();}
      //   else if (resultTeam2 == 2 ) {$('#win2').css({ 'display': 'block' }); sound_congra.play();}
  
  
      // } else {
      // 	if (currentCheckpoint1 < currentCheckpoint2 || (currentCheckpoint1 == currentCheckpoint2 && timeTeam1 < timeTeam2)) {
      // 		resultTeam1 = resultTeam1 + 1;
      // 		$("#result").html(resultTeam1);
      // 	} else {
      // 		resultTeam2 = resultTeam2 + 1;
      // 		$("#result-1").html(resultTeam2);
      // 	}
      // }
      // startDelay = new Date().getTime() - timeDelay;
      // countDelay();
      // state = false;
      
      console.log("stop");
    });
    socket.on("refresh-res", () => {
      // clearInterval(delay);
      // startDelay = 0;
      // timeDelay = 0;
      // startTime = new Date().getTime();
      numCheckpointt1 += currentCheckpoint1;
      numCheckpointt2 += currentCheckpoint2;
      changeTeamSide = !changeTeamSide;
      currentCheckpoint1 = 0;
      currentCheckpoint2 = 0;
      timeTeam1 = 0;
      timeTeam2 = 0;
      distanceTime = { minute: 0, second: 0, mil: 0 };
      updateCheckpoint(currentCheckpoint1, 1);
      updateCheckpoint(currentCheckpoint2, 2);
      updateTimeDisplay(currentCheckpoint1, 1);
      updateTimeDisplay(currentCheckpoint2, 2);
      document.getElementById("timerCount").innerHTML =
        "00" + ":" + "00" + ":" + "00";
      if (currentTurn == maxTurn || resultTeam1 == 2 || resultTeam2 == 2) {
        $("#refresh").removeClass("btn-warning").addClass("btn-secondary");
        $("#refresh").html("HẾT");
        $("#refresh").addClass("disabled");
        let Team = [{
          name: currentTeam,
          result: (resultTeam1 != resultTeam2) ? ((resultTeam1  > resultTeam2) ? 'w' : 'l'): 'wl',
          numcp:  numCheckpointt1
        },
        {
          name: currentTeam1,
          result:(resultTeam1 != resultTeam2) ? ((resultTeam2 > resultTeam1) ? 'w' : 'l'): 'wl',
          numcp: numCheckpointt2
        }];
        console.log(Team)
        socket.emit('record-team',Team);
        
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
      outlineTeam1 = false;
      outlineTeam2 = false;
      // $('#restart').addClass('disabled');
      console.log("refresh");
    });
    // Nhấn thi lại
    socket.on("restart-res", () => {
      // clearInterval(delay);
      // startDelay = 0;
      // timeDelay = 0;
      changeTeamSide = false;
      numCheckpointt1 = 0;
      numCheckpointt2 = 0;
      currentCheckpoint1 = 0;
      currentCheckpoint2 = 0;
      timeTeam1 = 0;
      timeTeam2 = 0;
      resultTeam1 = 0;
      resultTeam2 = 0;
      $("#result").html(resultTeam1);
      $("#result-1").html(resultTeam2);
      distanceTime = { minute: 0, second: 0, mil: 0 };
      updateCheckpoint(currentCheckpoint1, 1);
      updateCheckpoint(currentCheckpoint2, 2);
      updateTimeDisplay(currentCheckpoint1, 1);
      updateTimeDisplay(currentCheckpoint2, 2);
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
  
      outlineTeam1 = false;
      outlineTeam2 = false;
      currentTurn = 1;
      $("#turn").html("Lượt " + currentTurn);
      // $('#restart').addClass('disabled');
    });
 
    socket.on("listen_key", (data)=>{
      if (data == 97) {
        boardActive--;
        if (boardActive < 0) boardActive = 3;
        console.log(boardActive)
        for(var i = 0; i < 4; i++){
          $("#board"+i).addClass("active")
          if (i!=boardActive) $("#board"+i).removeClass("active")
        }
      }
      if (data == 100) {
        boardActive++;
        if (boardActive > 3) boardActive = 0;
        for(var i = 0; i < 4; i++){
          $("#board"+i).addClass("active")
          if (i!=boardActive) $("#board"+i).removeClass("active")
        }
      } 
      if (data == 49) {
        $("#plus-"+boardActive+"-0").html(" " + (Number($("#plus-"+boardActive+"-0").text())+1))
        teamScore[boardActive*7+0] = Number($("#plus-"+boardActive+"-0").text())
        blinkPlusScore("#main-plus-"+boardActive+"-0")
        sound_pass.play()
      } 
      if (data == 50) {
        $("#plus-"+boardActive+"-1").html(" " + (Number($("#plus-"+boardActive+"-1").text())+1))
        teamScore[boardActive*7+1] = Number($("#plus-"+boardActive+"-1").text())
        blinkPlusScore("#main-plus-"+boardActive+"-1")
        sound_pass.play()
      } 
      if (data == 51) {
        $("#plus-"+boardActive+"-2").html(" " + (Number($("#plus-"+boardActive+"-2").text())+1))
        teamScore[boardActive*7+2] = Number($("#plus-"+boardActive+"-2").text())
        blinkPlusScore("#main-plus-"+boardActive+"-2")
        sound_pass.play()
      } 
      if (data == 52) {
        $("#subtract-"+boardActive+"-0").html(" " + (Number($("#subtract-"+boardActive+"-0").text())+1))
        teamScore[boardActive*7+3] = Number($("#subtract-"+boardActive+"-0").text())
        blinkSubtractScore("#main-subtract-"+boardActive+"-0")
        sound_eli.play()
      } 
      if (data == 53) {
        $("#subtract-"+boardActive+"-1").html(" " + (Number($("#subtract-"+boardActive+"-1").text())+1))
        teamScore[boardActive*7+4] = Number($("#subtract-"+boardActive+"-1").text())
        blinkSubtractScore("#main-subtract-"+boardActive+"-1")
        sound_eli.play()
      } 
      if (data == 54) {
        $("#subtract-"+boardActive+"-2").html(" " + (Number($("#subtract-"+boardActive+"-2").text())+1))
        teamScore[boardActive*7+5] = Number($("#subtract-"+boardActive+"-2").text())
        blinkSubtractScore("#main-subtract-"+boardActive+"-2")
        sound_eli.play()
      } 
      if (data == 55) {
        $("#subtract-"+boardActive+"-3").html(" " + (Number($("#subtract-"+boardActive+"-3").text())+1))
        teamScore[boardActive*7+6] = Number($("#subtract-"+boardActive+"-3").text())
        blinkSubtractScore("#main-subtract-"+boardActive+"-3")
        sound_eli.play()
      } 
      if (data == 122) {
        $("#plus-"+boardActive+"-0").html(" " + (Number($("#plus-"+boardActive+"-0").text())-1))
        teamScore[boardActive*7+0] = Number($("#plus-"+boardActive+"-0").text())
      } 
      if (data == 120) {
        $("#plus-"+boardActive+"-1").html(" " + (Number($("#plus-"+boardActive+"-1").text())-1))
        teamScore[boardActive*7+1] = Number($("#plus-"+boardActive+"-1").text())
      } 
      if (data == 99) {
        $("#plus-"+boardActive+"-2").html(" " + (Number($("#plus-"+boardActive+"-2").text())-1))
        teamScore[boardActive*7+2] = Number($("#plus-"+boardActive+"-2").text())
      } 
      if (data == 118) {
        $("#subtract-"+boardActive+"-0").html(" " + (Number($("#subtract-"+boardActive+"-0").text())-1))
        teamScore[boardActive*7+3] = Number($("#subtract-"+boardActive+"-0").text())
      } 
      if (data == 98) {
        $("#subtract-"+boardActive+"-1").html(" " + (Number($("#subtract-"+boardActive+"-1").text())-1))
        teamScore[boardActive*7+4] = Number($("#subtract-"+boardActive+"-1").text())
      } 
      if (data == 110) {
        $("#subtract-"+boardActive+"-2").html(" " + (Number($("#subtract-"+boardActive+"-2").text())-1))
        teamScore[boardActive*7+5] = Number($("#subtract-"+boardActive+"-2").text())
      } 
      if (data == 109) {
        $("#subtract-"+boardActive+"-3").html(" " + (Number($("#subtract-"+boardActive+"-3").text())-1))
        teamScore[boardActive*7+6] = Number($("#subtract-"+boardActive+"-3").text())
      } 
        console.info(teamScore)
        socket.emit("team-score-record", teamScore);
        $("#plus-"+boardActive).html(" " +((Number($("#plus-"+boardActive+"-0").text()))+(Number($("#plus-"+boardActive+"-1").text()))+(Number($("#plus-"+boardActive+"-2").text()))))
        $("#subtract-"+boardActive).html(" " +((Number($("#subtract-"+boardActive+"-0").text()))+(Number($("#subtract-"+boardActive+"-1").text()))+(Number($("#subtract-"+boardActive+"-2").text()))+(Number($("#subtract-"+boardActive+"-3").text()))))  //   var timeTeam =
      //     distanceTime.mil +
      //     distanceTime.second * 100 +
      //     distanceTime.minute * 60 * 100 +
      //     startTick;
      //   // if (!changeTeamSide)
      //     socket.emit("esp-send-1", {
      //       id: currentCheckpoint1 + 1,
      //       tick: timeTeam,
      //       arr : [5, false, 5, false]
      //     });
      //   // else
      //   //   socket.emit("esp-send-2", {
      //   //     id: currentCheckpoint1 + 1,
      //   //     tick: timeTeam,
      //   //   });
      // }
      // if (data == 50) {
      //   // console.log("key 2:" + currentCheckpoint1);
      //   var timeTeam =
      //     distanceTime.mil +
      //     distanceTime.second * 100 +
      //     distanceTime.minute * 60 * 100 +
      //     startTick;
      //   // if (changeTeamSide)
      //   //   socket.emit("esp-send-1", {
      //   //     id: currentCheckpoint2 + 1,
      //   //     tick: timeTeam,
      //   //   });
      //   // else
      //     socket.emit("esp-send-2", {
      //       id: currentCheckpoint2 + 1,
      //       tick: timeTeam,
      //       arr : [5, false, 5, false]
      //     });
      // }
      // if (data == 55) {
      //   socket.emit("outline1");
      // }
      // if (data == 56) {
      //   socket.emit("outline2");
      // }
      // if (data == 52) {
      //   socket.emit("subcheckpoint1");
      // }
      // if (data == 53) {
      //   socket.emit("subcheckpoint2");
      // }
      console.log(data);
    });
    
    // socket.on("_outline1", ()=>{
    //   if (startSignal) {
    //     sound_eli.play();
    //     outlineTeam1 = !outlineTeam1;
    //     if (outlineTeam1) $("#team1").css({ display: "block" });
    //     else $("#team1").css({ display: "none" });
    //   }
    // })
    // socket.on("_outline2", ()=>{
    //   if (startSignal) {
    //     sound_eli.play();
    //     outlineTeam2 = !outlineTeam2;
    //     if (outlineTeam2) $("#team2").css({ display: "block" });
    //     else $("#team2").css({ display: "none" });
    //   }
    // })
    // socket.on("_subcheckpoint1", ()=>{
    //   currentCheckpoint1 = currentCheckpoint1 - 1;
    //   clearTimeDisplay(currentCheckpoint1, 1);
    //   updateCheckpoint(currentCheckpoint1, 1);
    //   let a = $("#timecp" + currentCheckpoint1)
    //     .text()
    //     .split(":");
    //   timeTeam1 =
    //     /*parseInt(a[2]) + */ parseInt(a[1]) * 100 + parseInt(a[0]) * 60 * 100;
    //   console.log(a);
    //   console.log(timeTeam1);
    // })
    // socket.on("_subcheckpoint2", ()=>{
    //   currentCheckpoint2 = currentCheckpoint2 - 1;
    //     clearTimeDisplay(currentCheckpoint2, 2);
    //     updateCheckpoint(currentCheckpoint2, 2);
    //     let a = $("#timecp" + currentCheckpoint2 + "-1")
    //       .text()
    //       .split(":");
    //     timeTeam2 =
    //       /*parseInt(a[2]) + */ parseInt(a[1]) * 100 + parseInt(a[0]) * 60 * 100;
    // })
    socket.on("send-tick", (tick) => {
      startTick = tick;
      console.log(startTick);
    });
    // socket.on("esp-send", (data) => {
    //   // console.log(data)
    //   const id = Number(data.Data);
    //   console.log(id, currentCheckpoint,boardActive )
    //   // console.log(id)
    //   // var hrTime = process.hrtime()
    //   // console.log(Math.round((hrTime[0]-startTime[0]) * 100 + (hrTime[1]-startTime[1]) / 10000000))
    //   if (id == currentCheckpoint[boardActive] + 1)
    //   {
    //     currentTick = data.Tick
    //     teamTick = currentTick - startTick
    //     currentCheckpoint[boardActive] += 1
    //     socket.emit("web-send-record", {
    //       team: teamName[boardActive],
    //       time: teamTick,
    //       cp: currentCheckpoint[boardActive],
    //     });

    //   }
      
    // });
    socket.on("esp-send-1", function (data) {
      console.log("node send esp: " + data.id); //du lieu esp gui
      console.log(data.tick);
      currentTick = data.tick;
      /* kiem tra tin hieu bat dau */
      let a = outlineTeam1 == false;
      if (startSignal && a) {
        //kiem tra xem gan den checkpoint cuoi hay chua?
        let currentCheckpointVal = currentCheckpoint1;
        // if (currentCheckpointVal + 2 == maxCheckPoints) {
        // 	socket.emit("end-point-signal");
        // }
        //xac nhan qua check point thanh cong
        //cap nhat checkpoint moi
        currentCheckpoint1 = currentCheckpoint1 + 1;
        currentCheckpointVal = currentCheckpoint1;
        updateCheckpoint(currentCheckpointVal, 1);
        updateTimeDisplay(currentCheckpointVal, 1);
  
        //neu den duoc checkpoint cuoi cung => ngung tin gio + dung nhan du lieu tu node_mcu
        console.log(currentCheckpointVal + ":  "+maxCheckPointsTeam1 +":  " +  maxCheckPointsTeam2)
        if (currentCheckpointVal == maxCheckPointsTeam1 && maxCheckPointsTeam1 == maxCheckPointsTeam2 || currentCheckpointVal == maxCheckPointsTeam) {
          clearInterval(functionPoint);
          startSignal = false;
        } else if (currentCheckpointVal == maxCheckPointsTeam1 && maxCheckPointsTeam1 < maxCheckPointsTeam2) outlineTeam1 = true
        // timeTeam1 = distanceTime.mil + distanceTime.second * 100 + distanceTime.minute * 60 * 100;
        timeTeam1 = currentTick - startTick;
        //gui ve server luu db
        socket.emit("web-send-record", {
          team: currentTeam,
          dualwith: currentTeam1,
          turn: currentTurn,
          time: timeTeam1,
          cp: currentCheckpointVal,
        });
        //console.log("1a")
      }
    });
    socket.on("esp-send-2", function (data) {
      console.log("node send esp 2: " + data.id); //du lieu esp gui
      currentTick = data.tick;
      /* kiem tra tin hieu bat dau */
      let a = outlineTeam2 == false;
      if (startSignal && a) {
        //kiem tra xem gan den checkpoint cuoi hay chua?
        let currentCheckpointVal = currentCheckpoint2;
        // if (currentCheckpointVal + 2 == maxCheckPoints2) {
        //   socket.emit("end-point-signal");
        // }
        // currentCheckpoint1 = currentCheckpoint1 + 1;
        // 		updateCheckpoint(currentCheckpoint1);
        //xac nhan qua check point thanh cong
        //cap nhat checkpoint moi
        currentCheckpoint2 = currentCheckpoint2 + 1;
        currentCheckpointVal = currentCheckpoint2;
        updateCheckpoint(currentCheckpointVal, 2);
        updateTimeDisplay(currentCheckpointVal, 2);
        //neu den duoc checkpoint cuoi cung => ngung tin gio + dung nhan du lieu tu node_mcu
        if (currentCheckpointVal == maxCheckPointsTeam2  && maxCheckPointsTeam1 == maxCheckPointsTeam2 || currentCheckpointVal == maxCheckPointsTeam) {
          clearInterval(functionPoint);
          startSignal = false;
        } else if (currentCheckpointVal == maxCheckPointsTeam2 && maxCheckPointsTeam1 > maxCheckPointsTeam2) outlineTeam2 = true
        timeTeam2 = currentTick - startTick;
        //gui ve server luu db
        socket.emit("web-send-record", {
          team: currentTeam1,
          dualwith: currentTeam,
          turn: currentTurn,
          time: timeTeam2,
          cp: currentCheckpointVal,
        });
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
  
        // 5 minutes
        if (minutes >= limitTime && seconds >= 0) {
          startSignal = false;
          clearInterval(functionPoint);
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
    function updateCheckpoint(number, team) {
      let teamSel = team == 1 ? "" : "-1";
      for (let i = 1; i <= number; i++)
        $("#checkpoint" + i + teamSel).css({
          "background-color": "#7FFF00",
          "box-shadow":
            "0 1px 18px 10px rgba(127, 255, 0, 0.219), 0 6px 20px 0  rgba(127, 255, 0, 0.219)",
        });
      for (let i = number + 1; i <= 10; i++)
        $("#checkpoint" + i + teamSel).css({
          "background-color": "#bbb",
          "box-shadow": "0 0px 0px 0px white, 0 0px 0px 0px white",
        });
      if (number == 0) {
        for (let i = 1; i <= 10; i++)
          $("#checkpoint" + i + teamSel).css({
            "background-color": "#bbb",
            "box-shadow": "0 0px 0px 0px white, 0 0px 0px 0px white",
          });
      }
    }
    function clearTimeDisplay(number, team) {
      $("#timecp" + (number + 1) + (team == 1 ? "" : "-1")).text("00:00:00");
      $("#timecp" + (number + 1) + (team == 1 ? "" : "-1")).css({
        color: "white",
      });
    }
    function blinkPlusScore(elem){
      $(elem).css({
        color: "white"
      })
      setTimeout(()=>{$(elem).css({
        color: "#6aff6f"
      })}, 500)
    }
    function blinkSubtractScore(elem){
      $(elem).css({
        color: "white"
      })
      setTimeout(()=>{$(elem).css({
        color: "#e02c2f"
      })}, 500)
    }
    function updateTimeDisplay(number, team) {
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
      if (currentCheckpoint1 == 0 && currentCheckpoint2 == 0) {
        for (let i = 1; i <= 10; i++) {
          $("#timecp" + i + (team == 1 ? "" : "-1")).text("00:00:00");
          $("#timecp" + i + (team == 1 ? "" : "-1")).css({ color: "white" });
        }
      }
    }
    // socket.on("Change-team-web", function (data) {
    //   console.log(data);
    //   currentTeam = data.team1;
    //   currentTeam1 = data.team2;
    //   $("#nameofteam").html(currentTeam);
    //   $("#nameofteam-1").html(currentTeam1);
    // });
    // socket.on("Change-team-side", function (data) {
    //   changeTeamSide = data;
    // });
    socket.emit("get-team-score-record");
    socket.on("score-record", (data) => {
      if (data.length) teamScore = data[0].scores;
      
      for (var i = 0; i < teamScore.length; i++){
        // console.info(Math.floor(i))
        if (i%7 == 0 || i%7 == 1 || i%7 == 2)
        $("#plus-"+Math.floor(i/7)+"-"+i%7).html(" " +teamScore[i])
        else 
        $("#subtract-"+Math.floor(i/7)+"-"+(i%7-3)).html(" " +teamScore[i])
      }
      for (var i = 0; i < 4; i++){
        $("#plus-"+i).html(" " +((Number($("#plus-"+i+"-0").text()))+(Number($("#plus-"+i+"-1").text()))+(Number($("#plus-"+i+"-2").text()))))
        $("#subtract-"+i).html(" " +((Number($("#subtract-"+i+"-0").text()))+(Number($("#subtract-"+i+"-1").text()))+(Number($("#subtract-"+i+"-2").text()))+(Number($("#subtract-"+i+"-3").text()))))
      }
      
      // types = data[0].type;
      // map = data[0].flow;
      // console.info(types);
    });
  });
});


