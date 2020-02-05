module.exports = class SocketHandler{
	constructor(io, hasher, Player){
		this.io = io;
		this.hasher = hasher;
		this.Player = Player;
	}

	newPlayer(data, socket, players, activeplayers, startPosX, startPosY, charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance){
		let errors = false;
		let error = {
			username: false,
			email: false,
			password: false
		};
		let allplayers = players.getAllPlayers();
		if(data.username.length < 3 || data.username.length > 32){
			error.username = "Username must be between 3 and 32 characters";
			errors = true;
		} else {
			if((allplayers.find(e => e.username.toLowerCase() === data.username.toLowerCase())) !== undefined){
				error.username = "Username already exists";
				errors = true;
			}
		}
		if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)){
			error.email = "Email is not in a valid format";
			errors = true;
		} else {
			if((allplayers.find(e => e.email.toLowerCase() === data.email.toLowerCase())) !== undefined){
				error.email = "Email already exists";
				errors = true;
			}
		}		
		if(data.password.length < 8 || data.password.length > 128){
			error.password = "Password must be be at least 8 characters";
    		errors = true;
		}
		
		if(!errors){
			let player = new this.Player(data.username, data.email, this.hasher.hash(data.password), socket, startPosX, startPosY, 
				charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance);
			players.addPlayer(player);
			activeplayers.addPlayer(player);
			this.io.to(socket).emit('success');
			console.log('Player: '+data.username+ ' joined');
		} else {
			this.io.to(socket).emit('failed login', error);
		}
	}

	returningPlayer(data, allplayers, activePlayers, socket){
		let errors = false;
		let error = {
			email: false,
			password: false
		};
		let user;
		if(!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.email)){
			error.email = "Email is not in a valid format";
			errors = true;
		}else if(data.password.length < 8 || data.password.length > 128){
			error.password = "Invalid password";
			errors = true;
		} else {
			let password = "";
			user = allplayers.getIndividualPlayer('email', data.email.toLowerCase());
			if(user !== false){
				if(this.hasher.hash(data.password) !== user.password){
					error.password = "Password doesn't match";
					errors = true;
				}
			}else{
				error.email = "Email address not found";
				errors = true;
			}
		}
		if(activePlayers.findPlayer('email', data.email.toLowerCase()) !== false){
			error.email = "Account already in use";
			errors = true;
		}
		
		if(!errors){
			user.socket = socket;
			activePlayers.addPlayer(user);
			console.log('Player: '+user.username+ ' joined');
			this.io.to(socket).emit('success');
		}else{
			this.io.to(socket).emit('failed login', error);
		}
	}

	disconnect(socket, activeplayers, allplayers){
		activeplayers.removePlayer(socket, allplayers);
	}

	movement(user, data, socket, activeplayers){
		user.movement = data;
		if(data.left === true || data.right === true || data.up === true || data.down === true){
			user.moving = true;
			user.action = "";
		}else{
			user.moving = false;
		}
	}

	action(user, data, socket, activeplayers, map, io){
		switch(data){
			case "fish":
				let temp = user.actionFishing(map);
				if(typeof temp === 'string' || temp instanceof String){
					io.to(socket).emit('Game Error', temp);
				}
				break;
		}
	}
}