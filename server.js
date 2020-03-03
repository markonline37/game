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
const horizontaldrawdistance = 46;
const startPosX = 50;
const startPosY = 50;
const gamespeed = 60;

//modules
const fs = require('fs');
const fssync = require('fs').promises;
const db = require('./module/db');
const hasher = require('./module/hash');
const Player = require('./module/player');
const Calculator = require('./module/calculator');
const AllP = require('./module/allPlayers.js');
const Items = require('./module/items.js');
const activeP = require('./module/activePlayers.js');
const Mapp = require('./module/map');
const SocketH = require('./module/socketHandler');
const Vendors = require('./module/vendors.js');

//objects
var map, mapObj, itemsObj, calcObj, socketHandler, vendObj, activePlayers, allPlayers;

(async () => {
	mapObj = await new Mapp(fs, fssync);
	map = await mapObj.getMap();
	itemsObj = await new Items();
	calcObj = await new Calculator(itemsObj.getFish());
	socketHandler = await new SocketH(io, hasher, Player);
	vendObj = await new Vendors(fs, fssync);
	activePlayers = await new activeP();
	allPlayers = await new AllP(fs, fssync, Player, charactersize, movespeed, 
		horizontaldrawdistance, verticaldrawdistance);
	console.log("Server Load Complete");
})();



app.use('/', express.static(__dirname + '/public'));

// Starts the server.
app.get('/*', function(request, response) {
	response.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(5000, function() {

});

io.on('connection', function(socket) {
	
	socket.on('new player', function(data) {
		socketHandler.newPlayer(data, socket.id, allPlayers, activePlayers, startPosX, startPosY, charactersize, movespeed, 
			horizontaldrawdistance, verticaldrawdistance);
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
			socketHandler.action(user, data, socket.id, activePlayers, io, map, vendObj);
		}
	});

	socket.on('drop item', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.dropItem(user, data, socket.id, io);
		}
	});

	socket.on('swap item', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.swapItem(user, data, socket.id, io);
		}
	});

	socket.on('clicked', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.clicked(user, data, socket.id, io);
		}
	});

	socket.on('sell item', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.sellItem(user, data, socket.id, io, vendObj);
		}
	});

	socket.on('buy item', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.buyItem(user, data, socket.id, io, vendObj, itemsObj);
		}
	});

	socket.on('stop', function(){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.stop(user);
		}
	});

	socket.on('bank deposit', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.bankDeposit(user, data, socket.id, io);
		}
	});

	socket.on('bank withdraw', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.bankWithdraw(user, data, socket.id, io);
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
				let temp = user.tickFish(io, user.socket, calcObj);
				if(typeof temp === 'string' || temp instanceof String){
					io.to(user.socket).emit('Game Message', temp);
				}
			}
		}
		user.calcMovement(map, timeDifference, mapObj);
		let packet = user.calcPacket(activePlayers, map, vendObj);
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
	await vendObj.backup();
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
			case "packet":
				let user4 = allPlayers.getIndividualPlayer('email', 'markonline37@gmail.com');
				console.log(user4.calcPacket(activePlayers, map, vendObj));
				break;
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
			case "fish0":
				let user2 = activePlayers.findPlayer('email', 'markonline37@gmail.com');
				user2.skills.fishing = 0;
				user2.xp.fishing = 0;
				user2.inventory = {
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
			case "vendor":
				let user11 = activePlayers.findPlayer('email', 'markonline37@gmail.com');
				console.log(vendObj.findVendor(226, 29));
				break;
			case "equipRiverRod":
				activePlayers.findPlayer('email', 'markonline37@gmail.com').equipMainHand("riverRod");
				break;
			case "equipOceanRod":
				activePlayers.findPlayer('email', 'markonline37@gmail.com').equipMainHand("oceanRod");
				break;
			case "dropped":
				console.log(JSON.stringify(activePlayers.findPlayer('email', 'markonline37@gmail.com').droppedItemList,null,2));
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