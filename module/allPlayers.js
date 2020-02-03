module.exports = class AllPlayers{
	constructor(fs, fssync, Player, charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance){
		this.playerContainer = [];
		this.file = 'storage.json';
		this.fssync = fssync;
		
		let data = fs.readFileSync(this.file);
		if(data.length > 2){
			let temp = JSON.parse(data);
			//incase of crash and restored backup - reset the properties.
			for(let i = 0, j = temp.length; i < j; i++){
				temp[i].socket = "";
				temp[i].action = "";
				temp[i].moving = false;
				temp[i].movement.up = false;
				temp[i].movement.right = false;
				temp[i].movement.down = false;
				temp[i].movement.left = false;
				let player = new Player(temp[i].username, temp[i].email, temp[i].password, temp[i].socket, temp[i].x, temp[i].y,
					charactersize, movespeed, horizontaldrawdistance, verticaldrawdistance, temp[i].gold, temp[i].facing, temp[i].xp, 
					temp[i].skills, temp[i].inventory);
				this.playerContainer.push(player);
			}
		} else {
			console.log("Players is empty");
		}
	}

	addPlayer(player){
		this.playerContainer.push(player);
	}

	getAllPlayers(){
		return this.playerContainer;
	}

	getIndividualPlayer(identifier, input){
		let index = this.playerContainer.findIndex(e => e[identifier] === input);
		if(index !== null && index !== undefined && index !== -1){
			return this.playerContainer[index];
		}else{
			return false;
		}
	}

	async backup(activeplayers){
		try{
			let users = activeplayers.getPlayers();
			let j = users.length;
			if(j > 0){
				for(let i = 0; i < j; i++){
					let index = this.getIndividualPlayer('email', users[i].email);
					this.playerContainer[index] = users[i];
				}
				let data = JSON.stringify(this.playerContainer, null, 4);
				await this.fssync.writeFile(this.file, data);
			}
		}catch(err){
			console.log(err);
		}
		return null;
	}
}