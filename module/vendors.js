module.exports = class Vendors{
	constructor(fs, fssync){
		this.vendorfile = './storage/vendors.json';
		this.bankerfile = './storage/bankers.json';
		this.fs = fs;
		this.fssync = fssync;
		this.vendors = this.loadVendors();
		this.bankers = this.loadBankers();
	}

	loadVendors(){
		try{
			let temp = this.fs.readFileSync(this.vendorfile);
			return JSON.parse(temp);
		}catch(err){
			console.log(err);
		}
	}

	loadBankers(){
		try{
			let temp = this.fs.readFileSync(this.bankerfile);
			return JSON.parse(temp);
		}catch(err){
			console.log(err);
		}
	}

	findVendor(tilex, tiley){
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
	
	sellItemtoVendor(x, y, item){
		let temp = this.findVendor(x, y);
		if(temp.type === "vendor" && temp !== false){
			let foundVendor = temp.vendor;
			for(let i = 0, j = foundVendor.items.length; i<j; i++){
				if(foundVendor.items[i].item === item.item){
					foundVendor.items[i].quantity++;
					return true;
				}
			}
			foundVendor.items.push(item);
			foundVendor.items[foundVendor.items.length-1].quantity = 1;
			return true;
		}
		return false;
	}

	buyItemFromVendor(x, y, item){
		let temp = this.findVendor(x, y);
		if(temp.type === "vendor" && temp !== false){
			let foundVendor = temp.vendor;
			for(let i = 0, j = foundVendor.items.length; i<j; i++){
				if(foundVendor.items[i].item === item){
					if(foundVendor.items[i].quantity === 1){
						foundVendor.items.splice(i, 1);
					}else{
						foundVendor.items[i].quantity--;
					}
					return true;
				}
			}
		}
		return false;
	}

	async backup(){
		try{
			let data = JSON.stringify(this.vendors, null, 4);
			await this.fssync.writeFile(this.vendorfile, data);
			data = JSON.stringify(this.bankers, null, 4);
			await this.fssync.writeFile(this.bankerfile, data);
		}catch(err){
			console.log(err);
		}
		return null;
	}
}