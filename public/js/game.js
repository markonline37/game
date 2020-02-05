const tilesize = 32;
const canvaswidth = 1600;
const canvasheight = 1200;
const sidepanel = 300;

var socket = io();

var worldTiles = new Image();
worldTiles.src = "/image/worldtiles.png";
var char = new Image();
char.src = "/image/char.png";
var itemImg = new Image();
itemImg.src = "/image/items.png";

window.onload = function(){
    windowResize();
    window.addEventListener("resize", windowResize);
}

function windowResize(){
    let container = document.getElementById("row");
    let canvas = document.getElementById("canvas");
    let canvas2 = document.getElementById("canvas2");
    if(canvas.style.display === "block"){
        canvas2.width = sidepanel;
        if(window.innerWidth < canvaswidth){
            container.style.width = window.innerWidth;
            canvas.width = window.innerWidth-sidepanel;
        }else{
            container.style.width = canvaswidth;
            canvas.width = canvaswidth-sidepanel;
        }
        if(window.innerHeight < canvasheight){
            container.style.height = window.innerHeight;
            canvas.height = window.innerHeight;
            canvas2.height = window.innerHeight;
        }else{
            container.style.height = canvasheight;
            canvas.height = canvasheight;
            canvas2.height = canvasheight;
        }
    }
    
    container.style.margin = "0 auto";

    centrehori = canvas.width/2;
    centrevert = canvas.height/2;
    horiviewdist = Math.ceil(canvas.width/2/tilesize);
    vertviewdist = Math.ceil(canvas.height/2/tilesize);

    startx = centrehori-(horiviewdist*tilesize);
    endx = centrehori+(horiviewdist*tilesize)+tilesize;
    starty = centrevert-(vertviewdist*tilesize);
    endy = centrevert+(vertviewdist*tilesize)+tilesize;

    storedSkills = "";
    storedXp = "";
    storedInventory = "";
}

document.getElementById('new-player-form').addEventListener('submit', newPlayer);

function newPlayer(e){
    e.preventDefault();

    let errors = false;
    let  username, email, password, error, usernameError, emailError, passwordError = "";
    username = document.getElementById('new-player-name').value;
    email = document.getElementById('new-player-email').value;
    password = document.getElementById('new-player-password').value;
    error = document.getElementById('new-player-error');
    usernameError = document.getElementById('new-player-name-error');
    emailError = document.getElementById('new-player-email-error');
    passwordError = document.getElementById('new-player-password-error');
    error.innerHTML, usernameError.innerHTML, emailError.innerHTML, passwordError.innerHTML = "";
    if(username.length === 0 || email.length === 0 || password.length === 0){
        error.innerHTML = "All fields must be completed";
        errors = true;
    } else {
        if(username.length < 3 || username.length > 32){
            usernameError.innerHTML = "Username must be between 3 and 32 characters";
            errors = true;
        }
        if(!validateEmail(email)){
            emailError.innerHTML = "Email is not in a valid format";
            errors = true;
        } else if(email.length > 128){
            emailError.innerHTML = "Email must be less than 128 characters";
            errors = true;
        }
        if(password.length < 8){
            passwordError.innerHTML = "Password must be at least 8 characters";
            errors = true;
        }
    }
    if(!errors){
        let newPlayer = {
            username: username,
            email: email,
            password: password
        }
        socket.emit('new player', newPlayer);
    }
}

document.getElementById('returning-player').addEventListener('submit', returningPlayer);

function returningPlayer(e){
    e.preventDefault();
    
    let errors = false;
    let email, password = "";
    email = document.getElementById('returning-player-email').value;
    password = document.getElementById('returning-player-password').value;
    emailError = document.getElementById('returning-player-email-error');
    passwordError = document.getElementById('returning-player-password-error');
    if(!validateEmail(email)){
        emailError.innerHTML = "Email is not in a valid format";
        errors = true;
    } else if(email.length > 128){
        emailError.innerHTML = "Email must be less than 128 characters";
        errors = true;
    }
    if(password.length < 8){
        passwordError.innerHTML = "Password must be at least 8 characters";
        errors = true;
    }
    if(!errors){
        let user = {
            email: email,
            password: password
        }
        socket.emit('returning player', user);
    }
}

//https://www.w3resource.com/javascript/form/email-validation.php
function validateEmail(email){
    if(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){
        return true;
    }
    return false;
}

socket.on('failed new user', function(error){
    let usernameError = document.getElementById('new-player-name-error');
    let emailError = document.getElementById('new-player-email-error');
    let passwordError = document.getElementById('new-player-password-error');
    
    if(error.username !== false){
        usernameError.innerHTML = error.username;
    }else{
        usernameError.innerHTML = "";
    }
    if(error.email !== false){
        emailError.innerHTML = error.email;
    }else{
        emailError.innerHTML = "";
    }
    if(error.password !== false){
        passwordError.innerHTML = error.password;
    }else{
        passwordError.innerHTML = "";
    }
});

socket.on('failed login', function(error){
    var emailError = document.getElementById('returning-player-email-error');
    var passwordError = document.getElementById('returning-player-password-error');
    emailError.innerHTML = "";
    passwordError.innerHTML = "";
    if(error.email.length > 0){
        emailError.innerHTML = error.email;
    }
    if(error.password.length > 0){
        passwordError.innerHTML = error.password;
    }
});

socket.on('success', function(){
    document.getElementById('login').style.display = "none";
    canvas = document.getElementById("canvas");
    canvas2 = document.getElementById("canvas2");
    canvas.style.display = "block";
    canvas2.style.display = "block";
    ctx = canvas.getContext("2d");
    ctx2 = canvas2.getContext("2d");
    windowResize();
    action();
});

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

    //E
    document.addEventListener('keydown', function(){
        if(event.code === 'KeyE'){
            socket.emit('action', "fish");
        }
    });
}

let canvas, canvas2, ctx, ctx2, arrhori, arrvert, centrehori, centrevert, horiviewdist, vertviewdist, startx, endx, starty, endy;

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
    drawPlayer(data.player);
    drawUI(data.player.skills, data.player.xp, data.player.inventory);
    //draw enemie(s) position/rotation/action
    //draw buildings position
    //if error, draw error.
});

socket.on('Game Error', function(data){
    console.log(data);
});

let storedXp, storedInventory;
function drawUI(skills, xp, inventory){
    if(JSON.stringify(storedXp) !== JSON.stringify(xp)){
        storedXp = xp;
        //draw XP
    }
    if(JSON.stringify(storedInventory) !== JSON.stringify(inventory)){
        let border = 10;
        storedInventory = inventory;
        //draw inventory
        ctx2.beginPath();
        ctx2.fillStyle = "black";
        ctx2.rect(0, canvas2.height/2, canvas2.width, canvas2.height);
        ctx2.fill();
        ctx2.closePath();
        ctx2.beginPath();
        ctx2.fillStyle = "#DCCA98";
        ctx2.rect(border, canvas2.height/2+border, canvas2.width-(border*2), canvas2.height/2-(border*2));
        ctx2.fill();
        ctx2.closePath();
        ctx2.fillStyle = "black";
        ctx2.font = "30px Calibri";
        ctx2.fillText("Inventory", border*2, canvas.height/2+(border*4));
        let items = Object.values(inventory);
        let k = 0;
        for(let i = 0, j = items.length; i<j; i++){
            if(items[i] !== ""){
                let sx = (items[i].item%10)*tilesize;
                let sy = Math.floor(items[i].item/10)*tilesize;
                let dx = border*2+((i%5)*tilesize)+(i%5)*20+8;
                let dy = canvas2.height/2+(border*6)+(Math.floor(i/5)*tilesize)+(Math.floor(i/5)*(canvas2.height/2-border*6-tilesize*6)/6);
                ctx2.drawImage(itemImg, sx, sy, tilesize, tilesize, dx, dy, tilesize, tilesize);
            }
        }
    }
}

function objectEquality(x, y){
    let xProperties = Object.getOwnProperty
}

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
            num = 448;
        }
        ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, num, tilesize*2, tilesize*2, centrehori-(tilesize), centrevert-(tilesize*1.5), tilesize*2, tilesize*2);
    }else if(data.action === "fishing"){
        let num1 = ((Date.now()-timefishing)%8)*tilesize*2;
        let num2;
        if(data.facing === "N"){
            if(Date.now()-timefishing < 1000/60*8 ){
                //starting fishing
                num2 = 512;
            }else{
                //fishing loop
                num2 = 576;
            }
        }else if(data.facing === "NE" || data.facing === "E" || data.facing === "SE"){
            if(Date.now()-timefishing < 1000/60*8 ){
                num2 = 640;
            }else{
                num2 = 704;
            }
        }else if(data.facing === "S"){
            if(Date.now()-timefishing < 1000/60*8 ){
                num2 = 768;
            }else{
                num2 = 832;
            }
        }else if(data.facing === "SW" || data.facing === "W" || data.facing === "NW"){
            if(Date.now()-timefishing < 1000/60*8 ){
                num2 = 896;
            }else{
                num2 = 960;
            }
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