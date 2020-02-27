module.exports = class Items{
	constructor(){
		this.items = [
			{
				type: "fish",
				minlevel: "0",
				maxlevel: "10",
				name: "Brown Trout",
				xp: 20,
				item: 0,
			},
			{
				type: "fish",
				minlevel: "5",
				maxlevel: "15",
				name: "Salmon",
				xp: 40,
				item: 1
			},
			{
				type: "fish",
				minlevel: "10",
				maxlevel: "20",
				name: "Carp",
				xp: 50,
				item: 2
			},
			{
				type: "fish",
				minlevel: "15",
				maxlevel: "25",
				name: "Bass",
				xp: 60, 
				item: 3
			}
		];
	}

	getFish(){
		let temp = [];
		for(let i = 0, j = this.items.length; i<j; i++){
			if(this.items[i].type === "fish"){
				temp.push(this.items[i]);
			}
		}
		return temp;
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