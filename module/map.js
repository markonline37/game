module.exports = class Map{
	constructor(fs, fssync){
		this.directory = './map';
		this.unprocessedMap = '/temp.json';
		this.mapfile = '/map.json';
		this.backup = '/backupmap/';
		this.fs = fs;
		this.fssync = fssync;
		this.map = this.loadMap();
	}

	processMap(){
		try{
			if(this.fs.existsSync(this.directory+this.unprocessedMap)){
				let temp = this.fs.readFileSync(this.directory+this.unprocessedMap);
				let tempData = JSON.parse(temp);
				let mapObj = {
					height: tempData.height,
					width: tempData.width,
					tilesize: tempData.tilewidth,
					layers: {
						"layer1": this.convertMap(tempData, 0),
						"layer2": this.convertMap(tempData, 1),
						"layer3": this.convertMap(tempData, 2),
						"layer4": this.convertMap(tempData, 3)
					}
				}

				//move old map, write new map to file, delete temp
				let date = new Date();
				let day = ("0" + date.getDate()).slice(-2);
				let month = ("0" + (date.getMonth() + 1)).slice(-2);
				let year = date.getFullYear();
				let hours = date.getHours();
				let minutes = date.getMinutes();
				let seconds = date.getSeconds();
				let currentDate = "Yr"+year + "Mon" + month + "Day" + day + "Hr" + hours + "Min" + minutes + "Sec" + seconds;
				(async () => {
					try{
						await this.fssync.mkdir(this.directory+this.backup + currentDate, {recursive: true});
						await this.fssync.copyFile(this.directory+this.mapfile, this.directory+this.backup + currentDate + this.mapfile);
						await this.fssync.writeFile(this.directory+this.mapfile, JSON.stringify(mapObj));
						this.map = await this.loadMap();
						console.log("Map Updated.");
					}catch(err){
						console.log(err);
					}
				})();
			}
		}catch(err){
			console.log("Error: "+err);
		}
	}

	convertMap(input, n){
		let newMap = [];
		let j = Math.sqrt(input.layers[n].data.length);
		let count = 0;
		for(let i = 0; i < j; i++){
			let tempArray = [];
			for(let k = 0; k < j; k++){
				tempArray.push(input.layers[n].data[count]);
				count++;
			}
			newMap.push(tempArray);
		}
		return newMap;
	}

	loadMap(){
		try{
			let temp = this.fs.readFileSync(this.directory+this.mapfile);
			return JSON.parse(temp);
		}catch(err){
			console.log(err);
		}
	}

	getMap(){
		return this.map;
	}
}