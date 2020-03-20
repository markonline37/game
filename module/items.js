module.exports = class Items{
	//list of all items, might want to move this to json file and load it in, in the future.
	constructor(){
		this.items = [
			{
				type: "fish",
				minlevel: "0",
				maxlevel: "10",
				name: "Brown Trout",
				xp: 20,
				item: 0,
				price: 10
			},
			{
				type: "fish",
				minlevel: "5",
				maxlevel: "15",
				name: "Salmon",
				xp: 40,
				item: 1,
				price: 15
			},
			{
				type: "fish",
				minlevel: "10",
				maxlevel: "20",
				name: "Carp",
				xp: 50,
				item: 2,
				price: 20
			},
			{
				type: "fish",
				minlevel: "15",
				maxlevel: "25",
				name: "Bass",
				xp: 60, 
				item: 3,
				price: 30
			},
			{
				type: "junk",
				name: "Rusted can",
				item: 4,
				price: 2
			},
			{
				type: "junk",
				name: "Branch",
				item: 5,
				price: 1
			},
			{
				type: "junk",
				name: "Old Boot",
				item: 6,
				price: 2
			},
			{
				type: "log",
				name: "Basic Log",
				minlevel: 0,
				item: 7,
				xp: 30,
				price: 5
			}
		];
	}

	//gets items array with type junk.
	getJunk(){
		let temp = [];
		for(let i = 0, j = this.items.length; i<j; i++){
			if(this.items[i].type === "junk"){
				temp.push(this.items[i]);
			}
		}
		return temp;
	}

	//gets items array with type fish
	getFish(){
		let temp = [];
		for(let i = 0, j = this.items.length; i<j; i++){
			if(this.items[i].type === "fish"){
				temp.push(this.items[i]);
			}
		}
		return temp;
	}

	//find a specific item by it's item property (id)
	findItem(item){
		for(let i = 0, j = this.items.length; i<j; i++){
			if(this.items[i].item === item){
				return this.items[i];
			}
		}
		return false;
	}
}