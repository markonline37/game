const tilesize = 32;
const canvaswidth = 1200;
const canvasheight = 1200;

var socket = io();

var tiles = new Image();
tiles.src = "/image/worldtiles.png";

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

var canvas, ctx, length, view, centrex, centrey, startx, starty, positionx, positiony, startposx, startposy;

let toggle = true;
socket.on('update', function(data){
    if(toggle){
        console.log(data);
        toggle = false;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let theight = data.map[0].length;
    let twidth = data.map[0][0].length;
    view = length/2;
    startposx = (Math.floor(data.player.x)-data.player.x)*tilesize;
    startposy = (Math.floor(data.player.y)-data.player.y)*tilesize;
    for(let i=0;i<theight;i++){
        positiony = startposy+(i*tilesize);
        for(let j=0;j<twidth;j++){
            positionx = startposx+(j*tilesize);
            if(positiony > 0-tilesize && positiony < canvas.height+tilesize && positionx > 0-tilesize && positionx < canvas.width+tilesize){
                for(let k in data.map){
                    let temp = data.map[k][i][j];
                    if(temp !== 0){
                        ctx.drawImage(tiles, (tilesize*temp-32), 0, tilesize, tilesize, positionx, positiony, tilesize, tilesize);
                    }
                }
            }
        }
    }
    //draw player position/rotation/action
    //draw enemie(s) position/rotation/action
    //draw buildings position
});