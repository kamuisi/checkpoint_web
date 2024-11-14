var maxCheckPoints = 10;
var nowNode = 0;
var teamgroupData = 0;
var startTick = 0;
var currentTick = 0;
var teamSide = false;
var socket = null;

$.getScript('./configClient/config.js', function () {
	socket = io('http://' + hostIP + ':' + port);
})
.done(() => {
	$(document).ready(function () {
		const form = document.querySelector('form')
		const changeForm = document.querySelector('#changeForm')
		const delForm = document.querySelector('#delForm')
		const errorMessage = document.querySelector('.error')
		const setTimeBtn = document.querySelector('#setLightTime')
		var acc = document.getElementsByClassName("accordion");
		const lightNode = document.getElementById('light-node')
		const setLightBtn = document.querySelector('#setLightNode')
	
		setLightBtn.addEventListener('click', () => {
			console.log(setLightBtn)
			node = lightNode.value
			console.log(node)
			if (node > 10) return
			socket.emit("set-light-node", node)
			// socket.emit("set-light-time",data)
		})
	
		// setTimeBtn.addEventListener('click',() => {
		// 	console.log(setTimeBtn)
		// 	const data = {
		// 		green: greenLed.value,
		// 		yellow: yellowLed.value,
		// 		red: redLed.value
		// 	}
		// 	console.log("set time")
		// 	socket.emit("set-light-time",data)
		// }) khong co id
	
	
	
	
		var i;
		for (let i = 1; i <= 10; i++) {
			$('#esp' + i).text('disconnected');
			$('#esp' + i).css({ 'color': 'black' });
			$('#esp' + i).css({ 'background': 'red' });
		}
		socket.on("send-tick-setup", (tick) => {
			socket.emit("esp-send", { Data: tick.Data, Tick: tick.Tick });
		});
		socket.on("send-tick", (tick) => {
			startTick = tick;
		});
		socket.on('ESP-check-data', (data) => {
			// console.log(data);
			data.forEach(element => {
				$('#esp' + element).text('connected');
				$('#esp' + element).css({ 'background': 'green' });
			});
		})
		socket.on('ESP-connect', (data) => {
			console.log(data);
			$('#esp' + data).text('connected');
			$('#esp' + data).css({ 'background': 'green' });
		})
		socket.on('ESP-disconnect', (data) => {
			console.log(data);
			$('#esp' + data).text('disconnected');
			$('#esp' + data).css({ 'background': 'red' });
		})
		socket.on('ListTeam', (data) => {
			var teamList = data;
			teamList.forEach(element => {
				$("#team1").append(new Option(element.name));
				$("#team2").append(new Option(element.name));
			})
		});
		socket.on('esp-send', (data) => {
			console.log(data);
			$('#espbg' + data.Data).css({ 'color': 'black' });
			$('#espbg' + data.Data).css({ 'background': 'yellow' });
			$('#lastsent').text(data.Data);
			setTimeout(() => {
				$('#espbg' + data.Data).css({ 'color': 'black' });
				$('#espbg' + data.Data).css({ 'background': 'white	' });
			}, 500)
		})
		socket.on('esp-cap-layer', (data) => {
			var cap_layer = JSON.parse(data)
			console.log(cap_layer.layer)
			$('#normalnow' + cap_layer.node).text(' pin - ' + (cap_layer.pin) / 1000 + 'V; ' + 'layer' + cap_layer.layer);
		})
		socket.on("restart-res", () => {
			teamSide = false;
		})
		$('#ipbt').click(() => {
			socket.emit("Set-ip", { ip: $('#ip').val() });
			console.log($('#ip').val());
		})
		for (let i = 1; i <= maxCheckPoints; i++) {
			$('#button-range' + i).click(() => {
				console.log("rang set")
				socket.emit("get-tick-setup", { id: i.toString(), tick: startTick });
	
				// nowNode = i;
				// socket.emit("SetTopBot", { node: i.toString(), top: parseInt($('#top' + i).val()), bot: parseInt($('#bot' + i).val()), normal: parseInt($('#normal' + i).val()) });
			})
			$('#button' + i).click(() => {
				nowNode = i;
				socket.emit("Set-range", { node: i.toString(), range: parseInt($('#range' + i).val()) });
			})
			$('#button-check' + i).click(() => {
				nowNode = i;
				console.log("Check " + i)
				socket.emit("Check-esp", { node: i.toString() });
			})
		}
		form.addEventListener('submit', async (e) => {
			e.preventDefault()
			try {
				socket.emit("AddTeam", { name: $('#name').val(), group: $('#group').val(), image_link: $('#image').val() })
				errorMessage.textContent = 'Sent request (Add team: ' + $('#name').val() + ') !';
				setTimeout(() => {
					errorMessage.textContent = '';
				}, 1.5 * 1000);
			} catch (err) {
				console.log(err.message)
			}
		})
		changeForm.addEventListener('submit', async (e) => {
			e.preventDefault()
			try {
				socket.emit("team-score-record", {team_name: $('#TeamName').val(), cp: $('#QuanCheckpoint').val(), 
					score: $('#TeamScore').val(), time_finish: $('#TimeFinish').val()
				})
				errorMessage.textContent = '';
				setTimeout(() => {
					errorMessage.textContent = '';
				}, 1.5 * 1000);
			} catch (err) {
				console.log(err.message)
			}
		})
		delForm.addEventListener('submit', async (e) => {
			e.preventDefault()
			try {
				socket.emit("DeleteTeam", { name: $('#delId').val() })
				errorMessage.textContent = 'Sent request (Delete team name: ' + $('#delId').val() + ') !';
				setTimeout(() => {
					errorMessage.textContent = '';
				}, 2 * 1000);
			} catch (err) {
				console.log(err.message)
			}
		})
		socket.emit('GetTeam');
		$('#change').click(() => {
			socket.emit('Change-team-web', { team1: $('#team1 option:selected').text(), team2: $('#team2 option:selected').text() });
			document.querySelector('#team1side').textContent = $('#team1 option:selected').text()
			document.querySelector('#team2side').textContent = $('#team2 option:selected').text()
		})
		socket.on('GetDual', () => {
			$('#change').click();
		})
		// $('#refresh').click(()=>{
		// 	for (let i = 1; i <= 10; i++) {
		// 		$('#esp' + i).text('disconnected');
		// 		$('#esp' + i).css({ 'color': 'black' });
		// 		$('#esp' + i).css({ 'background': 'red' });
		// 	}
	
		// 		setTimeout(()=>{
		// 			console.log("Refresh");
		// 			socket.emit('Connection-refresh');
		// 			setTimeout(()=>{
		// 				console.log("Refresh");
		// 				socket.emit('Connection-refresh');
		// 				setTimeout(()=>{
		// 					console.log("Refresh");
		// 					socket.emit('Connection-refresh');
		// 				}, 2000)
		// 			}, 2000)
		// 		}, 2000)
	
		// })
		// $('#toggle').click(() => {
		// 	teamSide = !teamSide;
		// 	var nameChange = $('#team1side').text()
		// 	$('#team1side').text($('#team2side').text());
		// 	$('#team2side').text(nameChange);
		// 	socket.emit('Change-team-side', teamSide);
		// });
		$('#flow').click(() => {
			var floww = ['0'];
			var typee = ['0'];
			for (let i = 1; i <= 10; i++) {
				if ($('#flow' + i).val() != "")
					floww.push($('#flow' + i).val());
				else
					floww.push(i.toString());
				if ($('#type' + i).val() != "")
					typee.push($('#type' + i).val());
				else
					typee.push("normal");
	
			}
			console.info(floww)
			console.info(typee)
			socket.emit('Change-flow', { flow: floww, type: typee });
		})
		for (i = 0; i < acc.length; i++) {
			acc[i].nextElementSibling.style.display = "none"
		}
		for (i = 0; i < acc.length; i++) {
			acc[i].addEventListener("click", function () {
				/* Toggle between adding and removing the "active" class,
				to highlight the button that controls the panel */
				this.classList.toggle("active");
	
				/* Toggle between hiding and showing the active panel */
				var panel = this.nextElementSibling;
				if (panel.style.display === "block") {
					panel.style.display = "none";
				} else {
					panel.style.display = "block";
				}
	
			});
		}
	})
})
