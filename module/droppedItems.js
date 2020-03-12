module.exports = class DroppedItems{
	constructor(hori, vert){
		this.items = [];
		this.horiview = hori;
		this.vertview = vert;
	}

	getItems(x, y, unique){
		let temparr = [];
		for(let i = 0, j = this.items.length; i<j; i++){
			if(this.items[i].x >= x-this.horiview && this.items[i].x <= x+this.horiview &&
				this.items[i].y >= y-this.vertview && this.items[i].y <= y+this.vertview &&
				(this.items[i].owner === unique || this.items[i].owner === "")){
				let temp = {
					id: this.items[i].id,
					x: this.items[i].x,
					y: this.items[i].y,
					item: this.items[i].item
				}
				temparr.push(temp);
			}
		}
		return temparr;
	}

	pickupItem(id, x, y, unique){
		let pickupdist = 5;
		for(let i = 0, j = this.items.length; i<j; i++){
			if(this.items[i].id === id){
				if(this.items[i].owner === unique || this.items[i].owner === ""){
					let horiInRange = false;
					let vertInRange = false;
					if(x > this.items[i].x){
						if(x-pickupdist <= this.items[i].x){
							horiInRange = true;
						}
					}else{
						if(x+pickupdist >= this.items[i].x){
							horiInRange = true;
						}
					}
					if(y > this.items[i].y){
						if(y-pickupdist <= this.items[i].y){
							vertInRange = true;
						}
					}else{
						if(y+pickupdist >= this.items[i].y){
							vertInRange = true;
						}
					}
					if(horiInRange && vertInRange){
						let item = this.items[i].storedItem;
						this.items.splice(i, 1);
						return item;
					}
				}else{
					break;
				}
			}
		}
		return false;
	}

	dropItem(x, y, item, unique){
		let id;
		if(this.items.length === 0){
			id = 1;
		}else{
			id = this.items[this.items.length-1].id+1;
		}
		let temp = {
			id: id,
			storedItem: item,
			item: item.item,
			x: x,
			y: y,
			droppedTime: (new Date()).getTime(),
			owner: unique
		}
		this.items.push(temp);
	}

	controller(){
		let timenow = (new Date()).getTime();
		for(let i = 0, j = this.items.length; i<j; i++){
			if(timenow-this.items[i].droppedTime > 300000){
				this.items.splice(i, 1);
			}else if(timenow-this.items[i].droppedTime > 120000){
				this.items[i].owner = "";
			}
		}
	}
}