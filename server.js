//var redis = require('async-redis');
var redis = require('redis');
var client = redis.createClient();
client.on('connect', function(){
	console.log('redis connection: connected');
});
client.on("error", function(error) {
  console.error(error);
});

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
const Trees = require('./module/trees');
const DroppedItem = require('./module/droppedItems.js')

//objects
var map, mapObj, itemsObj, calcObj, socketHandler, vendObj, activePlayers, allPlayers, treesObj, droppedItemsObj, levelTable;

(async () => {
	mapObj = await new Mapp(fs, fssync);
	map = await mapObj.getMap();
	itemsObj = await new Items();
	calcObj = await new Calculator(itemsObj.getFish(), itemsObj.getJunk());
	socketHandler = await new SocketH(io, hasher, Player);
	vendObj = await new Vendors(fs, fssync);
	activePlayers = await new activeP();
	allPlayers = await new AllP(fs, fssync, Player, charactersize, movespeed, 
		horizontaldrawdistance, verticaldrawdistance);
	treesObj = await new Trees(map);
	droppedItemsObj = await new DroppedItem(horizontaldrawdistance/2, verticaldrawdistance/2);
	try{
		let temp = fs.readFileSync('./storage/levelTable.json');
		levelTable = JSON.parse(temp);
	}catch(err){
		console.log("error loading levelTable: "+err);
	}
	console.log("Server Load Complete");
})();



app.use('/', express.static(__dirname + '/public'));

// Starts the server.
app.get('/*', function(request, response) {
	response.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(5000, function() {

});

var onlinePlayers = [];

io.on('connection', function(socket) {
	//new player-------------------------------------------------------------------------
	socket.on('new player', function(data) {
		client.exists(data.email.toLowerCase(), function(err, reply){
			let errors = false;
			let error = {
				username: false,
				email: false,
				password: false
			};
			let exists;
			reply === 1 ? exists = true : exists = false;
			if(data.username.length < 3 || data.username.length > 32){
				error.username = "Username must be between 3 and 32 characters";
				errors = true;
			}
			if(exists){
				error.email = "Email already exists";
				errors = true;
			}else if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)){
				error.email = "Email is not in a valid format";
				errors = true;
			}
			if(data.password.length < 8){
				error.password = "Password must be be at least 8 characters";
	    		errors = true;
			}
			
			if(!errors){
				client.hmset(data.email.toLowerCase(), {
					'username': data.username,
					'email': data.email.toLowerCase(),
					'password': hasher.hash(data.password),
					'socket': socket.id,
					'x': startPosX,
					'y': startPosY,
					'gold': 0,
					'facing': 'S',
					'xp': '{fishing:0,woodcutting:0}',
					'skills': '{fishing:0,woodcutting:0}',
					'action': '',
					'inventory': JSON.stringify({
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
						}),
					'bankedItems': ''
				});
				client.sadd('allOnlinePlayers', data.email.toLowerCase());
				let player = new Player(data.username, data.email, hasher.hash(data.password), socket, startPosX, startPosY, 
					charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance);
				onlinePlayers.push({'socket': socket.id, 'user': player});
				io.to(socket.id).emit('success');
				console.log('Player Joined: '+data.email.toLowerCase());
			} else {
				io.to(socket.id).emit('failed new user', error);
			}
		});
	});

	//returning player -----------------------------------------------------------------------
	socket.on('returning player', function(data){
		let errors = false;
		let error = {
			email: false,
			password: false
		};
		if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)){
			error.email = "Email is not in a valid format";
			errors = true;
		}
		if(data.password.length < 8){
			error.password = "Invalid password";
			errors = true;
		}
		
		client.exists(data.email.toLowerCase(), function(err, reply){
			if(reply !== 1){
				error.email = "Email address not found";
				errors = true;
			}
			client.hget(data.email.toLowerCase(), 'password', function(err, reply){
				if(hasher.hash(data.password) !== reply){
					error.password = "Password doesn't match";
					errors = true;
				}
				client.smembers("allOnlinePlayers", function(err, result){
					if(result.includes(data.email.toLowerCase())){
						error.email = "Account already in use";
						errors = true;
					}
					if(!errors){
						client.hgetall(data.email.toLowerCase(), function(err, hash){
							client.sadd('allOnlinePlayers', data.email.toLowerCase());
							let player = new Player(hash.username, hash.email, hash.password, hash.socket, hash.x, hash.y,
								charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance, hash.gold, hash.facing, hash.xp, 
								hash.skills, hash.inventory, hash.bankedItems);
							onlinePlayers.push({'socket': socket.id, 'user': player});
							console.log('Player Joined: '+data.email.toLowerCase());
							io.to(socket.id).emit('success');
						});
					}else{
						io.to(socket.id).emit('failed login', error);
					}
				});
			});
		});	
	});

	socket.on('disconnect', function(){
		for(let i = 0, j = onlinePlayers.length; i<j; i++){
			if(onlinePlayers[i].socket === socket.id){
				console.log('Player Disconnected: '+onlinePlayers[i].email);
				client.srem('allOnlinePlayers', onlinePlayers[i].email);
				onlinePlayers.splice(i, 1);
				break;
			}
		}		
	});

	socket.on('movement', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			player.movement = data;
			if(data.left === true || data.right === true || data.up === true || data.down === true){
				player.moving = true;
				player.action = "";
			}else{
				player.moving = false;
			}
		}
	});

	socket.on('action', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.action(user, data, socket.id, activePlayers, io, map, vendObj, treesObj);
		}
	});

	socket.on('drop item', function(data){
		let user = activePlayers.findPlayer('socket', socket.id);
		if(user !== false){
			socketHandler.dropItem(user, data, socket.id, io, droppedItemsObj);
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
			socketHandler.clicked(user, data, socket.id, io, droppedItemsObj);
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
let lastUpdateTime = (new Date()).getTime();
setInterval(function() {
	treesObj.controller(map);
	droppedItemsObj.controller();
	let currentTime = (new Date()).getTime();
	let timeDifference = currentTime - lastUpdateTime;
	for(let i=0, j=onlinePlayers.length; i<j; i++){
		let packet = onlinePlayers[i].user.tick(io, onlinePlayers[i].socket, treesObj, calcObj, map, 
			itemsObj, timeDifference, mapObj, activePlayers, vendObj, droppedItemsObj, levelTable, client);
		io.to(onlinePlayers[i].socket).emit('update', packet);
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

function findPlayer(socket){
	for(let i = 0, j = onlinePlayers.length; i<j; i++){
		if(onlinePlayers[i].socket === socket){
			return onlinePlayers[i].user;
		}
	}
	return false;
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
			case "dropped":
			let user5 = allPlayers.getIndividualPlayer('email', 'markonline37@gmail.com');
				console.log(droppedItemsObj.getItems(user5.x, user5.y, user5.email));
				break;
			case "trees":
				console.log(treesObj.getTrees());
				break;
			case "packet":
				let user4 = allPlayers.getIndividualPlayer('email', 'markonline37@gmail.com');
				console.log(user4.calcPacket(activePlayers, map, vendObj, droppedItemsObj));
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