var test = false;
var Socket_hostIP;
var Socket_port;
var socket;
var startSignal = false;
var nextTeam = "";
var currentTurn = 1;
var maxTurn = 10;
var currentCheckpoint1 = 0;
var currentCheckpoint2 = 0;
var currentTurnTeam = [1, 1, 1, 1]
let currentCheckpoint = [1, -1, -1, -1]
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
let teamScore = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
let teamName = ["LTK", "NhwngtenLieu", "UTE_AIS", "FPTU_AI"]
var boardActive = 4;
$.when(
  $.getScript('./configClient/config.js', function () {
    Socket_hostIP = hostIP;
    Socket_port = port;
  })).done(function () {
    socket = io.connect('http://' + Socket_hostIP + ':' + Socket_port, { transports: ['websocket'] });
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

      socket.on("score-record", (data) => {
        
      });
    });
  });


