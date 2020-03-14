module.exports = class Vendors{
	constructor(fs, data){
		this.vendorfile = './storage/vendors.json';
		this.bankerfile = './storage/bankers.json';
		this.fs = fs;
		this.vendors = this.loadVendors();
		this.bankers = this.loadBankers();
		for(let i in data){
			this.vendors[i].items = JSON.parse(data[i]);
		}
	}

	loadVendors(){
		try{
			return JSON.parse(this.fs.readFileSync(this.vendorfile));
		}catch(err){
			console.log(err);
		}
	}

	loadBankers(){
		try{
			return JSON.parse(this.fs.readFileSync(this.bankerfile));
		}catch(err){
			console.log(err);
		}
	}

	findVendor(tilex, tiley, client){
		for(let i = 0, j = this.vendors.length; i<j; i++){
			for(let k = 0, l = this.vendors[i].vendorposition.length; k<l; k++){
				let temp = this.vendors[i].vendorposition[k];
				if(temp[0] === tilex && temp[1] === tiley){
					return {
						type: "vendor",
						vendor: this.vendors[i]
					}
				}
			}
		}
		for(let i = 0, j = this.bankers.length; i<j; i++){
			for(let k = 0, l = this.bankers[i].bankerposition.length; k<l; k++){
				let temp = this.bankers[i].bankerposition[k];
				if(temp[0] === tilex && temp[1] === tiley){
					return {
						type: "banker"
					}
				}
			}
		}
		return false;
	}
	
	sellItemtoVendor(x, y, item, client, clientPub, vendorChannel, itemsObj){
		let temp = this.findVendor(x, y, client);
		let vendorID = null;
		if(temp.type === "vendor" && temp !== false){
			let vendorID = temp.vendor.vendorID;
			let found = false;
			for(let i = 0, j = this.vendors[vendorID].items.length; i<j; i++){
				if(item.item === this.vendors[vendorID].items[i].item){
					this.vendors[vendorID].items[i].quantity++;
					found = true;
					break;
				}
			}
			if(!found){
				let temp = item;
				temp.quantity = 1;
				this.vendors[vendorID].items.push(temp);
			}
			clientPub.publish(vendorChannel, JSON.stringify({
				items: this.vendors[vendorID].items,
				vendor: vendorID
			}));
			client.hset('vendor', vendorID, JSON.stringify(this.vendors[vendorID].items));
			return true;
		}else{
			return false;
		}
	}

	updateVendors(data){
		let input = JSON.parse(data);
		this.vendors[input.vendor].items = input.items;
	}

	buyItemFromVendor(x, y, item, client, clientPub, vendorChannel){
		let temp = this.findVendor(x, y, client);
		let bought = false;
		let vendorID = null;
		if(temp.type === "vendor" && temp !== false){
			let foundVendor = temp.vendor;
			vendorID = foundVendor.vendorID;
			for(let i = 0, j = foundVendor.items.length; i<j; i++){
				if(foundVendor.items[i].item === item){
					if(this.vendors[vendorID].items[i].quantity === 1){
						this.vendors[vendorID].items.splice(i, 1);
					}else{
						this.vendors[vendorID].items[i].quantity--;
					}
					clientPub.publish(vendorChannel, JSON.stringify({
						items: this.vendors[vendorID].items,
						vendor: vendorID
					}));
					client.hset('vendor', vendorID, JSON.stringify(this.vendors[vendorID].items));
					return true;
				}
			}
		}
		return false;
	}
}