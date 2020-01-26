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
            clearInterval(fishing);
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
            clearInterval(fishing);
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
            clearInterval(fishing);
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
            clearInterval(fishing);
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
    }else if(isfishing === true && data.player.action === ""){
        isfishing = false;
        timefishing = 0;
        clearInterval(fishing);
    }
    
    arrhori = data.map["layer1"][0].length/2;
    arrvert = data.map["layer1"].length/2;

    drawMap(data.map, data.player.x, data.player.y);

    //draw player sprite - direction/action
    drawPlayer(data.player, data.map);
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

//fishing animation
let fishing;
function drawFishing(data, map){
    setTimeout(() => {
        drawMap(map, data.x, data.y);
        ctx.drawImage(char, 0, 512, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
        ctx.drawImage(char, 0, 1280, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
    }, 166);
    setTimeout(() => {
        drawMap(map, data.x, data.y);
        ctx.drawImage(char, 192, 512, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
        ctx.drawImage(char, 192, 1280, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
    }, 166*2);
    setTimeout(() => {
        drawMap(map, data.x, data.y);
        ctx.drawImage(char, 384, 512, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
        ctx.drawImage(char, 384, 1280, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
    }, 166*3);
    setTimeout(() => {
        drawMap(map, data.x, data.y);
        ctx.drawImage(char, 576, 512, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
        ctx.drawImage(char, 576, 1280, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
    }, 166*4);
    setTimeout(() => {
        drawMap(map, data.x, data.y);
        ctx.drawImage(char, 768, 512, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
        ctx.drawImage(char, 768, 1280, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
    }, 166*5);
    setTimeout(() => {
        drawMap(map, data.x, data.y);
        ctx.drawImage(char, 960, 512, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
        ctx.drawImage(char, 960, 1280, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
    }, 166*6);
    setTimeout(() => {
        fishing = setInterval(() => {
            drawMap(map, data.x, data.y);
            ctx.drawImage(char, 768, 512, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
            ctx.drawImage(char, 768, 1280, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
            setTimeout(() => {
                drawMap();
                ctx.drawImage(char, 960, 512, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
                ctx.drawImage(char, 960, 1280, tilesize*6, tilesize*6, centrehori-(tilesize*3), centrevert-(tilesize*4), tilesize*6, tilesize*6);
            }, 166);
        }, 1000);
    }, 166*7);
    
}

function drawPlayer(data, map){
    if(data.moving){
        if(data.facing === "N"){
            ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, 256, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "NE"){
            ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, 320, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "E"){
            ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, 320, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "SE"){
            ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, 320, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "S"){
            ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, 384, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "SW"){
            ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, 448, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "W"){
            ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, 448, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "NW"){
            ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, 448, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }
    }else if(data.action === "fishing"){
        drawFishing(data, map);
    }else{
        if(data.facing === "N"){
            ctx.drawImage(char, 0, 0, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "NE"){
            ctx.drawImage(char, 0, 64, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "E"){
            ctx.drawImage(char, 0, 64, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "SE"){
            ctx.drawImage(char, 0, 64, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "S"){
            ctx.drawImage(char, 0, 128, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "SW"){
            ctx.drawImage(char, 0, 192, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "W"){
            ctx.drawImage(char, 0, 192, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }else if(data.facing === "NW"){
            ctx.drawImage(char, 0, 192, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
        }
    }
}

