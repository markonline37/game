module.exports = class Player{
	constructor(username, email, password, socket, x, y, charactersize, movespeed, 
		horizontaldraw, verticaldraw, gold, facing, xp, skills, inventory, bankedItems){
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
		this.maxlevel = 20;
		if(bankedItems === undefined){
			this.bankedItems = [];
		}else{
			this.bankedItems = bankedItems;
		}
		this.snapshot = this.snapShot();
	}

	stop(){
		this.action = "";
	}

	bankFreeSpace(){
		if(this.bankedItems.length >= 60){
			return false;
		}else{
			return true;
		}
	}

	bankDeposit(slot){
		slot+=1;
		if(this.bankFreeSpace() && slot >= 1 && slot <= 30){
			if(this.inventory["slot"+slot] !== ""){
				let item = this.inventory["slot"+slot];
				let found = false;
				for(let i = 0, j = this.bankedItems.length; i<j; i++){
					let temp = this.bankedItems[i];
					if(temp.item === item.item){
						this.bankedItems[i].quantity+=1;
						this.inventory["slot"+slot] = "";
						found = true;
					}
				}
				if(!found){
					this.bankedItems.push(item);
					this.bankedItems[this.bankedItems.length-1].quantity = 1;
					this.inventory["slot"+slot] = "";
				}
				return "Deposited item: "+item.name;
			}
		}else{
			return "No room left in bank";
		}
	}

	bankWithdraw(slot){
		if(!this.emptySpace()){
			return "Inventory is full";
		}else{
			if(slot < this.bankedItems.length){
				let temp = this.bankedItems[slot];
				this.addItem(this.bankedItems[slot]);
				if(this.bankedItems[slot].quantity > 1){
					this.bankedItems[slot].quantity-=1;
				}else{
					this.bankedItems.splice(slot, 1);
				}
				return "Widthdrew item: "+temp.name;
			}
		}
	}

	sellItem(slot, vendObj, client){
		if(slot >= 1 && slot <= 30){
			if(this.action === "shopping"){
				let item = this.inventory["slot"+slot];
				if(item !== "" && item !== undefined){
					let temp = this.getTiles();
					let sold = vendObj.sellItemtoVendor(temp.tilex, temp.tiley, item, client);
					if(sold){
						this.gold+=item.price;
						this.inventory["slot"+slot] = "";
						return "Sold Item: "+item.name+" for "+item.price+" credits";
					}
				}
			}
		}
	}

	buyItem(itemNumber, vendObj, allItemsObj, client){
		if(this.action === "shopping"){
			if(!this.emptySpace()){
				return "Inventory is full";
			}else{
				if(Number.isInteger(itemNumber)){
					let temp = this.getTiles();
					let item = allItemsObj.findItem(itemNumber);
					if(this.gold >= item.price){
						let sold = vendObj.buyItemFromVendor(temp.tilex, temp.tiley, itemNumber, client);
						if(sold){
							this.addItem(item);
							this.gold-=item.price;
							return "Bought: "+item.name+" for "+item.price+" credits";
						}
					}else{
						return "Not enough credits";
					}
				}
			}
		}
	}

	equipMainHand(input){
		this.equippedMainHand = input;
	}

	//pickup dropped item
	clicked(data, droppedItemObj){
		if(!this.emptySpace()){
			return "Inventory is full";
		}else{
			let item = droppedItemObj.pickupItem(data, this.x, this.y, this.email);
			if(item !== false && item !== undefined && item !== null){
				this.addItem(item);
			}
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

	dropItem(slot, droppedItemObj){
		if(this.inventory["slot"+slot] !== "" && slot !== null){
			let temp = this.inventory["slot"+slot];
			droppedItemObj.dropItem(this.x, this.y, temp, this.email);
			this.inventory["slot"+slot] = "";
			if(temp !== undefined){
				return 'Dropped item: '+temp.name;
			}
		}
	}

	addXP(skill, xp, io, socket, levelTable){
		//apply xp
		this.xp[skill]+=xp;
		//check for level up
		if(this.skills[skill] < this.maxlevel){
			if(levelTable[this.skills[skill]+1]<=this.xp[skill]){
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

	actions(map, vendObj, treeObj, client){
		this.action = "";
		let temp = this.getTiles(map);
		let tile = temp.tile;
		let tilex = temp.tilex;
		let tiley = temp.tiley;
		//fishing
		if(tile >= 300 && tile <= 398){
			if(!this.emptySpace()){
				return "Inventory is full";
			}else if(!this.checkFishingEquipment()){
				return "No fishing equipment in main hand";
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
		//shopping
		else if(tile >= 432 && tile <= 455){
			let temp = vendObj.findVendor(tilex, tiley, client);
			if(temp.type === "vendor"){
				this.action = "shopping";
				return true;
			}else if(temp.type === "banker"){
				this.action = "banking";
				return true;
			}
		}

		else if((tile >= 16 && tile <= 21) || (tile >= 24 && tile <= 29)){
			this.action = "woodcutting";
		}
	}

	getTiles(map){
		let tile;
		let tilex;
		let tiley;
		let userx = Math.floor(this.x);
		let usery = Math.floor(this.y);
		if(this.facing === "N"){
			if(map !== undefined){
				tile = map.layers["layer2"][usery-1][userx];
			}
			tilex = Math.floor(this.x);
			tiley = Math.floor(this.y)-1;
		}else if(this.facing === "NE"){
			if(map !== undefined){
				tile = map.layers["layer2"][usery-1][userx+1];
			}
			tilex = Math.floor(this.x)+1;
			tiley = Math.floor(this.y)-1;
		}else if(this.facing === "E"){
			if(map !== undefined){
				tile = map.layers["layer2"][usery][userx+1];
			}
			tilex = Math.floor(this.x)+1;
			tiley = Math.floor(this.y);
		}else if(this.facing === "SE"){
			if(map !== undefined){
				tile = map.layers["layer2"][usery+1][userx+1];
			}
			tilex = Math.floor(this.x)+1;
			tiley = Math.floor(this.y)+1;
		}else if(this.facing === "S"){
			if(map !== undefined){
				tile = map.layers["layer2"][usery+1][userx];
			}
			tilex = Math.floor(this.x);
			tiley = Math.floor(this.y)+1;
		}else if(this.facing === "SW"){
			if(map !== undefined){
				tile = map.layers["layer2"][usery-1][userx-1];
			}
			tilex = Math.floor(this.x)-1;
			tiley = Math.floor(this.y)+1;
		}else if(this.facing === "W"){
			if(map !== undefined){
				tile = map.layers["layer2"][usery][userx-1];				
			}
			tilex = Math.floor(this.x)-1;
			tiley = Math.floor(this.y);
		}else if(this.facing === "NW"){
			if(map !== undefined){
				tile = map.layers["layer2"][usery-1][userx-1];
			}
			tilex = Math.floor(this.x)-1;
			tiley = Math.floor(this.y)-1;
		}
		return {
			tile,
			tilex,
			tiley
		}
	}

	snapShot(){
		return {
			x: this.x,
			y: this.y,
			gold: this.gold,
			facing: this.facing,
			xp: JSON.stringify(this.xp),
			skills: JSON.stringify(this.skills),
			inventory: JSON.stringify(this.inventory),
			bankedItems: JSON.stringify(this.bankedItems)
		}
	}

	rerunSnapShot(client){
		let temp = [];
		let different = false;
		if(this.x !== this.snapshot.x){
			temp.push('x');
			temp.push(this.x);
			different = true;
		}
		if(this.y !== this.snapshot.y){
			temp.push('y')
			temp.push(this.y);
			different = true;
		}
		if(this.gold !== this.snapshot.gold){
			temp.push('gold');
			temp.push(this.gold);
			different = true;
		}
		if(this.facing !== this.snapshot.facing){
			temp.push('facing');
			temp.push(this.facing);
			different = true;
		}
		if(JSON.stringify(this.xp) !== this.snapshot.xp){
			temp.push('xp');
			temp.push(JSON.stringify(this.xp));
			different = true;
		}
		if(JSON.stringify(this.skills) !== this.snapshot.skills){
			temp.push('skills');
			temp.push(JSON.stringify(this.skills));
			different = true;
		}
		if(JSON.stringify(this.inventory) !== this.snapshot.inventory){
			temp.push('inventory');
			temp.push(JSON.stringify(this.inventory));
			different = true;
		}
		if(JSON.stringify(this.bankedItems) !== this.snapshot.bankedItems){
			temp.push('bankedItems');
			temp.push(JSON.stringify(this.bankedItems));
			different = true;
		}
		if(different){
			client.hset(this.email, temp);
			this.snapshot = this.snapShot();
		}
	}

	tick(io, socket, treeObj, calcObj, map, itemObj, timeDifference, mapObj, onlinePlayers, vendObj, droppedItemObj, levelTable, client){
		if(this.action === "woodcutting"){
			if(!this.emptySpace()){
				this.action = "";
				io.to(socket).emit('Game Message', "Inventory is full");
			}else{
				let temp = this.getTiles(map);
				//update iron when equipment is added, update [] with % reduction gear
				let loot = treeObj.chopTree(this.email, temp.tilex, temp.tiley, "iron", map, []);
				if(typeof loot === 'string' || loot instanceof String){
					this.action = "";
					io.to(socket).emit('Game Message', loot);
				}else if(loot !== undefined){
					this.action = "";
					let item = itemObj.findItem(loot);
					this.addItem(item);
					this.addXP('woodcutting', item.xp, io, socket, levelTable);
					io.to(socket).emit('Game Message', "You felled a tree and received a : "+item.name);
				}
			}
		}else if(this.action === "fishing"){
			if(!this.emptySpace()){
				this.action = "";
				io.to(socket).emit('Game Message', "Inventory is full");
			}else{
				if(!this.currentlyFishing){
					this.currentlyFishing = true;
					let timer = Math.floor(Math.random() * 7000)+2000;
					setTimeout(function(){
						if(this.action === "fishing"){
							let fish = calcObj.calcFishingLoot(this.skills.fishing);
							this.addItem(fish);
							if(fish.type === "fish"){
								this.addXP('fishing', fish.xp, io, socket, levelTable);
							}
							this.currentlyFishing = false;
							io.to(socket).emit('Game Message', "Caught: "+fish.name);
						}else{
							this.currentlyFishing = false;
						}
					}.bind(this), timer);
				}
			}
		}else if(this.moving === true){
			this.calcMovement(map, timeDifference, mapObj);
		}
		this.rerunSnapShot(client);
		return this.calcPacket(onlinePlayers, map, vendObj, droppedItemObj, levelTable, client);
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

	calcPacket(onlinePlayers, map, vendObj, droppedItemObj, levelTable, client){
		let active = [];
		for(let i = 0, j = onlinePlayers.length; i < j; i++){
			if(onlinePlayers[i].email !== this.email){
				let isInHoriRange = false;
				let isInVertRange = false;
				if(this.x > onlinePlayers[i].x){
					if(this.x-onlinePlayers[i].x <= this.horizontaldraw/2){
						isInHoriRange = true;
					}
				}else{
					if(onlinePlayers[i].x-this.x <= this.horizontaldraw/2){
						isInHoriRange = true;
					}
				}
				if(this.y > onlinePlayers[i].y){
					if(this.y-onlinePlayers[i].y <= this.verticaldraw/2){
						isInVertRange = true;
					}
				}else{
					if(onlinePlayers[i].y-this.y <= this.verticaldraw/2){
						isInVertRange = true;
					}
				}
				if(isInVertRange && isInHoriRange){
					let temp = {
						username: onlinePlayers[i].username,
						x: onlinePlayers[i].x,
						y: onlinePlayers[i].y,
						facing: onlinePlayers[i].facing,
						moving: onlinePlayers[i].moving,
						action: onlinePlayers[i].action
					}
					active.push(temp);
				}
			}
		}
		let vendor = {};
		vendor.showVendor = false;
		if(this.action === "shopping"){
			vendor.showVendor = true;
			let temp = this.getTiles(map);
			let temp2 = vendObj.findVendor(temp.tilex, temp.tiley, client);
			vendor.vendorItems = temp2.vendor.items;
		}
		let banker = {};
		banker.showBanker = false;
		if(this.action === "banking"){
			banker.showBanker = true;
			banker.bankerItems = this.bankedItems;
		}
		let player = {
			map: this.calcPlayerMap(map),
			player:{
				x: this.x,
				y: this.y,
				inventory: this.inventory,
				gold: this.gold,
				moving: this.moving,
				facing: this.facing,
				action: this.action,
				skills: this.skills,
				xp: this.xp,
				levelTable: levelTable
			},
			items: droppedItemObj.getItems(this.x, this.y, this.email),
			enemy:{

			},
			active,
			vendor,
			banker
		}
		return player;
	}

	teleport(x, y){
		this.x = x+0.5;
		this.y = y+0.5;
	}

	calcMovement(map, timeDifference, mapObj){
		//count the number of movement keys pressed
		let count = Object.values(this.movement).reduce((x,y)=>x+y, 0);
		let movement;
		//since 3 are pressed and 2 directions cancel each other out, only go 1 direction
		if(count === 3){
			if(this.movement.left && this.movement.right){
				//if W key is held and tile above is walkable.
				if(this.movement.up){
					movement = "N";
				}else if(this.movement.down){
					movement = "S";
				}
			}else if(this.movement.up && this.movement.down){
				if(this.movement.left){
					movement = "W";
				}else if(this.movement.right){
					movement = "E";
				}
			}
		}else if(count === 2){
			if(this.movement.left && this.movement.up){
				movement = "NW";
			}else if(this.movement.left && this.movement.down){
				movement = "SW";
			}else if(this.movement.right && this.movement.up){
				movement = "NE";
			}else if(this.movement.right && this.movement.down){
				movement = "SE";
			}
		}else if(count === 1){
			if(this.movement.left){
				movement = "W";
			}else if(this.movement.right){
				movement = "E";
			}else if(this.movement.up){
				movement = "N";
			}else if(this.movement.down){
				movement = "S";
			}
		}
		if(movement === "N"){
			this.facing = "N";
			let posy = Math.floor(this.y-(this.charactersize/100)-(this.movespeed*timeDifference));
			let posx = Math.floor(this.x);
			let tele = mapObj.checkdoors(posx, posy);
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers["layer2"][posy][posx] === 0){
				this.y-=(this.movespeed*timeDifference);
				this.moving = true;
			}
		}else if(movement === "NE"){
			this.facing = "NE";
			let northEastX = Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference));
			let northEastY = Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference));
			let tele = mapObj.checkdoors(northEastX, northEastY);
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers["layer2"][northEastY][northEastX] === 0){
				this.x+=((this.movespeed/2)*timeDifference);
				this.y-=((this.movespeed/2)*timeDifference);
				this.moving = true;
			}else if(map.layers["layer2"][Math.floor(this.y)][northEastX] === 0){
				this.x+=((this.movespeed/2)*timeDifference);
				this.moving = true;
			}else if(map.layers["layer2"][northEastY][Math.floor(this.x)] === 0){
				this.y-=((this.movespeed/2)*timeDifference);
				this.moving = true;
			}
		}else if(movement === "E"){
			this.facing = "E";
			let east = Math.floor(this.x+(this.charactersize/100)+(this.movespeed*timeDifference));
			let tele = mapObj.checkdoors(east, Math.floor(this.y));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers["layer2"][Math.floor(this.y)][east] === 0){
				this.x+=(this.movespeed*timeDifference);
				this.moving = true;
			}else{
				console.log(east);
			}
		}else if(movement === "SE"){
			this.facing = "SE";
			let tele = mapObj.checkdoors(Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference)), Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference)));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers["layer2"][Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference))][Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference))] === 0){
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
		}else if(movement === "S"){
			this.facing = "S";
			let tele = mapObj.checkdoors(Math.floor(this.x), Math.floor(this.y+(this.charactersize/100)+(this.movespeed*timeDifference)));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers["layer2"][Math.floor(this.y+(this.charactersize/100)+(this.movespeed*timeDifference))][Math.floor(this.x)] === 0){
				this.y+=(this.movespeed*timeDifference);
				this.moving = true;
			}
		}else if(movement === "SW"){
			this.facing = "SW";
			let tele = mapObj.checkdoors(Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference)), Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference)));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers["layer2"][Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference))][Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference))] === 0){
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
		}else if(movement === "W"){
			this.facing = "W";
			let tele = mapObj.checkdoors(Math.floor(this.x-(this.charactersize/100)-(this.movespeed*timeDifference)), Math.floor(this.y));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers["layer2"][Math.floor(this.y)][Math.floor(this.x-(this.charactersize/100)-(this.movespeed*timeDifference))] === 0){
				this.x-=(this.movespeed*timeDifference);
				this.moving = true;
			}
		}else if(movement === "NW"){
			this.facing = "NW";
			let tele = mapObj.checkdoors(Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference)), Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference)));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers["layer2"][Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference))][Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference))] === 0){
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
		}
	}
};