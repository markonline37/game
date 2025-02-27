module.exports = class Map{
	constructor(fs, fssync){
		this.directory = './map';
		this.unprocessedMap = '/temp.json';
		this.mapfile = '/map.json';
		this.backup = '/backupmap/';
		this.fs = fs;
		this.fssync = fssync;
		this.map = this.loadMap();
		//as the map uses an off-main-map area for inside buildings, this is used to 'teleport' the user inside.
		this.doors = [
			[[55, 50], [229, 32]],
			[[69, 48], [264, 33]]
		]
	}

	//checks if supplied x/y is a door, if it is returns where to teleport user too/false if not.
	checkdoors(x, y){
		let returnvalue;
		for(let i = 0, j = this.doors.length; i<j; i++){
			if(this.doors[i][0][0] === x && this.doors[i][0][1] === y){
				returnvalue = {
					telex: this.doors[i][1][0],
					teley: this.doors[i][1][1]-1
				}
			}else if(this.doors[i][1][0] === x && this.doors[i][1][1] === y){
				returnvalue = {
					telex: this.doors[i][0][0],
					teley: this.doors[i][0][1]+1
				}
			}
		}
		if(returnvalue === undefined){
			return false;
		}else{
			return returnvalue;
		}
	}

	//reads the temp.json map file produced in tiled.exe and processes it to usable by the server.
	//also backsup old map in case it is to be reverted.
	processMap(){
		try{
			if(this.fs.existsSync(this.directory+this.unprocessedMap)){
				let temp = this.fs.readFileSync(this.directory+this.unprocessedMap);
				let tempData = JSON.parse(temp);
				let mapObj = {
					height: tempData.height,
					width: tempData.width,
					tilesize: tempData.tilewidth,
					layers: [
						this.convertMap(tempData, 0),
						this.convertMap(tempData, 1),
						this.convertMap(tempData, 2),
						this.convertMap(tempData, 3),
						this.convertMap(tempData, 4),
						this.convertMap(tempData, 5)
					]
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

	//used by processMap
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

	//initial load of map into object.
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