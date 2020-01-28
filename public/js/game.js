const tilesize = 32;
const canvaswidth = 1200;
const canvasheight = 1200;

var socket = io();

var worldTiles = new Image();
worldTiles.src = "/image/worldtiles.png";
var char = new Image();
char.src = "/image/char.png";

/*
    uses a toggle for movement etc because it fires constantly
    without, and this is event based.
*/
function action(){
    let movement = {
        up: false,
        down: false,
        left: false,
        right: false
    }

    //A
    let movelefttoggle = true;
    document.addEventListener('keydown', function(){
        if(event.code === 'KeyA' && movelefttoggle){
            movement.left = true;
            socket.emit('movement', movement);
            movelefttoggle = false;
        }
    });
    document.addEventListener('keyup', function(){
        if(event.code === 'KeyA'){
            movement.left = false;
            socket.emit('movement', movement);
            movelefttoggle = true;
        }
    });

    //W
    let moveuptoggle = true;
    document.addEventListener('keydown', function(){
        if(event.code === 'KeyW' && moveuptoggle){
            movement.up = true;
            socket.emit('movement', movement);
            moveuptoggle = false;
        }
    });
    document.addEventListener('keyup', function(){
        if(event.code === 'KeyW'){
            movement.up = false;
            socket.emit('movement', movement);
            moveuptoggle = true;
        }
    });

    //D
    let moverighttoggle = true;
    document.addEventListener('keydown', function(){
        if(event.code === 'KeyD' && moverighttoggle){
            movement.right = true;
            socket.emit('movement', movement);
            moverighttoggle = false;
        }
    });
    document.addEventListener('keyup', function(){
        if(event.code === 'KeyD'){
            movement.right = false;
            socket.emit('movement', movement);
            moverighttoggle = true;
        }
    });

    //S
    let movedowntoggle = true;
    document.addEventListener('keydown', function(){
        if(event.code === 'KeyS' && movedowntoggle){
            movement.down = true;
            socket.emit('movement', movement);
            movedowntoggle = false;
        }
    });
    document.addEventListener('keyup', function(){
        if(event.code === 'KeyS'){
            movement.down = false;
            socket.emit('movement', movement);
            movedowntoggle = true;
        }
    });
}

document.addEventListener('keydown', function(){
    if(event.code === 'KeyE'){
        socket.emit('action', "fish");
    }
});

let canvas, ctx, arrhori, arrvert, centrehori, centrevert, horiviewdist, vertviewdist, startx, endx, starty, endy;

//log data
let toggle = true;
//moving/idle
let ismoving = false;
let timemoving = 0;
let timeidle = 0;
//fishing
let isfishing = false;
let timefishing = 0;


socket.on('update', function(data){
    if(toggle){
        console.log(data);
        toggle = false;
    }
    ismoving = data.player.moving;
    if(ismoving && timemoving === 0){
        timemoving = Date.now();
        timeidle = 0;
    }else if(!ismoving && timemoving !== 0 && data.player.action === ""){
        timemoving = 0;
        timeidle = Date.now();
    }
    if(isfishing === false && data.player.action === "fishing"){
        isfishing = true;
        timefishing = Date.now();
    }else if(isfishing === true && data.player.action === ""){
        isfishing = false;
        timefishing = 0;
    }
    
    arrhori = data.map["layer1"][0].length/2;
    arrvert = data.map["layer1"].length/2;

    drawMap(data.map, data.player.x, data.player.y);

    //draw player sprite - direction/action
    drawPlayer(data.player);
    //draw enemie(s) position/rotation/action
    //draw buildings position
    //if error, draw error.
});

function drawMap(map, inx, iny){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let county = 0;
    for(let coordy = starty;coordy<endy;coordy+=tilesize){
        let countx = 0;
        for(let coordx = startx;coordx<endx;coordx+=tilesize){
            for(k in map){
                let y = arrvert-vertviewdist+county;
                let x = arrhori-horiviewdist+countx;
                let temp = map[k][y][x];
                if(temp !== 0){
                    let sourcex = ((temp-1)%8)*32;
                    let sourcey = (Math.floor((temp-1)/8))*32;
                    let posx = coordx+(Math.floor(inx)-inx)*tilesize;
                    let posy = coordy+(Math.floor(iny)-iny)*tilesize;
                    ctx.drawImage(worldTiles, sourcex, sourcey, tilesize, tilesize, Math.round(posx), Math.round(posy), tilesize, tilesize);
                }
            }
            countx++;
        }
        county++;
    }
}

function drawPlayer(data){
    if(data.moving){
        let num;
        if(data.facing === "N"){
            num = 256;
        }else if(data.facing === "NE" || data.facing === "E" || data.facing === "SE"){
            num = 320;
        }else if(data.facing === "S"){
            num = 384;
        }else if(data.facing === "SW" || data.facing === "W" || data.facing === "NW"){
            num = 448
        }
        ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, num, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
    }else if(data.action === "fishing"){
        let num1 = ((Date.now()-timefishing)%8)*tilesize*2;
        let num2;
        if(Date.now()-timefishing < 1000/60*8 ){
            //starting fishing
            num2 = 512;
        }else{
            //fishing loop
            num2 = 576;
        }
        ctx.drawImage(char, num1, num2, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
    }else{
        let num;
        if(data.facing === "N"){
            num = 0;
        }else if(data.facing === "NE" || data.facing === "E" || data.facing === "SE"){
            num = 64;
        }else if(data.facing === "S"){
            num = 128;
        }else if(data.facing === "SW" || data.facing === "W" || data.facing === "NW"){
            num = 192;
        }
        ctx.drawImage(char, 0, num, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
    }
}

