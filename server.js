// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server, { forceNew: true });
app.set('port', 5000);

const mapheight = 200;
const mapwidth = 200;
const charactersize = 32;
const movespeed = 0.01;
const verticaldrawdistance = 40;
const horizontaldrawdistance = 44;
const startPosX = 50;
const startPosY = 50;
const gamespeed = 60;

const fs = require('fs');
const fssync = require('fs').promises;
const db = require('./module/db');
const hasher = require('./module/hash');
const Player = require('./module/player');
const Fishing = require('./module/fishing');
const AllP = require('./module/allPlayers.js');
const allPlayers = new AllP(fs, fssync, Player, charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance);
const activeP = require('./module/activePlayers.js');
const activePlayers = new activeP();
const fishingObj = new Fishing();
const Mapp = require('./module/map');
const SocketH = require('./module/socketHandler');
const socketHandler = new SocketH(io, hasher, Player);

var map;
var mapObj;

(async () => {
	mapObj = await new Mapp(fs, fssync);
	map = await mapObj.getMap();
})();



app.use('/', express.static(__dirname + '/public'));

// Starts the server.
app.get('/*', function(request, response) {
	response.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(5000, function() {

});

console.log("Server Load Complete");

io.on('connection', function(socket) {
	
	socket.on('new player', function(data) {
		socketHandler.newPlayer(data, socket.id, allPlayers, activePlayers, startPosX, startPosY, charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance);
	});

	socket.on('returning player', function(data){
		socketHandler.returningPlayer(data, allPlayers, activePlayers, socket.id);
	});

	socket.on('disconnect', function(){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			if(lastPacket.hasOwnProperty(user.email)){
				delete lastPacket[user];
			}
			socketHandler.disconnect(socket.id, activePlayers, allPlayers);
		}
			
	});

	socket.on('movement', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.movement(user, data, socket.id, activePlayers);
		}
	});

	socket.on('action', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.action(user, data, socket.id, activePlayers, map, io);
		}
	});
});

//main loop
let lastPacket = {};
let lastUpdateTime = (new Date()).getTime();
setInterval(function() {
	let currentTime = (new Date()).getTime();
	let timeDifference = currentTime - lastUpdateTime;
	let players = activePlayers.getPlayers();
	for(let i=0, j=players.length; i<j; i++){
		let user = players[i];
		if(user.action !== ""){
			if(user.action === "fishing"){
				let temp = user.tickFish(fishingObj);
				if(typeof temp === 'string' || temp instanceof String){
					io.to(user.socket).emit('Game Error', temp);
				}
			}
		}
		user.calcMovement(map, timeDifference);
		let packet = user.calcPacket(map);
		/*//if lastPacket is empty
		if((Object.entries(lastPacket).length === 0 && lastPacket.constructor === Object)){
			lastPacket[user.email]=packet;
			io.to(activeplayers[i].socket).emit('update', packet);
		}else{
			//event based - only emit to client when a packet is different than last
			if(JSON.stringify(lastPacket[user.email]) !== JSON.stringify(packet)){
				io.to(activeplayers[i].socket).emit('update', packet);
				lastPacket[user.email]=packet;
			}
			io.to(activeplayers[i].socket).emit('update', packet);
			lastPacket[user.email]=packet;
		}*/
		io.to(user.socket).emit('update', packet);
		lastPacket[user.email]=packet;
	}
	lastUpdateTime = currentTime;
}, 1000 / gamespeed);

//backup every 5 minutes
setInterval(function(){
	backup();
}, 300000);

async function backup(){
	await allPlayers.backup(activePlayers);
	return null;
}

const readline = require('readline');
let rl = readline.createInterface(process.stdin, process.stdout);
let question = function(q){
	return new Promise((res, rej) => {
		rl.question(q, answer => {
			res(answer);
		})
	});
};
(async () => {
	while(true){
		let answer = await question('');
		switch(answer){
			case "processMap":
				mapObj.processMap();
				map = mapObj.getMap();
				break;
			case "active":
				console.log(activePlayers.getPlayers());
				break;
			case "all":
				console.log(allPlayers.getAllPlayers());
				break;
			case "empty":
				let user = activePlayers.findPlayer('email', 'markonline37@gmail.com');
				user.inventory = {
					slot1: "",
					slot2: "",
					slot3: "",
					slot4: "",
					slot5: "",
					slot6: "",
					slot7: "",
					slot8: "",
					slot9: "",
					slot10: "",
					slot11: "",
					slot12: "",
					slot13: "",
					slot14: "",
					slot15: "",
					slot16: "",
					slot17: "",
					slot18: "",
					slot19: "",
					slot20: "",
					slot21: "",
					slot22: "",
					slot23: "",
					slot24: "",
					slot25: "",
					slot26: "",
					slot27: "",
					slot28: "",
					slot29: "",
					slot30: ""
				}
				break;
			case "backup":
				backup();
				break;
			case "q":
			case "exit":
				console.log("Backing up and exiting...");	
				await backup();
				process.exit();
				break;
			default:
				console.log("Not a command, try again...");
		}
	}
})();