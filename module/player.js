module.exports = class Player{
	constructor(username, email, password, socket, x, y, charactersize, movespeed, horizontaldraw, verticaldraw, gold, facing, xp, skills, inventory){
		this.username = username;
		this.email = email;
		this.password = password;
		this.socket = socket;
		if(gold === undefined){
			this.gold = 0;
		}else{
			this.gold = gold;
		}
		this.x = x;
		this.y = y;
		this.moving = false;
		this.horizontaldraw = horizontaldraw;
		this.verticaldraw = verticaldraw;
		this.charactersize = charactersize;
		this.movespeed = movespeed;
		this.currentlyFishing = false;
		this.fishingEnvironment = "";
		if(facing === undefined){
			this.facing = "S";
		}else{
			this.facing = facing;
		}
		this.movement = {
			up: false,
			down: false,
			left: false,
			right: false
		};
		if(xp === undefined){
			this.xp = {
				fishing: 0,
				woodcutting: 0
			};
		}else{
			this.xp = xp;
		}
		if(skills === undefined){
			this.skills = {
				fishing: 0,
				woodcutting: 0
			}
		}else{
			this.skills = skills;
		}
		this.action = "";
		if(inventory === undefined){
			this.inventory = {
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
			};
		}else{
			this.inventory = inventory
		}
		this.equippedMainHand = "riverRod";
		this.droppedItemList = [];
		this.maxlevel = 20;
		this.levelTable = {
			"1": 100, //110
			"2": 210, //122
			"3": 332, //136
			"4": 468, //154
			"5": 622, //176
			"6": 798, //202
			"7": 1033, //235
			"8": 1268, //274
			"9": 1542, //324
			"10": 1866, //386
			"11": 2252, //463
			"12": 2715, //560
			"13": 3275, //683
			"14": 3958, //841
			"15": 4799, //1043
			"16": 5842, //1303
			"17": 7145, //1642
			"18": 8787, //2086
			"19": 10873, //2670
			"20": 13543 //3445
		};
	}

	equipMainHand(input){
		this.equippedMainHand = input;
	}

	clicked(data, allItems){
		let itemPosition = null;
		for(let i = 0, j = this.droppedItemList.length; i<j; i++){
			let t = this.droppedItemList[i];
			if(data.x >= t.x-0.5 && data.x <= t.x+0.5 && data.y >= t.y-0.5 && data.y <= t.y+0.5){
				itemPosition = i;
			}
		}
		if(itemPosition !== null){
			return this.pickUpItem(this.droppedItemList[itemPosition], allItems, itemPosition);
		}
	}

	swapItem(data){
		let oldslot = data.old;
		let newslot = data.new;
		if(this.inventory["slot"+oldslot] !== "" || this.inventory["slot"+newslot] !== ""){
			let temp = this.inventory["slot"+newslot];
			this.inventory["slot"+newslot] = this.inventory["slot"+oldslot];
			this.inventory["slot"+oldslot] = temp;
		}
	}

	dropItem(slot){
		if(this.inventory["slot"+slot] !== "" && slot !== null){
			let temp = this.inventory["slot"+slot];
			this.droppedItem(temp);
			this.inventory["slot"+slot] = "";
			return 'Dropped item: '+temp.name;
		}
	}

	droppedItem(input){
		let item = {
			type: input,
			x: this.x,
			y: this.y
		}
		this.droppedItemList.push(item);
		setTimeout(function(){
			let foundItem = null;
			for(let i = 0, j = this.droppedItemList.length; i<j; i++){
				if(this.droppedItemList[i].id === item.id){
					this.droppedItemList.splice(i, 1);
					break;
				}
			}
		}.bind(this), 60000);
	}

	pickUpItem(item, allItems, i){
		if(!this.emptySpace()){
			return "Cannot pick up, bag is full";
		}
		let distanceX;
		let distanceY;
		let pickUpDistance = 5;
		if(this.x > item.x){
			distanceX = this.x - item.x;
		}else{
			distanceX = item.x - this.x;
		}
		if(this.y > item.y){
			distanceY = this.y - item.y;
		}else{
			distanceY = item.y - this.y;
		}
		if((distanceY >= 0 && distanceY <= pickUpDistance)&&(distanceX >=0 && distanceX <= pickUpDistance)){
			this.addItem(item.type);
			this.droppedItemList.splice(i, 1);
			return "Picked up item: "+item.type.name;
		}else{
			return "Not within range of item";
		}
	}

	addXP(skill, xp, io, socket){
		//apply xp
		this.xp[skill]+=xp;
		//check for level up
		if(this.skills[skill] < this.maxlevel){
			if(this.levelTable[this.skills[skill]+1]<=this.xp[skill]){
				//level up
				this.skills[skill]++;
				let temp = 'You leveled up in '+skill+' to level '+this.skills[skill];
				io.to(socket).emit('Game Message', temp);
			}
		}
	}

	emptySpace(){
		for(let i in this.inventory){
			if(this.inventory[i] === ""){
				return true;
			}
		}
		return false;
	}

	addItem(item){
		for(let i in this.inventory){
			if(this.inventory[i] === ""){
				this.inventory[i] = item;
				return true;
			}
		}
		return false;
	}

	checkFishingEquipment(){
		let test = false;
		if(this.equippedMainHand === "riverRod"){
			test = true;
			this.fishingEnvironment = "fresh";
		}else if(this.equippedMainHand === "oceanRod"){
			test = true;
			this.fishingEnvironment = "salt";
		}
		if(test){
			return true;
		}else{
			return false;
		}
	}

	actionFishing(map){
		this.action="";
		if(!this.emptySpace()){
			return "Bag is full";
		}else if(!this.checkFishingEquipment()){
			return "No fishing equipment in main hand";
		}else{
			let tile;
			let userx = Math.floor(this.x);
			let usery = Math.floor(this.y);
			switch(this.facing){
				case "N":
					tile = map.layers["layer2"][usery-1][userx];
					break;
				case "S":
					tile = map.layers["layer2"][usery+1][userx];
					break
				case "E":
					tile = map.layers["layer2"][usery][userx+1];
					break
				case "W":
					tile = map.layers["layer2"][usery][userx-1];
					break;
				case "NE":
					tile = map.layers["layer2"][usery-1][userx+1];
					break;
				case "NW":
					tile = map.layers["layer2"][usery-1][userx-1];
					break;
				case "SE":
					tile = map.layers["layer2"][usery+1][userx+1];
					break;
				case "SW":
					tile = map.layers["layer2"][usery-1][userx-1];
					break;
			}
			if(tile < 300 || tile > 398){
				return "Not facing water";
			}else{
				if(this.equippedMainHand !== "oceanRod" && (tile>=304&&tile<=350)){
					return "Wrong fishing equipment for this environment";
				}else if(this.equippedMainHand !== "riverRod" && (tile>=352&&tile<=398)){
					return "Wrong fishing equipment for this environment";
				}else{
					this.action = "fishing";
					return true;
				}
			}
		}
	}

	tickFish(fishingLootTable, io, socket){
		if(!this.emptySpace()){
			this.action = "";
			return "Bag is full";
		}else{
			if(!this.currentlyFishing){
				this.currentlyFishing = true;
				let timer = Math.floor(Math.random() * 7000)+2000;
				setTimeout(function(){
					if(this.action === "fishing"){
						let fish = fishingLootTable.calcLoot(this.skills.fishing);
						this.addItem(fish);
						this.addXP('fishing', fish.xp, io, socket);
						this.currentlyFishing = false;
						return String("Caught a "+fish.name);
					}else{
						this.currentlyFishing = false;
					}
				}.bind(this), timer);
			}
			/*if((Math.floor(Math.random()*Math.floor(1000-this.skills.fishing))) <= 1){
				let fish = fishingLootTable.calcLoot(this.skills.fishing);
				this.addItem(fish);
				this.addXP('fishing', fish.xp, io, socket);
				return String("Caught a "+fish.name);
			}*/
		}
	}

	calcPlayerMap(map){
		let returnObj = {};
		let xmin = Math.floor(this.x) - this.horizontaldraw/2;
		let xmax = Math.floor(this.x) + this.horizontaldraw/2;
		let ymin = Math.floor(this.y) - this.verticaldraw/2;
		let ymax = Math.floor(this.y) + this.verticaldraw/2;

		let maparr = ["layer0", "layer00", "layer1", "layer2", "layer3", "layer4"];

		for(let l = 0, k = maparr.length; l < k; l++){
			let calcarr = [];
			for(let j = ymin; j < ymax; j++){
				let temparr = [];
				for(let i = xmin; i < xmax; i++){
					if(i < 0 || i > map.width-1 || j < 0 || j > map.height-1){
						temparr.push(0);
					}else{
						temparr.push(map.layers[maparr[l]][j][i]);
					}
				}
				calcarr.push(temparr);
			}
			returnObj[maparr[l]] = calcarr;
		}
		return returnObj;
	}

	calcPacket(map, activeplayers){
		let list = activeplayers.getPlayers();
		let active = [];
		for(let i = 0, j = list.length; i < j; i++){
			if(list[i].email !== this.email){
				let isInHoriRange = false;
				let isInVertRange = false;
				if(this.x > list[i].x){
					if(this.x-list[i].x <= this.horizontaldraw/2){
						isInHoriRange = true;
					}
				}else{
					if(list[i].x-this.x <= this.horizontaldraw/2){
						isInHoriRange = true;
					}
				}
				if(this.y > list[i].y){
					if(this.y-list[i].y <= this.verticaldraw/2){
						isInVertRange = true;
					}
				}else{
					if(list[i].y-this.y <= this.verticaldraw/2){
						isInVertRange = true;
					}
				}
				if(isInVertRange && isInHoriRange){
					let temp = {
						username: list[i].username,
						x: list[i].x,
						y: list[i].y,
						facing: list[i].facing,
						moving: list[i].moving,
						action: list[i].action
					}
					active.push(temp);
				}
			}
		}
		let player = {
			map: this.calcPlayerMap(map),
			player:{
				x: this.x,
				y: this.y,
				inventory: this.inventory,
				moving: this.moving,
				facing: this.facing,
				action: this.action,
				skills: this.skills,
				xp: this.xp,
				levelTable: this.levelTable
			},
			items: this.droppedItemList,
			enemy:{

			},
			active
		}
		return player;
	}

	calcMovement(map, timeDifference){
		this.moving = false;
		//count the number of movement keys pressed
		let count = Object.values(this.movement).reduce((x,y)=>x+y, 0);
		//since 3 are pressed and 2 directions cancel each other out, only go 1 direction
		if(count === 3){
			if(this.movement.left && this.movement.right){
				//if W key is held and tile above is walkable.
				if(this.movement.up){
					this.facing = "N";
					if(map.layers["layer2"][Math.floor(this.y-(this.charactersize/100)-(this.movespeed*timeDifference))][Math.floor(this.x)] === 0){
						this.y-=(this.movespeed*timeDifference);
						this.moving = true;
					}
				}else if(this.movement.down){
					this.facing = "S";
					if(map.layers["layer2"][Math.floor(this.y+(this.charactersize/100)+(this.movespeed*timeDifference))][Math.floor(this.x)] === 0){
						this.y+=(this.movespeed*timeDifference);
						this.moving = true;
					}
				}
			}else if(this.movement.up && this.movement.down){
				if(this.movement.left){
					this.facing = "W";
					if(map.layers["layer2"][Math.floor(this.y)][Math.floor(this.x-(this.charactersize/100)-(this.movespeed*timeDifference))] === 0){
						this.x-=(this.movespeed*timeDifference);
						this.moving = true;
					}
				}else if(this.movement.right){
					this.facing = "E";
					if(map.layers["layer2"][Math.floor(this.y)][Math.floor(this.x+(this.charactersize/100)+(this.movespeed*timeDifference))] === 0){
						this.x+=(this.movespeed*timeDifference);
						this.moving = true;
					}
				}
			}
		}else if(count === 2){
			if(this.movement.left && this.movement.up){
				this.facing = "NW";
				if(map.layers["layer2"][Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference))][Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference))] === 0){
					this.x-=((this.movespeed/2)*timeDifference);
					this.y-=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}else if(map.layers["layer2"][Math.floor(this.y)][Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference))] === 0){
					this.x-=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}else if(map.layers["layer2"][Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference))][Math.floor(this.x)] === 0){
					this.y-=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}
			}else if(this.movement.left && this.movement.down){
				this.facing = "SW";
				if(map.layers["layer2"][Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference))][Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference))] === 0){
					this.x-=((this.movespeed/2)*timeDifference);
					this.y+=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}else if(map.layers["layer2"][Math.floor(this.y)][Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference))] === 0){
					this.x-=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}else if(map.layers["layer2"][Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference))][Math.floor(this.x)] === 0){
					this.y+=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}
			}else if(this.movement.right && this.movement.up){
				this.facing = "NE";
				if(map.layers["layer2"][Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference))][Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference))] === 0){
					this.x+=((this.movespeed/2)*timeDifference);
					this.y-=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}else if(map.layers["layer2"][Math.floor(this.y)][Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference))] === 0){
					this.x+=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}else if(map.layers["layer2"][Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference))][Math.floor(this.x)] === 0){
					this.y-=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}
			}else if(this.movement.right && this.movement.down){
				this.facing = "SE";
				if(map.layers["layer2"][Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference))][Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference))] === 0){
					this.x+=((this.movespeed/2)*timeDifference);
					this.y+=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}else if(map.layers["layer2"][Math.floor(this.y)][Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference))] === 0){
					this.x+=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}else if(map.layers["layer2"][Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference))][Math.floor(this.x)] === 0){
					this.y+=((this.movespeed/2)*timeDifference);
					this.moving = true;
				}
			}
		}else if(count === 1){
			if(this.movement.left){
				this.facing = "W";
				if(map.layers["layer2"][Math.floor(this.y)][Math.floor(this.x-(this.charactersize/100)-(this.movespeed*timeDifference))] === 0){
					this.x-=(this.movespeed*timeDifference);
					this.moving = true;
				}
			}else if(this.movement.right){
				this.facing = "E";
				if(map.layers["layer2"][Math.floor(this.y)][Math.floor(this.x+(this.charactersize/100)+(this.movespeed*timeDifference))] === 0){
					this.x+=(this.movespeed*timeDifference);
					this.moving = true;
				}
			}else if(this.movement.up){
				this.facing = "N";
				if(map.layers["layer2"][Math.floor(this.y-(this.charactersize/100)-(this.movespeed*timeDifference))][Math.floor(this.x)] === 0){
					this.y-=(this.movespeed*timeDifference);
					this.moving = true;
				}
			}else if(this.movement.down){
				this.facing = "S";
				if(map.layers["layer2"][Math.floor(this.y+(this.charactersize/100)+(this.movespeed*timeDifference))][Math.floor(this.x)] === 0){
					this.y+=(this.movespeed*timeDifference);
					this.moving = true;
				}
			}
		}
	}
};