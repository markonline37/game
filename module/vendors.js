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
		console.log("x: "+x);
		console.log("y: "+y);
		for(let i = 0, j = this.vendors.length; i<j; i++){
			console.log("startx: "+this.vendors[i].startx);
			console.log("endx: "+this.vendors[i].endx);
			console.log("starty: "+this.vendors[i].starty);
			console.log("endy: "+this.vendors[i].endy);
			if(x >= this.vendors[i].startX && x <= this.vendors[i].endx){
				console.log("this is true");
				if(y <= this.vendors[i].startY && y <= this.vendors[i].endy){
					console.log("vendor found");
					return this.vendors[i];
				}
			}
		}
	}
}