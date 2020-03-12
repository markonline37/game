module.exports = class Trees{
	constructor(map){
		this.trees = this.loadTrees(map);
	}

	getTrees(){
		return this.trees;
	}

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
					this.killTree(this.trees[found].startx, this.trees[found].starty, map, this.trees[found].type);
					return this.trees[found].loot;
				}
			}
		}else if(found !== null && !cancut){
			return "Someone else is cutting that";
		}
	}

	//regrows trees and handles abandoned (half cut) trees
	controller(map){
		let time = (new Date()).getTime();
		for(let i = 0, j = this.trees.length; i<j; i++){
			if(this.trees[i].health <= 0){
				if(this.trees[i].type === "standard"){
					if(time-this.trees[i].felledTime >= 60000){
						this.resetTree(i, "standard", map, this.trees[i]);
					}
				}
			}else if(time-this.trees[i].lastCut >= 5000){
				this.trees[i].beingCutBy = "";
			}
		}
	}

	killTree(x, y, map, type){
		if(type == "standard"){
			map.layers["layer2"][y][x] = 25;
			map.layers["layer2"][y][x+1] = 26;
		}
		map.layers["layer4"][y-1][x] = 0;
		map.layers["layer4"][y-1][x+1] = 0;
		map.layers["layer4"][y][x] = 0;
		map.layers["layer4"][y][x+1] = 0;

	}

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

	getDamage(axe){
		if(axe === "iron"){
			return 10;
		}
	}

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

	genHealth(type){
		if(type = "standard"){
			return Math.floor(Math.random() * (150 - 80 + 1)) + 80;
		}
	}
}