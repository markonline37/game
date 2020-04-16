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

	//load vendors from file
	loadVendors(){
		try{
			return JSON.parse(this.fs.readFileSync(this.vendorfile));
		}catch(err){
			console.log(err);
		}
	}

	//load bankers from file
	loadBankers(){
		try{
			return JSON.parse(this.fs.readFileSync(this.bankerfile));
		}catch(err){
			console.log(err);
		}
	}

	//uses the supplied x/y and the vendors position (each counter) to determine which vendor
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
	
	//sells item to vendor, publishes result to vendor channel (for scalability)
	sellItemtoVendor(x, y, item, client, clientPub, vendorChannel, itemsObj){
		let temp = this.findVendor(x, y, client);
		let vendorID = null;
		if(temp.type === "vendor" && temp !== false){
			let vendorID = temp.vendor.vendorID;
			let found = false;
			for(let i = 0, j = this.vendors[vendorID].items.length; i<j; i++){
				if(item.item === this.vendors[vendorID].items[i].item){
					//if vendor already has this item, increase quantity
					this.vendors[vendorID].items[i].quantity++;
					found = true;
					break;
				}
			}
			if(!found){
				//else give quantity 1 and add to vendor items
				let temp = item;
				temp.quantity = 1;
				this.vendors[vendorID].items.push(temp);
			}
			(async () => {
				clientPub.publish(vendorChannel, JSON.stringify({
					items: this.vendors[vendorID].items,
					vendor: vendorID
				}));
			})();
			(async () => {
				client.hset('vendor', vendorID, JSON.stringify(this.vendors[vendorID].items));
			})();
			return true;
		}else{
			return false;
		}
	}

	//on publish vendorchannel update vendors items.
	//currently fine without scalability but will need to update this to use item, quantity+/- 
	updateVendors(data){
		let input = JSON.parse(data);
		this.vendors[input.vendor].items = input.items;
	}

	//buys an item from vendor, publishes result to vendor channel
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
					(async () => {
						clientPub.publish(vendorChannel, JSON.stringify({
							items: this.vendors[vendorID].items,
							vendor: vendorID
						}));
					})();
					(async () => {
						client.hset('vendor', vendorID, JSON.stringify(this.vendors[vendorID].items));
					})();
					return true;
				}
			}
		}
		return false;
	}
}