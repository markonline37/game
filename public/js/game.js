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

var canvas, ctx, length, horizontalview, verticalview, centrex, centrey, startx, starty, positionx, 
    positiony, startposx, startposy, sourcex, sourcey, theight, twidth;

let toggle = true;
let ismoving = false;
let isfacing = "S";
let timeidle = 0;
let timemoving = 0;
socket.on('update', function(data){
    if(toggle){
        console.log(data);
        toggle = false;
    }
    ismoving = data.player.moving;
    if(ismoving && timemoving === 0){
        timemoving = Date.now();
        timeidle = 0;
    }else if(!ismoving && timemoving !== 0){
        timemoving = 0;
        timeidle = Date.now();
    }
    isfacing = data.player.facing;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let centrehori = canvas.width/2;
    let centrevert = canvas.height/2;
    
    let horiviewdist = Math.ceil(canvas.width/2/tilesize);
    let vertviewdist = Math.ceil(canvas.height/2/tilesize);

    let startx = centrehori-(horiviewdist*tilesize);
    let endx = centrehori+(horiviewdist*tilesize)+tilesize;
    let starty = centrevert-(vertviewdist*tilesize);
    let endy = centrevert+(vertviewdist*tilesize)+tilesize;

    let arrhori = data.map["layer1"][0].length/2;
    let arrvert = data.map["layer1"].length/2;

    let county = 0;
    for(let coordy = starty;coordy<endy;coordy+=tilesize){
        let countx = 0;
        for(let coordx = startx;coordx<endx;coordx+=tilesize){
            for(k in data.map){
                let y = arrvert-vertviewdist+county;
                let x = arrhori-horiviewdist+countx;
                let temp = data.map[k][y][x];
                if(temp !== 0){
                    let sourcex = ((temp-1)%8)*32;
                    let sourcey = (Math.floor((temp-1)/8))*32;
                    let posx = coordx+(Math.floor(data.player.x)-data.player.x)*tilesize;
                    let posy = coordy+(Math.floor(data.player.y)-data.player.y)*tilesize
                    ctx.drawImage(worldTiles, sourcex, sourcey, tilesize, tilesize, posx, posy, tilesize, tilesize);
                }
            }
            countx++;
        }
        county++;
    }
    //draw player position/rotation/action
    let num = 0;
    switch(isfacing){
        case "N":
            num = 0;
            break;
        case "NE":
            num=32;
            break;
        case "E":
            num=64;
            break;
        case "SE":
            num=96;
            break;
        case "S":
            num=128;
            break;
        case "SW":
            num=160;
            break;
        case "W":
            num=192;
            break;
        case "NW":
            num=224;
            break;
    }
    if(ismoving){
        ctx.drawImage(char, (((Date.now()-timemoving)%4)*tilesize), num, tilesize, tilesize, centrehori-(tilesize/2), centrevert-(tilesize/2), tilesize, tilesize);
    }else{
        ctx.drawImage(char, 0, num, tilesize, tilesize, centrehori-(tilesize/2), centrevert-(tilesize/2), tilesize, tilesize);
    }
    //draw enemie(s) position/rotation/action
    //draw buildings position
    //if error, draw error.
});

/*document.addEventListener('keydown', function(){
    if(event.code === 'KeyB'){
        socket.emit('action', "fish");
    }
});*/