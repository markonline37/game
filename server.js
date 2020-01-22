// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5000);

const db = require('./module/db');
const hasher = require('./module/hash');
const fs = require('fs');
const fssync = require('fs').promises;
const file = 'storage.json';
const unprocessedMap = './map/temp.json';
const mapfile = 'map.json';
const movespeed = 0.01;
const mapheight = 200;
const mapwidth = 200;
const verticaldrawdistance = 40;
const horizontaldrawdistance = 40;
const startPosX = 50;
const startPosY = 50;
const gamespeed = 60;

app.use('/', express.static(__dirname + '/public'));

// Starts the server.
app.get('/*', function(request, response) {
	response.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(5000, function() {

});

var allplayers = [];
var activeplayers = [];
var map = {};

(async () => {
	await populatePlayers();
	await loadMap();
	console.log("Server Load Complete");
})();

io.on('connection', function(socket) {

	//new player
	socket.on('new player', function(data) {
		let errors = false;
		let error = {
			username: false,
			email: false,
			password: false
		};
		//server sided username validation
		if(data.username.length < 3 || data.username.length > 32){
			error.username = "Username must be between 3 and 32 characters";
			errors = true;
		} else {
			for(let i = 0, j = allplayers.length; i < j; i++){
				if(allplayers[i].username === data.username){
					error.username = "Username already exists";
					errors = true;
				}
			}
		}
		//server sided email validation
		if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)){
			error.email = "Email is not in a valid format";
			errors = true;
		} else {
			for(let i = 0, j = allplayers.length; i < j; i++){
				if(allplayers[i].email === data.email){
					error.email = "Email already exists";
					errors = true;
					break;
				}
			}
		}		
		//server sided password validation
		if(data.password.length < 8){
			error.password = "Password must be be at least 8 characters";
    		errors = true;
		}
		
		if(!errors){
			let player = {
				username: data.username,
				email: data.email,
				password: hasher.hash(data.password),
				socket: socket.id,
				gold: 0,
				x: startPosX,
				y: startPosY,
				moving: false,
				facing: "S",
				movement: {
					up: false,
					down: false,
					left: false,
					right: false
				}
			};
			allplayers.push(player);
			activeplayers.push(player);
			console.log('Player: ' + player.username + ' joined');
			socket.emit('success');
		} else {
			socket.emit('failed new user', error);
		}
	});

	//existing user login
	socket.on('returning player', function(data){
		let errors = false;
		let error = {
			email: false,
			password: false
		};
		if(data.password.length < 8){
			error.password = "Invalid password";
			errors = true;
		} else {
			let emailfound = false;
			let password = "";
			for(let i = 0, j = allplayers.length; i < j; i++){
				if(allplayers[i].email === data.email){
					emailfound = true;
					password = allplayers[i].password;
				}
			}
			//if email doesn't exist
			if(!emailfound){
				error.email = "Email address not found";
				errors = true;
			} else {
				//if password doesn't match records
				if(hasher.hash(data.password) != password){
					error.password = "Password doesn't match";
					errors = true;
				}
			}
		}
		
		if(!errors){
			for(let i=0, j = allplayers.length; i<j; i++){
				if(allplayers[i].email === data.email){
					let player = allplayers[i];
					player.socket = socket.id;
					activeplayers.push(player);
					console.log('Player: ' + player.username + ' joined');
					socket.emit('success');
					break;
				}
			}
		} else {
			socket.emit('failed login', error);
		}
	});

	//on socket disconnect
	socket.on('disconnect', function(){
		for(var i=0, j = activeplayers.length; i<j; i++){
			if(activeplayers[i].socket === socket.id){
				for(var k=0, l = allplayers.length; k<l; k++){
					if(allplayers[k].email === activeplayers[i].email){
						console.log('Player: ' + activeplayers[i].username + ' left');
						allplayers[k] = activeplayers[i];
						allplayers[k].socket = "";
					}
				}
				activeplayers.splice(i, 1);
			}
		}
	});

	socket.on('movement', function(data){
		for(let i=0, j=activeplayers.length; i<j; i++){
			let temp = activeplayers[i];
			if(temp.socket === socket.id){
				temp.movement = data;
				if(data.left === true || data.right === true || data.up === true || data.down === true){
					temp.moving = true;
				}else{
					temp.moving = false;
				}
			}
		}
	});
});

//main loop
let lastPacket = {};
let lastUpdateTime = (new Date()).getTime();
setInterval(function() {
	let currentTime = (new Date()).getTime();
	let timeDifference = currentTime - lastUpdateTime;
	for(let i=0, j=activeplayers.length; i<j; i++){
		let user = activeplayers[i];
		calcMovement(user, timeDifference);
		let packet = calcPacket(user);
		//if lastPacket is empty
		if((Object.entries(lastPacket).length === 0 && lastPacket.constructor === Object)){
			lastPacket[user.email]=packet;
			io.to(activeplayers[i].socket).emit('update', packet);
		}else{
			//event based - only emit to client when a packet is different than last
			if(lastPacket[user.email] !== packet){
				io.to(activeplayers[i].socket).emit('update', packet);
				lastPacket[user.email]=packet;
			} 
		}
	}
	lastUpdateTime = currentTime;
}, 1000 / gamespeed);

//backup every 5 minutes
setInterval(function(){
	backup();
}, 300000);

function calcMovement(user, timeDifference){
	if(user.moving){
		let count = Object.values(user.movement).reduce((x,y)=>x+y, 0);
		if(count === 3){
			if(user.movement.left && user.movement.right){
				if(user.movement.up && map.layers["layer2"][Math.floor(user.y-(movespeed*timeDifference))][Math.floor(user.x)] === 0){
					user.y-=(movespeed*timeDifference);
					user.facing = "N";
				}else if(user.movement.down && map.layers["layer2"][Math.floor(user.y+(movespeed*timeDifference))][Math.floor(user.x)] === 0){
					user.y+=(movespeed*timeDifference);
					user.facing = "S";
				}
			}else if(user.movement.up && user.movement.down){
				if(user.movement.left){
					user.x-=(movespeed*timeDifference);
					user.facing = "W";
				}else{
					user.x+=(movespeed*timeDifference);
					user.facing = "E";
				}
			}
		}else if(count === 2){
			if(user.movement.left && user.movement.up){
				user.x-=((movespeed/2)*timeDifference);
				user.y-=((movespeed/2)*timeDifference);
				user.facing = "NW";
			}else if(user.movement.left && user.movement.down){
				user.x-=((movespeed/2)*timeDifference);
				user.y+=((movespeed/2)*timeDifference);
				user.facing = "SW";
			}else if(user.movement.right && user.movement.up){
				user.x+=((movespeed/2)*timeDifference);
				user.y-=((movespeed/2)*timeDifference);
				user.facing = "NW";
			}else if(user.movement.right && user.movement.down){
				user.x+=((movespeed/2)*timeDifference);
				user.y+=((movespeed/2)*timeDifference);
				user.facing = "NE";
			}
		}else if(count === 1){
			if(user.movement.left){
				user.x-=(movespeed*timeDifference);
				user.facing = "W";
			}else if(user.movement.right){
				user.x+=(movespeed*timeDifference);
				user.facing = "E";
			}else if(user.movement.up){
				user.y-=(movespeed*timeDifference);
				user.facing = "N";
			}else if(user.movement.down){
				user.y+=(movespeed*timeDifference);
				user.facing = "S";
			}
		}
	}
}

async function backup(){
	for(let i = 0, j = activeplayers.length; i < j; i++){
		for (let k = 0, l = allplayers.length; k < l;k++){
			if(activeplayers[i].email === allplayers[k].email){
				allplayers[k] = activeplayers[i];
			}
		}
	}
	let data = JSON.stringify(allplayers, null, 4);
	await fssync.writeFile(file, data);
}

function calcPacket(input){
	let player = {
		map: {
			layer1: calcPlayerMap(input.x, input.y, "layer1"),
			layer2: calcPlayerMap(input.x, input.y, "layer2"),
			layer3: calcPlayerMap(input.x, input.y, "layer3"),
			layer4: calcPlayerMap(input.x, input.y, "layer4")
		},
		player: {
			x: input.x,
			y: input.y
		},
		enemy: {

		}
	}
	return player;
}

function calcPlayerMap(x, y, n){
	x = Math.floor(x);
	y = Math.floor(y);
	let calcArray = [];
	let xmin = x - horizontaldrawdistance/2;
	let xmax = x + horizontaldrawdistance/2;
	let ymin = y - verticaldrawdistance/2;
	let ymax = y + verticaldrawdistance/2;
	for(let j = ymin; j < ymax; j++){
		var tempArray = [];
		for(let i = xmin; i < xmax; i++){
			if(i < 0 || i > mapwidth-1 || j < 0 || j > mapheight-1){
				tempArray.push(0);
			}else{
				tempArray.push(map.layers[n][j][i]);
			}
		}
		calcArray.push(tempArray);
	}
	return calcArray;
}

//populate allplayers
async function populatePlayers(){
	console.log("Loading Players...");
	let data = await fs.readFileSync(file);
	if(data.length > 2){
		allplayers = JSON.parse(data);
		console.log("Loading Players Done.");
		//incase of crash and restored backup - reset the sockets.
		for(let i = 0, j = allplayers.length; i < j; i++){
			allplayers[i].socket = "";
		}
	} else {
		console.log("Players is empty");
	}
	
}
//load map
async function loadMap(){
	try{
		console.log("Loading Map...");
		let temp = await fs.readFileSync(mapfile);
		map = JSON.parse(temp);
		console.log("Loading Map Done.");
	}catch(err){
		console.log(err);
	}
}

/*
processes file temp.json from main directory (temp.json created in tiled)
saves a backup of existing map.json (stored in backupmap)
overwrites current map.son, deletes temp.json and calls the loadMap() function.
*/
function processMap(){
	try{
		if(fs.existsSync(unprocessedMap)){
			let temp = fs.readFileSync(unprocessedMap);
			let tempData = JSON.parse(temp);
			let mapObj = {
				height: tempData.height,
				width: tempData.width,
				tilesize: tempData.tilewidth,
				layers: {
					"layer1": convertMap(tempData, 0),
					"layer2": convertMap(tempData, 1),
					"layer3": convertMap(tempData, 2),
					"layer4": convertMap(tempData, 3)
				}
			}

			//move old map, write new map to file, delete temp
			let date = new Date();
			let day = ("0" + date.getDate()).slice(-2);
			let month = ("0" + (date.getMonth() + 1)).slice(-2);
			let year = date.getFullYear();
			let hours = date.getHours();
			let minutes = date.getMinutes();
			let seconds = date.getSeconds();
			let currentDate = "Yr"+year + "Mon" + month + "Day" + day + "Hr" + hours + "Min" + minutes + "Sec" + seconds;
			(async () => {
				try{
					await fssync.mkdir('./backupmap/' + currentDate, {recursive: true});
					await fssync.copyFile(mapfile, './backupmap/' + currentDate + "/" + mapfile);
					await fssync.writeFile('./' + mapfile, JSON.stringify(mapObj));
					await loadMap();
					console.log("Map Updated.");
				}catch(err){
					console.log(err);
				}
			})();
		}
	}catch(err){
		console.log("Error: "+err);
	}
}

function convertMap(input, n){
	let newMap = [];
	let j = Math.sqrt(input.layers[n].data.length);
	let count = 0;
	for(let i = 0; i < j; i++){
		let tempArray = [];
		for(let k = 0; k < j; k++){
			tempArray.push(input.layers[n].data[count]);
			count++;
		}
		newMap.push(tempArray);
	}
	return newMap;
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
				processMap();
				break;
			case "active":
				console.log(activeplayers);
				break;
			case "all":
				console.log(allplayers);
				break;
			case "packet":
				console.log(calcPacket(allplayers[0]));
				break;
			case "map":
				console.log("Map size: "+map.layers["layer1"].length + " X "+map.layers["layer1"][0].length);
				break;
			case "backup":
				console.log("performing backup...");
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