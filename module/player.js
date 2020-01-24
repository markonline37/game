module.exports = class Player{
	constructor(username, email, password, socket, x, y){
		this.username = username;
		this.email = email;
		this.password = password;
		this.socket = socket;
		this.gold = 0;
		this.x = x;
		this.y = y;
		this.moving = false;
		this.facing = "S";
		this.movement = {
			up: false,
			down: false,
			left: false,
			right: false
		};
		this.action = "";
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
		}
	}

	addItem(item){
		for(i in this.inventory){
			if(i === ""){
				i = item;
				return true;
			}
		}
		return false;
	}

	removeItem(item){
		for(i in this.inventory){
			if(i === item){
				i = "";
				return true;
			}
		}
		return false;
	}

	removeSlot(slot){
		if(this.inventory["slot"+slot]!== ""){
			this.inventory["slot"+slot]="";
			return true;
		}
		return false;
	}

	changeSlot(oldslot, newslot){
		let temp = this.inventory["slot"+newslot];
		this.inventory["slot"+newslot]=this.inventory["slot"+oldslot];
		this.inventory["slot"+oldslot]=temp;
	}
};