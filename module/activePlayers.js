module.exports = class ActivePlayers{
	constructor(){
		this.playerContainer = [];
	}

	getPlayers(){
		return this.playerContainer;
	}

	addPlayer(player){
		this.playerContainer.push(player);
	}

	removePlayer(socket){
		let index = this.playerContainer.findIndex(e => e.socket === socket);
		console.log('Player: '+this.playerContainer[index].username+' disconnected');
		this.playerContainer.splice(index, 1);
	}

	findPlayer(identifier, input){
		let index = this.playerContainer.findIndex(e => e[identifier] === input);
		if(index !== null && index !== undefined && index !== -1){
			return this.playerContainer[index];
		}else{
			return false;
		}
	}

	disconnect(socket, allplayers){
		let userAll = allplayers.getIndividualPlayer('socket', socket);
		let userActive = findPlayer('socket', socket);
		userAll.socket = "";
		userAll = userActive;
		this.removePlayer(socket);
	}
}