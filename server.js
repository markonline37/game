/*
	todo:
		Functionality to move to master when cluster is implemented;
			client.del('allOnlinePlayers')
			trees - setup pub/sub
			droppedItems - setup pub/sub
			master maintains a copy of allonlineplayers - function to get all players on worker start
				master sub AllPlayers ->client pub allPlayers -> master pub allPlayers -> 
				client sub allPlayersListener, if(not already loaded){ load all players}
			Restart workers
				master delete players from allOnlinePlayers for that worker, and pub newAllPlayers
			Restart Master
				master sub workerListener -> master pub iAmNewMaster -> client pub workerListener(name of worker)

			***Might be easier/better to use node's cluster communication instead of ioredis pub/sub
		
		Finish map

		Update woodcutting animation.

*/
//redis general connection ---------------------------------------------
var redis = require('redis');
var client = redis.createClient();
client.on('connect', function(){
	client.del('allOnlinePlayers');
	console.log('redis connection: connected');
});
client.on("error", function(error) {
  console.error(error);
});

//redis pub/sub ---------------------------------------------------------
const ioredis = require('ioredis');
const clientVendorSub = new ioredis();
const clientPlayerSub = new ioredis();
const clientPub = new ioredis();
//vendor sub --------------------------------------------------------
const vendorChannel = 'vendorChannel';
clientVendorSub.subscribe(vendorChannel, (error, result) => {
	if(error !== null){
		console.log("Error subscribing to "+vendorChannel+": "+error);
	}
});
clientVendorSub.on('message', (vendorChannel, message) => {
	vendObj.updateVendors(message);
});
//player sub -----------------------------------------------------------
const playerChannel = 'playerChannel';
clientPlayerSub.subscribe(playerChannel, (error, result) => {
	if(error !== null){
		console.log("Error subscribing to "+playerChannel+": "+error);
	}
});
clientPlayerSub.on('message', (playerChannel, message) => {
	let data = JSON.parse(message);
	if(data.type === "disconnect"){
		delete allOnlinePlayers[data.unique];
	}else if(data.type === "update"){
		allOnlinePlayers[data.unique] = data.data;
	}
});

//can use await keyword with hgetallAsync
const {promisify} = require('util');
const hgetallAsync = promisify(client.hgetall).bind(client);


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
const hasher = require('./module/hash');
const Player = require('./module/player');
const Calculator = require('./module/calculator');
const Items = require('./module/items.js');
const Mapp = require('./module/map');
const Vendors = require('./module/vendors.js');
const Trees = require('./module/trees');
const DroppedItem = require('./module/droppedItems.js')

//main testing boolean.
const testingEnabled = true;
let testNames = [];
let testAccountCount = 0;

//objects
var map, mapObj, itemsObj, calcObj, vendObj, treesObj, droppedItemsObj, levelTable;

(async () => {
	if(testingEnabled){
		try{
			testNames = await JSON.parse(fs.readFileSync('./storage/testNames.json'));
		}catch(err){
			console.log(err);
		}
	}
	mapObj = await new Mapp(fs, fssync);
	map = await mapObj.getMap();
	itemsObj = await new Items();
	calcObj = await new Calculator(itemsObj.getFish(), itemsObj.getJunk());
	let vendorhash = await hgetallAsync('vendor');
	vendObj = await new Vendors(fs, vendorhash);
	treesObj = await new Trees(map);
	droppedItemsObj = await new DroppedItem(horizontaldrawdistance/2, verticaldrawdistance/2);
	try{
		let temp = fs.readFileSync('./storage/leveltable.json');
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
var allOnlinePlayers = {};

io.on('connection', function(socket) {
	//for Artillery.IO testing only.
	socket.on('new player testing', function(data){
		if(testingEnabled){
			let testEmail = testAccountCount+"@madeupemail.com";
			let testUsername = testNames[Math.floor(Math.random() * testNames.length)]+testAccountCount;
			let testPassword = "abcd1234";
			client.sadd('allOnlinePlayers', testEmail);
			clientPub.publish(playerChannel, JSON.stringify({
				type: "update",
				unique: testEmail,
				data: {
					username: testUsername,
					x: startPosX,
					y: startPosY,
					facing: "S",
					moving: false,
					action: ""
				}
			}));
			let player = new Player(testUsername, testEmail, hasher.hash(testPassword), socket, startPosX, startPosY, 
				charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance);
			onlinePlayers[socket.id] = player;
			io.to(socket.id).emit('success');
			console.log('Test account Joined: '+testEmail+', '+testUsername);
			console.log("Number of active users: "+onlinePlayers.length);
			testAccountCount++;
		}else{
			io.to(socket.id).emit('failed new user', {username: "Account List Full", email: false, password: false});
		}
	});
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
				//inserts new client into database
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
				//adds a simpler object with only the minimum options to allonlineplayers
				client.sadd('allOnlinePlayers', data.email.toLowerCase());
				clientPub.publish(playerChannel, JSON.stringify({
					type: "update",
					unique: data.email.toLowerCase(),
					data: {
						username: data.username,
						x: startPosX,
						y: startPosY,
						facing: "S",
						moving: false,
						action: ""
					}
				}));
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
							let x = parseFloat(hash.x);
							let y = parseFloat(hash.y);
							let player = new Player(hash.username, hash.email, hash.password, hash.socket, x, 
								y, charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance, 
								parseInt(hash.gold), hash.facing, JSON.parse(hash.xp), JSON.parse(hash.skills), 
								JSON.parse(hash.inventory), JSON.parse(hash.bankedItems));
							onlinePlayers[socket.id] = player;
							clientPub.publish(playerChannel, JSON.stringify({
								type: "update",
								unique: data.email.toLowerCase(),
								data: {
									username: hash.username,
									x: x,
									y: y,
									facing: hash.facing,
									moving: false,
									action: ""
								}
							}));
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

	//removes player from appropriate lists so they aren't drawn onscreen and can login again etc.
	socket.on('disconnect', function(){
		let player = findPlayer(socket.id);
		if(player !== false){
			clientPub.publish(playerChannel, JSON.stringify({
				type: "disconnect",
				unique: player.email,
			}));
			console.log('Player Disconnected: '+onlinePlayers[socket.id].email);
			client.srem('allOnlinePlayers', onlinePlayers[socket.id].email);
			delete onlinePlayers[socket.id];
		}	
	});

	//sets the player movement based on input
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

	//client presses E key
	socket.on('action', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.actions(map, vendObj, treesObj, client);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	//moves an item from inventory to off-inventory, drops item
	socket.on('drop item', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.dropItem(data, droppedItemsObj)
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	//swaps an items slot
	socket.on('swap item', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.swapItem(data);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	//picks up an item
	socket.on('clicked', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.clicked(data, droppedItemsObj)
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	//sellItemToVendor
	socket.on('sell item', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.sellItem(data, vendObj, client, clientPub, vendorChannel);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	//buyItemFromVendor
	socket.on('buy item', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.buyItem(data, vendObj, itemsObj, client, clientPub, vendorChannel);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	//Esc/E pressed cancels any action, fishing, woodcutting, banking, shopping etc.
	socket.on('stop', function(){
		let player = findPlayer(socket.id);
		if(player !== false){
			player.stop();
		}
	});

	//deposit items to bank
	socket.on('bank deposit', function(data){
		let player = findPlayer(socket.id);
		if(player !== false){
			let temp = player.bankDeposit(data);
			if(typeof temp === 'string' || temp instanceof String){
				io.to(socket.id).emit('Game Message', temp);
			}
		}
	});

	//withdraw item from bank
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
let gameLoopRunning = false;
setInterval(function() {
	if(!gameLoopRunning){
		gameLoopRunning = true;
		(async() => {
			let currentTime = (new Date()).getTime();
			let timeDifference = currentTime - lastUpdateTime;
			for(let i in onlinePlayers){
				let packet = onlinePlayers[i].tick(io, i, treesObj, calcObj, map, itemsObj, timeDifference, 
					mapObj, allOnlinePlayers, vendObj, droppedItemsObj, levelTable, client, clientPub, playerChannel);
				io.to(i).emit('update', packet);
			}
			lastUpdateTime = currentTime;
			gameLoopRunning = false;
		})();
	}
}, 1000 / gamespeed);

//finds player based on supplied socket.
function findPlayer(socket){
	if(socket in onlinePlayers){
		return onlinePlayers[socket];
	}else{
		return false;
	}
}

/*
	below is only used to run commands in the cli; handles exit and processMap
*/

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
			case "processMap":
				mapObj.processMap();
				map = mapObj.getMap();
				break;
			case "q":
			case "exit":
				if(testingEnabled){
					for(let i = 0; i<testAccountCount+1; i++){
						client.del(i+"@madeupemail.com");
					}
				}
				console.log("exiting...");	
				process.exit();
				break;
			default:
				console.log("Not a command, try again...");
		}
	}
})();