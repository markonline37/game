const testingEnabled = true;

const cluster = require('cluster');	
const numCPUs = require('os').cpus().length;
//const numCPUs = 4;

const charactersize = 32;
const movespeed = 0.01;
const verticaldrawdistance = 40;
const horizontaldrawdistance = 46;
const startPosX = 50;
const startPosY = 50;
const gamespeed = 60;
const startGold = 0;

var map = null;
var mapObj = null;

const fs = require('fs');
const fssync = require('fs').promises;
const hasher = require('./module/hash');

if(cluster.isMaster){
	/*
		todo:
			Functionality to move to master when cluster is implemented;
				client.del('allOnlinePlayers')
				trees - setup pub/sub
				droppedItems - setup pub/sub
				master maintains a copy of allOnlinePlayers - function to get all players on worker start
					master sub AllPlayers ->client pub allPlayers -> master pub allPlayers -> 
					client sub allPlayersListener, if(not already loaded){ load all players}
				Restart workers
					master delete players from allOnlinePlayers for that worker, and pub newAllPlayers
				Restart Master
					master sub workerListener -> master pub iAmNewMaster -> client pub workerListener(name of worker)

				***Might be easier/better to use node's cluster communication instead of ioredis pub/sub
			
			Finish map
			Add data persistence to redis
			Update woodcutting animation.

	*/

	var testNames;
	var testAccountCount = 0;

	(async () => {
		if(testingEnabled){
			try{
				testNames = await JSON.parse(fs.readFileSync('./storage/testNames.json'));
			}catch(err){
				console.log(err);
			}
		}
		const Mapp = require('./module/map');
		mapObj = await new Mapp(fs, fssync);
		map = await mapObj.getMap();
	})();

	const workers = [];

	for(let i = 0; i< numCPUs; i++){
		let worker = cluster.fork();
		worker.on('message', function(message){
			let data = JSON.parse(message);
			if(data.type === "packet"){
				io.to(data.socket).emit('update', data.packet);
				if(data.socket in onlinePlayers){
					onlinePlayers[data.socket] = data.player;
				}
			}
		})
		workers.push(worker);
	}

	var redis = require('redis');
	var client = redis.createClient();
	client.on('connect', function(){
		client.del('allOnlinePlayers');
		console.log('redis connection: connected');
		console.log("Master is Ready");
	});
	client.on("error", function(error) {
	  console.error(error);
	});

	//can use await keyword with hgetallAsync
	const {promisify} = require('util');
	const hgetallAsync = promisify(client.hgetall).bind(client);

	const ioredis = require('ioredis');
	const clientPub = new ioredis();
	const playerChannel = 'playerChannel';

	var express = require('express');
	var http = require('http');
	var path = require('path');
	var socketIO = require('socket.io');
	var app = express();
	var server = http.Server(app);
	var io = socketIO(server, { forceNew: true });
	app.set('port', 5000);

	(async () => {
		let vendorhash = await hgetallAsync('vendor');
		for(let i = 0, j = workers.length; i<j; i++){
			workers[i].send(JSON.stringify({
				type: "load vendors",
				vendorhash: vendorhash
			}));
		}
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
				let player = {
						username: testUsername,
						email: testEmail,
						password: testPassword,
						gold: startGold,
						x: startPosX,
						y: startPosY,
						movement: {
							left: false,
							right: false,
							up: false,
							down: false
						},
						currentlyFishing: false,
						fishingEnvironment: "fresh",
						facing: "S",
						xp: {
							fishing: 0,
							woodcutting: 0
						},
						skills: {
							fishing: 0,
							woodcutting: 0
						},
						action: "",
						inventory: {
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
							},
						equippedMainHand: "riverRod",
						maxlevel: 20,
						bankedItems: [],
						playerAction: "",
						data: ""
					}
				onlinePlayers[socket.id] = player;
				io.to(socket.id).emit('success', map);
				console.log('Test account Joined: '+testEmail+', '+testUsername);
				console.log("Number of active users: "+Object.keys(onlinePlayers).length);
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
					error.password = "Password must be at least 8 characters";
		    		errors = true;
				}
				
				if(!errors){
					//inserts new client into database
					
					//adds a simpler object with only the minimum options to allOnlinePlayers
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
					
					let player = {
						username: data.username,
						email: data.email.toLowerCase(),
						password: hasher.hash(data.password),
						gold: startGold,
						x: startPosX,
						y: startPosY,
						movement: {
							left: false,
							right: false,
							up: false,
							down: false
						},
						currentlyFishing: false,
						fishingEnvironment: "fresh",
						facing: "S",
						xp: {
							fishing: 0,
							woodcutting: 0
						},
						skills: {
							fishing: 0,
							woodcutting: 0
						},
						action: "",
						inventory: {
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
							},
						equippedMainHand: "riverRod",
						maxlevel: 20,
						bankedItems: [],
						playerAction: "",
						data: ""
					}
					client.hmset(data.email.toLowerCase(), {
						'username': data.username,
						'email': data.email.toLowerCase(),
						'password': hasher.hash(data.password),
						'gold': startGold,
						'x': startPosX,
						'y': startPosY,
						'movement': JSON.stringify({
							left: false,
							right: false,
							up: false,
							down: false
						}),
						'currentlyFishing': false,
						'fishingEnvironment': "fresh",
						'facing': "S",
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
						'equippedMainHand': "riverRod",
						'maxLevel': 20,
						'bankedItems': JSON.stringify([]),
						'playerAction': "",
						'data': ""

					});

					onlinePlayers[socket.id] = player;
					io.to(socket.id).emit('success', map);
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
								let player = {
									username: hash.username,
									email: hash.email,
									password: hash.password,
									gold: parseInt(hash.gold),
									x: parseFloat(hash.x),
									y: parseFloat(hash.y),
									movement: {
										left: false,
										right: false,
										up: false,
										down: false
									},
									currentlyFishing: false,
									fishingEnvironment: "fresh",
									facing: hash.facing,
									xp: JSON.parse(hash.xp),
									skills: JSON.parse(hash.skills),
									action: "",
									inventory: JSON.parse(hash.inventory),
									equippedMainHand: "riverRod",
									maxlevel: 20,
									bankedItems: JSON.parse(hash.bankedItems),
									playerAction: "",
									data: ""
								}
								onlinePlayers[socket.id] = player;
								clientPub.publish(playerChannel, JSON.stringify({
									type: "update",
									unique: data.email.toLowerCase(),
									data: {
										username: hash.username,
										x: parseFloat(hash.x),
										y: parseFloat(hash.y),
										facing: hash.facing,
										moving: false,
										action: ""
									}
								}));
								console.log('Player Joined: '+data.email.toLowerCase());
								io.to(socket.id).emit('success', map);
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
					player.action = "moving";
				}else{
					player.action = "";
				}
			}
		});

		//client presses E key
		socket.on('action', function(data){
			let player = findPlayer(socket.id);
			if(player !== false){
				player.playerAction = "E";
			}
		});

		//moves an item from inventory to off-inventory, drops item
		socket.on('drop item', function(data){
			let player = findPlayer(socket.id);
			if(player !== false){
				player.playerAction = "drop item";
				player.data = data;
			}
		});

		//swaps an items slot
		socket.on('swap item', function(data){
			let player = findPlayer(socket.id);
			if(player !== false){
				player.playerAction = "swap item";
				player.data = data;
			}
		});

		//picks up an item
		socket.on('clicked', function(data){
			let player = findPlayer(socket.id);
			if(player !== false){
				player.playerAction = "clicked";
				player.data = data;
			}
		});

		//sellItemToVendor
		socket.on('sell item', function(data){
			let player = findPlayer(socket.id);
			if(player !== false){
				player.playerAction = "sell item";
				player.data = data;
			}
		});

		//buyItemFromVendor
		socket.on('buy item', function(data){
			let player = findPlayer(socket.id);
			if(player !== false){
				player.playerAction = "buy item";
				player.data = data;
			}
		});

		//Esc/E pressed cancels any action, fishing, woodcutting, banking, shopping etc.
		socket.on('stop', function(){
			let player = findPlayer(socket.id);
			if(player !== false){
				player.action = "";
			}
		});

		//deposit items to bank
		socket.on('bank deposit', function(data){
			let player = findPlayer(socket.id);
			if(player !== false){
				player.playerAction = "bank deposit";
				player.data = data;
			}
		});

		//withdraw item from bank
		socket.on('bank withdraw', function(data){
			let player = findPlayer(socket.id);
			if(player !== false){
				player.playerAction = "bank withdraw";
				player.data = data;
			}
		});
	})

	//main loop
	let lastUpdateTime = (new Date()).getTime();
	//assigns processing to workers in a roundRobin approach.
	let workerIncrement = 0;
	setInterval(function() {
		let currentTime = (new Date()).getTime();
		let timeDifference = currentTime - lastUpdateTime;
		for(let i in onlinePlayers){
			workers[workerIncrement].send(JSON.stringify({
				type: "process player",
				socket: i,
				timeDifference: timeDifference,
				playerInfo: onlinePlayers[i]
			}));
			if(numCPUs > 1){
				workerIncrement++;
				if(workerIncrement === numCPUs-1){
					workerIncrement = 0;
				}
			}
		}
		lastUpdateTime = currentTime;
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
}else{
	//worker process --------------------------------------

	var allOnlinePlayers = {};

	var redis = require('redis');
	var client = redis.createClient();
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

	const Player = require('./module/player');
	const Calculator = require('./module/calculator');
	const Items = require('./module/items.js');
	const Mapp = require('./module/map');
	const Vendors = require('./module/vendors.js');
	const Trees = require('./module/trees');
	const DroppedItem = require('./module/droppedItems.js')

	var itemsObj, calcObj, vendObj, treesObj, droppedItemsObj, levelTable;

	var player = new Player(horizontaldrawdistance, verticaldrawdistance, charactersize, movespeed);

	(async () => {
		mapObj = await new Mapp(fs, fssync);
		map = await mapObj.getMap();
		itemsObj = await new Items();
		calcObj = await new Calculator(itemsObj.getFish(), itemsObj.getJunk());
		treesObj = await new Trees(map);
		droppedItemsObj = await new DroppedItem(horizontaldrawdistance/2, verticaldrawdistance/2);
		try{
			let temp = fs.readFileSync('./storage/leveltable.json');
			levelTable = JSON.parse(temp);
		}catch(err){
			console.log("error loading levelTable: "+err);
		}
		console.log("Worker #"+cluster.worker.id+" Ready");
	})();

	process.on('message', function(msg){
		let data = JSON.parse(msg);
		if(data.type === "load vendors"){
			vendObj = new Vendors(fs, data.vendorhash);
		}else if(data.type === "process player"){
			processPlayer(data.playerInfo, data.socket, data.timeDifference);
		}
	});

	function processPlayer(p, socket, timeDifference){
		player.reassign(p.username, p.email, p.password, p.gold, p.x, p.y, p.movement, p.currentlyFishing, 
			p.fishingEnvironment, p.facing, p.xp, p.skills, p.action, p.inventory, p.equippedMainHand, 
			p.maxlevel, p.bankedItems, p.playerAction, p.data, map, vendObj, treesObj, client, droppedItemsObj, 
			clientPub, vendorChannel, itemsObj);

		let data = player.tick(treesObj, calcObj, map, itemsObj, timeDifference, mapObj, allOnlinePlayers, 
			vendObj, droppedItemsObj, levelTable, client, clientPub, playerChannel);
		process.send(JSON.stringify({
			type: "packet",
			socket: socket,
			packet: data.packet,
			player: data.player
		}));
	}
}