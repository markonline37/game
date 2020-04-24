module.exports = class Calculator{
	constructor(fish, junk){
		this.fish = fish;
		this.junk = junk;
	}

	/*
		Used in player module.
		Creates an array of possible loot, including junk and fish 
			(both level dependant) before returning 1 loot.
	*/
	calcFishingLoot(skill){
		let temparr = [];
		let toggle = true;
		let randomInt = Math.floor(Math.random() * Math.floor(this.junk.length));
		for(let i = 0, j = this.fish.length; i < j; i++){
			if(skill >= this.fish[i].minlevel && skill <= this.fish[i].maxlevel){
				let weight;
				if(skill === 0){
					weight = 1;
				}else if(skill <= this.fish[i].maxlevel/2){
					weight = skill - this.fish[i].minlevel;
				}else{
					weight = this.fish[i].maxlevel - skill;
				}
				for(let k = 0; k < weight; k++){
					temparr.push(this.fish[i]);
				}

			}
		}
		if(skill <= 10){
			for(let i = 0, j = Math.floor(temparr.length)/3; i<j; i++){
				temparr.push(this.junk[randomInt]);
			}
		}else if(skill <= 25){
			for(let i = 0, j = Math.floor(temparr.length/4); i<j; i++){
				temparr.push(this.junk[randomInt]);
			}
		}else if(skill <= 50){
			for(let i = 0, j = Math.floor(temparr.length/5); i<j; i++){
				temparr.push(this.junk[randomInt]);
			}
		}else if(skill <= 70){
			temparr.push(this.junk[randomInt]);
		}
		let int = (Math.floor(Math.random() * Math.floor(temparr.length)));
		return temparr[int];
	}
}