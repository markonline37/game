module.exports = class Calculator{
	constructor(fish, junk){
		this.fish = fish;
		this.junk = junk;
	}

	calcFishingLoot(skill){
		let temparr = [];
		let randomInt = Math.round(Math.random()*this.junk.length);
		temparr.push(this.junk[randomInt]);
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
		return temparr[(Math.floor(Math.random() * Math.floor(temparr.length)))];
	}
}