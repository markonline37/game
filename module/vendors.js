module.exports = class Vendors{
	constructor(fs, fssync){
		this.file = './storage/vendors.json';
		this.fs = fs;
		this.fssync = fssync;
		this.vendors = this.loadVendors();
	}

	loadVendors(){
		try{
			let temp = this.fs.readFileSync(this.file);
			return JSON.parse(temp);
		}catch(err){
			console.log(err);
		}
	}

	findVendor(x, y){
		for(let i = 0, j = this.vendors.length; i<j; i++){
			if(this.vendors[i].startx <= x && this.vendors[i].endx >= x){
				if(this.vendors[i].starty <= y && this.vendors[i].endy >= y){
					return this.vendors[i];
				}
			}else{
				return "failed";
			}
		}
	}
}