module.exports = class Vendors{
	constructor(fs, client){
		this.vendorfile = './storage/vendors.json';
		this.bankerfile = './storage/bankers.json';
		this.fs = fs;
		this.vendors = this.loadVendors();
		this.bankers = this.loadBankers();
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
	
	sellItemtoVendor(x, y, item, client){
		let temp = this.findVendor(x, y, client);
		let vendorID = null;
		let sold = false;
		if(temp.type === "vendor" && temp !== false){
			let foundVendor = temp.vendor;
			vendorID = foundVendor.vendorID;
			for(let i = 0, j = foundVendor.items.length; i<j; i++){
				if(foundVendor.items[i].item === item.item){
					foundVendor.items[i].quantity++;
					sold = true;
					break;
				}
			}
			if(!sold){
				foundVendor.items.push(item);
				foundVendor.items[foundVendor.items.length-1].quantity = 1;
				sold = true;
			}
		}
		if(sold){
			client.hset('vendor', vendorID, JSON.stringify(this.vendors[vendorID].items));
			return true;
		}else{
			return false;
		}
	}

	buyItemFromVendor(x, y, item, client){
		let temp = this.findVendor(x, y, client);
		let bought = false;
		let vendorID = null;
		if(temp.type === "vendor" && temp !== false){
			let foundVendor = temp.vendor;
			vendorID = foundVendor.vendorID;
			for(let i = 0, j = foundVendor.items.length; i<j; i++){
				if(foundVendor.items[i].item === item){
					if(foundVendor.items[i].quantity === 1){
						foundVendor.items.splice(i, 1);
					}else{
						foundVendor.items[i].quantity--;
					}
					bought = true;
				}
			}
		}
		if(bought){
			client.hset('vendor', vendorID, JSON.stringify(this.vendors[vendorID].items));
			return true;
		}else{
			return false;
		}
	}
}