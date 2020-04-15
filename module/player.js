module.exports = class Player{
	//user can be new user with default values assigned or an existing user with all inputs supplied.
	//i.e. gold, facing, xp, skills, inventory, bankedItems are all optional.
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

	getEmail(){
		return this.email;
	}

	//checks the bank to see if user can deposit new item types.
	bankFreeSpace(){
		if(this.bankedItems.length >= 60){
			return false;
		}else{
			return true;
		}
	}

	//removes item from inventory and adds to bank, bank uses quantity of item instead of 1 slot per 1 item.
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

	//withdraw item from bank
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

	//sells an item to vendor
	sellItem(slot, vendObj, client, clientPub, vendorChannel){
		if(slot >= 1 && slot <= 30){
			if(this.action === "shopping"){
				let item = this.inventory["slot"+slot];
				if(item !== "" && item !== undefined){
					let temp = this.getTiles();
					let sold = vendObj.sellItemtoVendor(temp.tilex, temp.tiley, item, client, clientPub, vendorChannel);
					if(sold){
						this.gold+=item.price;
						this.inventory["slot"+slot] = "";
						return "Sold Item: "+item.name+" for "+item.price+" credits";
					}
				}
			}
		}
	}

	//buys an item from vendor
	buyItem(itemNumber, vendObj, allItemsObj, client, clientPub, vendorChannel){
		if(this.action === "shopping"){
			if(!this.emptySpace()){
				return "Inventory is full";
			}else{
				if(Number.isInteger(itemNumber)){
					let temp = this.getTiles();
					let item = allItemsObj.findItem(itemNumber);
					if(this.gold >= item.price){
						let sold = vendObj.buyItemFromVendor(temp.tilex, temp.tiley, itemNumber, client, clientPub, vendorChannel);
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

	//currently unused, additional functionality will use this to change equipment in main hand; axe, river rd, ocean rod, weapon etc.
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

	//swaps an items slot in inventory
	swapItem(data){
		let oldslot = data.old;
		let newslot = data.new;
		if(this.inventory["slot"+oldslot] !== "" || this.inventory["slot"+newslot] !== ""){
			let temp = this.inventory["slot"+newslot];
			this.inventory["slot"+newslot] = this.inventory["slot"+oldslot];
			this.inventory["slot"+oldslot] = temp;
		}
	}

	//drop item from inventory
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

	//adds supplied xp to appropriate skill, also checks for level up.
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

	//used to verify inventory has empty space
	emptySpace(){
		for(let i in this.inventory){
			if(this.inventory[i] === ""){
				return true;
			}
		}
		return false;
	}

	//adds an item to inventory
	addItem(item){
		for(let i in this.inventory){
			if(this.inventory[i] === ""){
				this.inventory[i] = item;
				return true;
			}
		}
		return false;
	}

	//currently unused - additional functionality required.
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

	//when the 'E' key is pressed by the client, checks the tiles based on facing direction for what action to perform.
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
		//woodcutting
		else if((tile >= 16 && tile <= 21) || (tile >= 24 && tile <= 29)){
			this.action = "woodcutting";
		}
	}

	//gets the tiles based on which direction client is facing
	getTiles(map){
		let tile;
		let tilex;
		let tiley;
		let userx = Math.floor(this.x);
		let usery = Math.floor(this.y);
		if(this.facing === "N"){
			if(map !== undefined){
				tile = map.layers[3][usery-1][userx];
			}
			tilex = Math.floor(this.x);
			tiley = Math.floor(this.y)-1;
		}else if(this.facing === "NE"){
			if(map !== undefined){
				tile = map.layers[3][usery-1][userx+1];
			}
			tilex = Math.floor(this.x)+1;
			tiley = Math.floor(this.y)-1;
		}else if(this.facing === "E"){
			if(map !== undefined){
				tile = map.layers[3][usery][userx+1];
			}
			tilex = Math.floor(this.x)+1;
			tiley = Math.floor(this.y);
		}else if(this.facing === "SE"){
			if(map !== undefined){
				tile = map.layers[3][usery+1][userx+1];
			}
			tilex = Math.floor(this.x)+1;
			tiley = Math.floor(this.y)+1;
		}else if(this.facing === "S"){
			if(map !== undefined){
				tile = map.layers[3][usery+1][userx];
			}
			tilex = Math.floor(this.x);
			tiley = Math.floor(this.y)+1;
		}else if(this.facing === "SW"){
			if(map !== undefined){
				tile = map.layers[3][usery-1][userx-1];
			}
			tilex = Math.floor(this.x)-1;
			tiley = Math.floor(this.y)+1;
		}else if(this.facing === "W"){
			if(map !== undefined){
				tile = map.layers[3][usery][userx-1];				
			}
			tilex = Math.floor(this.x)-1;
			tiley = Math.floor(this.y);
		}else if(this.facing === "NW"){
			if(map !== undefined){
				tile = map.layers[3][usery-1][userx-1];
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

	//used by redis to check if change has occured before writing to database
	snapShot(){
		return {
			x: this.x,
			y: this.y,
			gold: this.gold,
			facing: this.facing,
			xp: JSON.stringify(this.xp),
			skills: JSON.stringify(this.skills),
			inventory: JSON.stringify(this.inventory),
			bankedItems: JSON.stringify(this.bankedItems),
			action: this.action
		}
	}

	//uses snapShot (above) to compare values and write to database if changes have occured
	rerunSnapShot(client, clientPub, playerChannel){
		let temp = [];
		let different = false;
		let xcheck = false;
		let ycheck = false;
		let facingcheck = false;
		let actioncheck = false;
		if(this.x !== this.snapshot.x){
			temp.push('x');
			temp.push(this.x);
			different = true;
			xcheck = true;
		}
		if(this.y !== this.snapshot.y){
			temp.push('y')
			temp.push(this.y);
			different = true;
			ycheck = true;
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
			facingcheck = true;
		}
		if(this.action !== this.snapshot.action){
			actioncheck = true;
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
		if(xcheck || ycheck || facingcheck || actioncheck){
			clientPub.publish(playerChannel, JSON.stringify({
				type: "update",
				unique: this.email,
				data: {
					username: this.username,
					x: this.x,
					y: this.y,
					facing: this.facing,
					moving: false,
					action: ""
				}
			}));
		}
		if(different){
			(async()=>{
				client.hset(this.email, temp);
			})();
		}
		this.snapshot = this.snapShot();
	}

	//main player processor, performs function based on user action and returns the data packet.
	tick(io, socket, treeObj, calcObj, map, itemObj, timeDifference, mapObj, 
		allOnlinePlayers, vendObj, droppedItemObj, levelTable, client, clientPub, playerChannel){
		let time = Date.now();
		//woodcutting
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
		}
		//fishing
		else if(this.action === "fishing"){
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
		}
		//moving
		else if(this.action === "moving"){
			this.calcMovement(map, timeDifference, mapObj);
		}
		let time2 = Date.now() - time;
		if(this.email === "markonline37@gmail.com"){
			//console.log("Process 1 (actions), elapsed time: "+time2);
		}
		let time3 = Date.now();
		//checks to see if data has changed after tick - writes to database the changes
		this.rerunSnapShot(client, clientPub, playerChannel);
		let time4 = Date.now() - time3;
		if(this.email === "markonline37@gmail.com"){
			//console.log("Process 2 (snapshot), elapsed time: "+time4);
		}
		//uses calcpacket functionality to return the data packet to server
		let temp = this.calcPacket(allOnlinePlayers, map, vendObj, droppedItemObj, levelTable, client);
		let time5 = Date.now() - time;
		if(this.email === "markonline37@gmail.com"){
			//console.log("Process 6 (packet complete), elapsed time: "+time5);
		}
		return temp;
	}

	/*
	//used by calcpacket to calculate the world map based on view and players coordinates
	calcPlayerMap(map){
		let time1 = Date.now();
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
		let time2 = Date.now()-time1;
		if(this.email === "markonline37@gmail.com"){
			//console.log("Process 5 (player map), elapsed time: "+time2);
		}
		return returnObj;
	}
	*/

	//calculates the data packet for player (everything that is sent to client)
	calcPacket(allOnlinePlayers, map, vendObj, droppedItemObj, levelTable, client){
		//other players in visual range of current player
		let active = [];
		let time1 = Date.now();
		for(let i in allOnlinePlayers){
			if(i !== this.email){
				let isInHoriRange = false;
				let isInVertRange = false;
				if(this.x > allOnlinePlayers[i].x){
					if(this.x-allOnlinePlayers[i].x <= this.horizontaldraw/2){
						isInHoriRange = true;
					}
				}else{
					if(allOnlinePlayers[i].x-this.x <= this.horizontaldraw/2){
						isInHoriRange = true;
					}
				}
				if(this.y > allOnlinePlayers[i].y){
					if(this.y-allOnlinePlayers[i].y <= this.verticaldraw/2){
						isInVertRange = true;
					}
				}else{
					if(allOnlinePlayers[i].y-this.y <= this.verticaldraw/2){
						isInVertRange = true;
					}
				}
				if(isInVertRange && isInHoriRange){
					let temp = {
						username: allOnlinePlayers[i].username,
						x: allOnlinePlayers[i].x,
						y: allOnlinePlayers[i].y,
						facing: allOnlinePlayers[i].facing,
						moving: allOnlinePlayers[i].moving,
						action: allOnlinePlayers[i].action
					}
					active.push(temp);
				}
			}
		}
		let time2 = Date.now() - time1;
		if(this.email === "markonline37@gmail.com"){
			//console.log("Process 3 (other players), elapsed time: "+time2);
		}
		let time3 = Date.now();
		//vendor & vendor items
		let vendor = {};
		vendor.showVendor = false;
		if(this.action === "shopping"){
			vendor.showVendor = true;
			let temp = this.getTiles(map);
			let temp2 = vendObj.findVendor(temp.tilex, temp.tiley, client);
			vendor.vendorItems = temp2.vendor.items;
		}
		//banker & banker items
		let banker = {};
		banker.showBanker = false;
		if(this.action === "banking"){
			banker.showBanker = true;
			banker.bankerItems = this.bankedItems;
		}
		let time4 = Date.now()-time3;
		if(this.email === "markonline37@gmail.com"){
			//console.log("Process 4 (vendors and bankers), elapsed time: "+time4);
		}
		let ismoving = false;
		if(this.action === "moving"){
			ismoving = true;
		}
		//current player data
		let player = {
			player:{
				x: this.x,
				y: this.y,
				inventory: this.inventory,
				gold: this.gold,
				moving: ismoving,
				facing: this.facing,
				action: this.action,
				skills: this.skills,
				xp: this.xp,
				levelTable: levelTable,
				horizontaldraw: this.horizontaldraw,
				verticaldraw: this.verticaldraw
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

	//used by calcmovement to teleport user when they walk through doors.
	//as inside areas are drawn off main map.
	teleport(x, y){
		this.x = x+0.5;
		this.y = y+0.5;
	}

	//player can move in 8 directions; N, NE, E etc. 
	//This function calculates where players should be after game tick.
	calcMovement(map, timeDifference, mapObj){
		//count the number of movement keys pressed
		let count = Object.values(this.movement).reduce((x,y)=>x+y, 0);
		let movement;
		//checks which direction they should be using based on number of keys pressed
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
		//2 keys pressed means moving diagonally or cancelled movement.
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
		//1 key, 1 direction
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
		//works by checking the x/y of where the user is going to be and checks if it is 0 in the collision layer
		//anything other than 0 is not walkable.
		//also uses teleport functionality to check for doors(teleports to inside)
		if(movement === "N"){
			this.facing = "N";
			let posy = Math.floor(this.y-(this.charactersize/100)-(this.movespeed*timeDifference));
			let posx = Math.floor(this.x);
			let tele = mapObj.checkdoors(posx, posy);
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers[3][posy][posx] === 0){
				this.y-=(this.movespeed*timeDifference);
				this.action = "moving"
			}else{
				this.action = "";
			}
		}else if(movement === "NE"){
			this.facing = "NE";
			let northEastX = Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference));
			let northEastY = Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference));
			let tele = mapObj.checkdoors(northEastX, northEastY);
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers[3][northEastY][northEastX] === 0){
				this.x+=((this.movespeed/2)*timeDifference);
				this.y-=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else if(map.layers[3][Math.floor(this.y)][northEastX] === 0){
				this.x+=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else if(map.layers[3][northEastY][Math.floor(this.x)] === 0){
				this.y-=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else{
				this.action = ""
			}
		}else if(movement === "E"){
			this.facing = "E";
			let east = Math.floor(this.x+(this.charactersize/100)+(this.movespeed*timeDifference));
			let tele = mapObj.checkdoors(east, Math.floor(this.y));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers[3][Math.floor(this.y)][east] === 0){
				this.x+=(this.movespeed*timeDifference);
				this.action = "moving"
			}else{
				this.action = ""
			}
		}else if(movement === "SE"){
			this.facing = "SE";
			let tele = mapObj.checkdoors(Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference)), Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference)));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers[3][Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference))][Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference))] === 0){
				this.x+=((this.movespeed/2)*timeDifference);
				this.y+=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else if(map.layers[3][Math.floor(this.y)][Math.floor(this.x+(this.charactersize/100)+(this.movespeed/2*timeDifference))] === 0){
				this.x+=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else if(map.layers[3][Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference))][Math.floor(this.x)] === 0){
				this.y+=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else{
				this.action = ""
			}
		}else if(movement === "S"){
			this.facing = "S";
			let tele = mapObj.checkdoors(Math.floor(this.x), Math.floor(this.y+(this.charactersize/100)+(this.movespeed*timeDifference)));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers[3][Math.floor(this.y+(this.charactersize/100)+(this.movespeed*timeDifference))][Math.floor(this.x)] === 0){
				this.y+=(this.movespeed*timeDifference);
				this.action = "moving"
			}else{
				this.action = ""
			}
		}else if(movement === "SW"){
			this.facing = "SW";
			let tele = mapObj.checkdoors(Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference)), Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference)));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers[3][Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference))][Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference))] === 0){
				this.x-=((this.movespeed/2)*timeDifference);
				this.y+=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else if(map.layers[3][Math.floor(this.y)][Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference))] === 0){
				this.x-=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else if(map.layers[3][Math.floor(this.y+(this.charactersize/100)+(this.movespeed/2*timeDifference))][Math.floor(this.x)] === 0){
				this.y+=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else{
				this.action = ""
			}
		}else if(movement === "W"){
			this.facing = "W";
			let tele = mapObj.checkdoors(Math.floor(this.x-(this.charactersize/100)-(this.movespeed*timeDifference)), Math.floor(this.y));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers[3][Math.floor(this.y)][Math.floor(this.x-(this.charactersize/100)-(this.movespeed*timeDifference))] === 0){
				this.x-=(this.movespeed*timeDifference);
				this.action = "moving"
			}else{
				this.action = ""
			}
		}else if(movement === "NW"){
			this.facing = "NW";
			let tele = mapObj.checkdoors(Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference)), Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference)));
			if(tele !== false){
				this.teleport(tele.telex, tele.teley);
			}else if(map.layers[3][Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference))][Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference))] === 0){
				this.x-=((this.movespeed/2)*timeDifference);
				this.y-=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else if(map.layers[3][Math.floor(this.y)][Math.floor(this.x-(this.charactersize/100)-(this.movespeed/2*timeDifference))] === 0){
				this.x-=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else if(map.layers[3][Math.floor(this.y-(this.charactersize/100)-(this.movespeed/2*timeDifference))][Math.floor(this.x)] === 0){
				this.y-=((this.movespeed/2)*timeDifference);
				this.action = "moving"
			}else{
				this.action = ""
			}
		}
	}
};