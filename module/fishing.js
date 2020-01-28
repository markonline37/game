module.exports = class Fishing{
	constructor(){
		this.fish = [
				{
				minlevel: "0",
				maxlevel: "10",
				name: "Brown Trout",
				xp: 20
			},
			{
				minlevel: "5",
				maxlevel: "15",
				name: "Salmon",
				xp: 40
			},
			{
				minlevel: "10",
				maxlevel: "20",
				name: "Carp",
				xp: 50
			},
			{
				minlevel: "15",
				maxlevel: "25",
				name: "Grayling",
				xp: 60
			}
		];
	}

	calcLoot(skill){
		let temparr = [];
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