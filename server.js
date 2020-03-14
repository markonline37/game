/*
	server is not scalable in current state;
		client.del('allOnlinePlayers') is a cheap workaround for crashes, wont work when scalable
		anything that requires data from the database such as vendor items and players requires a read from database first
		right now the database is used to backup data, with data being set on initial load from database.
		additionally treesObj and droppedItemsObj controller is controlled by this server
			will run into similar issues when enemies are added

	todo: 
		get vendor working by reading the database first
		same with trees
		same with droppedItems
		same with player packet - other players
*/
var redis = require('redis');
var client = redis.createClient();
client.on('connect', function(){
	client.del('allOnlinePlayers');
	console.log('redis connection: connected');
});

const {promisify} = require('util');
const hgetallAsync = promisify(client.hgetall).bind(client);

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
const Items = require('./module/items.js');
const Mapp = require('./module/map');
const Vendors = require('./module/vendors.js');
const Trees = require('./module/trees');
const DroppedItem = require('./module/droppedItems.js')

//objects
var map, mapObj, itemsObj, calcObj, vendObj, treesObj, droppedItemsObj, levelTable;

(async () => {
	mapObj = await new Mapp(fs, fssync);
	map = await mapObj.getMap();
	itemsObj = await new Items();
	calcObj = await new Calculator(itemsObj.getFish(), itemsObj.getJunk());
	vendObj = await new Vendors(fs, client);
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

var onlinePlayers = {};

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
					'xp': JSON.stringify({
						fishing: 0,
						woodcutting: 0
					}),
					'skills': JSON.stringify({
						fishing: 0,
						woodcutting: 0
					}),
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
					'bankedItems': JSON.stringify([])
				});
				client.sadd('allOnlinePlayers', data.email.toLowerCase());
				let player = new Player(data.username, data.email, hasher.hash(data.password), socket, startPosX, startPosY, 
					charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance);
				onlinePlayers[socket.id] = player;
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
							let player = new Player(hash.username, hash.email, hash.password, hash.socket, parseFloat(hash.x), 
								parseFloat(hash.y), charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance, 
								parseInt(hash.gold), hash.facing, JSON.parse(hash.xp), JSON.parse(hash.skills), 
								JSON.parse(hash.inventory), JSON.parse(hash.bankedItems));
							onlinePlayers[socket.id] = player;
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
		let player = findPlayer(socket.id);
		if(player !== false){
			console.log('Player Disconnected: '+onlinePlayers[socket.id].email);
			client.srem('allOnlinePlayers', onlinePlayers[socket.id].email);
			delete onlinePlayers[socket.id];
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
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.actions(map, vendObj, treesObj, client);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	socket.on('drop item', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.dropItem(data, droppedItemsObj)
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	socket.on('swap item', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.swapItem(data);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	socket.on('clicked', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.clicked(data, droppedItemsObj)
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	socket.on('sell item', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.sellItem(data, vendObj, client);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	socket.on('buy item', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.buyItem(data, vendObj, itemsObj, client);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	socket.on('stop', function(){
		let player = findPlayer(socket.id);
		if(player !== false){
			player.stop();
		}
	});

	socket.on('bank deposit', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.bankDeposit(data);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	socket.on('bank withdraw', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.bankWithdraw(data);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});
})

let toggle = true;
//main loop
let lastUpdateTime = (new Date()).getTime();
setInterval(function() {
	treesObj.controller(map);
	droppedItemsObj.controller();
	let currentTime = (new Date()).getTime();
	let timeDifference = currentTime - lastUpdateTime;
	for(let i in onlinePlayers){
		let packet = onlinePlayers[i].tick(io, i, treesObj, calcObj, map, itemsObj, timeDifference, 
			mapObj, onlinePlayers, vendObj, droppedItemsObj, levelTable, client);
		io.to(i).emit('update', packet);
	}
	lastUpdateTime = currentTime;
}, 1000 / gamespeed);

function findPlayer(socket){
	if(socket in onlinePlayers){
		return onlinePlayers[socket];
	}else{
		return false;
	}
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
		let user;
		switch(answer){
			case "trees":
				console.log(treesObj.getTrees());
				break;
			case "processMap":
				mapObj.processMap();
				map = mapObj.getMap();
				break;
			case "q":
			case "exit":
				console.log("exiting...");	
				process.exit();
				break;
			default:
				console.log("Not a command, try again...");
		}
	}
})();