module.exports = class Items{
	constructor(){
		this.fish = [
				{
				minlevel: "0",
				maxlevel: "10",
				name: "Brown Trout",
				xp: 20,
				item: 0
			},
			{
				minlevel: "5",
				maxlevel: "15",
				name: "Salmon",
				xp: 40,
				item: 1
			},
			{
				minlevel: "10",
				maxlevel: "20",
				name: "Carp",
				xp: 50,
				item: 2
			},
			{
				minlevel: "15",
				maxlevel: "25",
				name: "Bass",
				xp: 60, 
				item: 3
			}
		];
	}

	getFish(){
		return this.fish;
	}

	findItem(name){
		let found = false;
		let item;
		if(!found){
			for(let i = 0, j = this.fish.length; i<j; i++){
				if(this.fish[i].name === name){
					item = this.fish[i];
					found = true;
					break;
				}
			}
		}
		if(found){
			return item;
		}else{
			return null;
		}
	}
}