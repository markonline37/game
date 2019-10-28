var gamespeed = 60;

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
const mapsize = 100;
const drawdistance = 20;
const startPosX = 50;
const startPosY = 50;

app.use('/static', express.static(__dirname + '/static'));

// Starts the server.
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(5000, function() {

});

var allplayers = [];
var activeplayers = [];
var map = {};

//on server start populate allplayers synchronously
populatePlayers();
loadMap();
console.log("Server Load Complete");


io.on('connection', function(socket) {

	//new player
	socket.on('new player', function(data) {
		var errors = false;
		var error = {
			username: false,
			email: false,
			password: false
		};
		//server sided username validation
		if(data.username.length < 3 || data.username.length > 32){
			error.username = "Username must be between 3 and 32 characters";
			errors = true;
		} else {
			for(var i = 0, j = allplayers.length; i < j; i++){
				if(allplayers[i].username === data.username){
					error.username = "Username already exists";
					errors = true;
				}
			}
		}
		//server sided email validation
		if(!emailIsValid(data.email)){
			error.email = "Email is not in a valid format";
			errors = true;
		} else {
			for(var i = 0, j = allplayers.length; i < j; i++){
				if(allplayers[i].email === data.email){
					error.email = "Email already exists";
					errors = true;
					break;
				}
			}
		}		
		//server sided password validation
		if(data.password.length < 4 || data.password.length > 32){
			error.password = "Password must be between 4 and 32 characters";
    		errors = true;
		}
		
		if(!errors){
			var player = {
				username: data.username,
				email: data.email,
				password: hasher.hash(data.password),
				socket: socket.id,
				gold: 0,
				x: startPosX,
				y: startPosY
			};
			allplayers.push(player);
			activeplayers.push(player);
			console.log('Player: ' + player.username + ' joined');
			socket.emit('success');
			console.log(allplayers);
		} else {
			socket.emit('failed new user', error);
		}
	});

	//existing user login
	socket.on('returning player', function(data){
		var errors = false;
		var error = {
			email: false,
			password: false
		};
		var emailfound = false;
		var password = "";
		//check password length
		if(data.password.length < 4 || data.password.length > 32){
			error.password = "Invalid password";
			errors = true;
		} else {
			for(var i = 0, j = allplayers.length; i < j; i++){
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
			for(var i=0, j = allplayers.length; i<j; i++){
				if(allplayers[i].email === data.email){
					var player = allplayers[i];
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
				console.log('Player: ' + activeplayers[i].username + ' left');
				for(var i=0, j = activeplayers.length; i<j; i++){
					if(allplayers[i].email === activeplayers[i].email){
						allplayers[i].socket = "";
					}
				}
				activeplayers.splice(i, 1);
			}
		}
	});
});

setInterval(function() {
	//io.sockets.emit('state', players);
	for(var i = 0, j = activeplayers.length; i < j; i++){
		io.to(activeplayers[i].socket).emit('update', calcPacket(activeplayers[i]));
	}
},30000);//1000 / gamespeed);

//https://tylermcginnis.com/validate-email-address-javascript/
function emailIsValid (email) {
  	return /\S+@\S+\.\S+/.test(email);
}

//backup every 5 minutes
setInterval(function(){
	writeToFile();
}, 300000);
function writeToFile(){
	var data = JSON.stringify(allplayers, null, 4);
	fs.writeFile(file, data, (err) => {
		if (err) throw err;
	});
}

function calcPacket(input){
	var player = {
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
	var x = Math.floor(x);
	var y = Math.floor(y);
	var calcArray = [];
	var xmin = x - drawdistance;
	var xmax = x + drawdistance;
	var ymin = y - drawdistance;
	var ymax = y + drawdistance;
	for(var j = ymin; j < ymax; j++){
		var tempArray = [];
		for(var i = xmin; i < xmax; i++){
			if(i < 0 || i > mapsize || j < 0 || j > mapsize){
				tempArray.push(0);
			}else{
				tempArray.push(map.layers[n][j][i]);
			}
		}
		calcArray.push(tempArray);
	}
	return calcArray;
}

//populate allplayers synchronously
function populatePlayers(){
	console.log("Loading Players...");
	data = fs.readFileSync(file);
	if(data.length > 2){
		allplayers = JSON.parse(data);
		console.log("Loading Players Done.");
	} else {
		console.log("Players is empty");
	}
	
}
//load map synchronously
function loadMap(){
	try{
		console.log("Loading Map...");
		var temp = fs.readFileSync(mapfile);
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
			var temp = fs.readFileSync(unprocessedMap);
			var tempData = JSON.parse(temp);
			var mapObj = {
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
			var date = new Date();
			var day = ("0" + date.getDate()).slice(-2);
			var month = ("0" + (date.getMonth() + 1)).slice(-2);
			var year = date.getFullYear();
			var hours = date.getHours();
			var minutes = date.getMinutes();
			var seconds = date.getSeconds();
			var currentDate = "Yr"+year + "Mon" + month + "Day" + day + "Hr" + hours + "Min" + minutes + "Sec" + seconds;
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
	var newMap = [];
	var j = Math.sqrt(input.layers[n].data.length);
	var count = 0;
	for(var i = 0; i < j; i++){
		var tempArray = [];
		for(var k = 0; k < j; k++){
			tempArray.push(input.layers[n].data[count]);
			count++;
		}
		newMap.push(tempArray);
	}
	return newMap;
}

const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
rl.on('SIGINT', () => {
  	console.log("Backing up and exiting");	
	(async () => {
		await fssync.writeFile(file, JSON.stringify(allplayers, null, 4));
		process.exit();
	})();
});
rl.question('', (answer) => {
	if (answer.match("processMap")) processMap();
	if (answer.match("x")) console.log(calcPacket(allplayers[0]).map["layer1"]);
});