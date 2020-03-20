module.exports = class Trees{
	constructor(map){
		this.trees = this.loadTrees(map);
	}

	getTrees(){
		return this.trees;
	}

	/*
	fells a tree, uses supplied x/y to work out which tree to cut.
	axe and reductionArr will be implemented later, both change damage done to tree
	players damage a tree ->
		tree gets bound to player's email so other players can't cut it ->
			each 'swing' of the axe does damage ->
				if tree health <= 0, kill tree(function)
	*/
	chopTree(unique, x, y, axe, map, reductionArr){
		let found = null;
		let cancut = false;
		for(let i = 0, j = this.trees.length; i<j; i++){
			if((x === this.trees[i].startx || x === this.trees[i].endx) && 
				(y === this.trees[i].starty || y === this.trees[i].endy)){
				found = i;
				if(this.trees[i].health <= 0){
					return "That's just a stump";
				}else if(this.trees[i].beingCutBy === unique || this.trees[i].beingCutBy === ""){
					cancut = true;
				}
				setTimeout(function(found){
					let timenow = (new Date()).getTime();
					if(timenow-this.trees[i].lastCut >= 5000){
						this.trees[i].beingCutBy = "";
					}
				}.bind(this), 5000);
				break;
			}
		}
		if(found !== null && cancut){
			let percent = 0;
			for(let i = 0, j = reductionArr.length; i<j; i++){
				percent+= reductionArr[i]/100;
			}
			let cuttingtime = 1000 * (1 - percent);
			let timenow = (new Date()).getTime();
			if(timenow - this.trees[found].lastCut >= cuttingtime){
				this.trees[found].lastCut = timenow;
				this.trees[found].beingCutBy = unique;
				this.trees[found].health-=this.getDamage(axe);
				if(this.trees[found].health <= 0){
					this.trees[found].felledTime = timenow;
					this.killTree(this.trees[found].startx, this.trees[found].starty, map, this.trees[found].type, found);
					return this.trees[found].loot;
				}
			}
		}else if(found !== null && !cancut){
			return "Someone else is cutting that";
		}
	}

	//updates the map layer with the appropriate tiles
	killTree(x, y, map, type, found){
		let timer;
		if(type == "standard"){
			map.layers["layer2"][y][x] = 25;
			map.layers["layer2"][y][x+1] = 26;
			timer = 60000;
		}
		map.layers["layer4"][y-1][x] = 0;
		map.layers["layer4"][y-1][x+1] = 0;
		map.layers["layer4"][y][x] = 0;
		map.layers["layer4"][y][x+1] = 0;

		setTimeout(function(){
			this.resetTree(found, type, map, this.trees[found]);
		}.bind(this, found), timer);
	}

	//updates the map layers with the appropriate tiles
	resetTree(i, type, map, tree){
		if(type = "standard"){
			this.trees[i].health = this.genHealth(type);
			map.layers["layer2"][tree.starty][tree.startx] = 17;
			map.layers["layer2"][tree.starty][tree.endx] = 18;
			map.layers["layer4"][tree.starty][tree.startx] = 33;
			map.layers["layer4"][tree.starty][tree.endx] = 34;
			map.layers["layer4"][tree.endy][tree.startx] = 9;
			map.layers["layer4"][tree.endy][tree.endx] = 10;
		}
		this.trees[i].felledTime = "";
		this.trees[i].beingCutBy = "";
		this.trees[i].lastCut = "";
	}

	//functionality to be expanded in future, different axes do different damage to trees
	getDamage(axe){
		if(axe === "iron"){
			return 10;
		}
	}

	//checks the map for certain tiles, and generates a tree array
	loadTrees(map){
		let temparr = [];
		for(let i = 0, j = map.layers["layer2"].length; i<j; i++){
			for(let k = 0, l = map.layers["layer2"][i].length; k<l; k++){
				let temp = map.layers["layer2"][i][k];
				if(temp === 17){
					let tree ={
						type: "standard",
						startx: k,
						starty: i,
						endx: k+1,
						endy: i-1,
						beingCutBy: "",
						health: this.genHealth("standard"),
						loot: 7,
						lastCut: "",
						felledTime: ""
					}
					temparr.push(tree);
				}
			}
		}
		return temparr;
	}

	//gives the trees a random health to add a bit of unpredictability
	genHealth(type){
		if(type = "standard"){
			return Math.floor(Math.random() * (150 - 80 + 1)) + 80;
		}
	}
}