const tilesize = 32;
const canvaswidth = 1600;
const canvasheight = 1200;
const sidepanelMinWidth = 180;
const canvasMinWidth = 900;
const canvasMinHeight = 600;

var socket = io();

var worldTiles = new Image();
worldTiles.src = "/image/worldtiles.png";
var char = new Image();
char.src = "/image/char.png";
var itemImg = new Image(); 
itemImg.src = "/image/items.png";
var skillIcons = new Image();
skillIcons.src = "/image/skillicons.png";

window.onload = function(){
    windowResize();
    window.addEventListener("resize", windowResize);
}

function windowResize(){
    let container = document.getElementById("row");
    canvas = document.getElementById("canvas");
    canvas2 = document.getElementById("canvas2");
    if(canvas.style.display === "block"){
        //width
        if(window.innerWidth <= sidepanelMinWidth+canvasMinWidth){
            //min width
            container.style.width = sidepanelMinWidth+canvasMinWidth;
            canvas.width = canvasMinWidth;
            canvas2.width = canvasMinWidth+sidepanelMinWidth;
        }else if(window.innerWidth <= canvaswidth*1.2){
            //innerWidth
            container.style.width = window.innerWidth;
            canvas.width = window.innerWidth*0.8;
            canvas2.width = window.innerWidth;
        }else{
            //max width
            container.style.width = canvaswidth;
            canvas.width = canvaswidth*0.8;
            canvas2.width = canvaswidth;
        }
        //height
        if(window.innerHeight <= canvasMinHeight){
            //min height
            container.style.height = canvasMinHeight;
            canvas.height = canvasMinHeight;
            canvas2.height = canvasMinHeight;
        }else if(window.innerHeight <= canvasheight){
            //innerHeight
            container.style.height = window.innerHeight;
            canvas.height = window.innerHeight;
            canvas2.height = window.innerHeight;
        }else{
            //max height
            container.style.height = canvasheight;
            canvas.height = canvasheight;
            canvas2.height = canvasheight;
        }
        /*console.log("window width: "+window.innerWidth);
        console.log("window height: "+window.innerHeight);
        console.log("container width: "+container.style.width);
        console.log("container height: "+container.style.height);
        console.log("canvas width: "+canvas.width);
        console.log("canvas height: "+canvas.height);
        console.log("canvas2 width: "+canvas2.width);
        console.log("canvas2 height: "+canvas2.height);*/
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

    if(inventorySlots.length !== 0){
        inventoryPosition();
    }

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
let mouseisdown = false;
let helditem = null;
let mouseposx = null;
let mouseposy = null;
let droppedItem = false;
let itemoffsetx = null;
let itemoffsety = null;
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
            if(displayShop){
                displayShop = false;
            }
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
            if(displayShop){
                displayShop = false;
            }
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
            if(displayShop){
                displayShop = false;
            }
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
            if(displayShop){
                displayShop = false;
            }
        }
    });
    document.addEventListener('keyup', function(){
        if(event.code === 'KeyS'){
            movement.down = false;
            socket.emit('movement', movement);
            movedowntoggle = true;
            if(displayShop){
                displayShop = false;
            }
        }
    });

    //E
    let actionToggle = true;
    document.addEventListener('keydown', function(){
        if(event.code === 'KeyE' && actionToggle){
            socket.emit('action', "KeyE");
            actionToggle = false;
            if(displayShop){
                displayShop = false;
            }
        }
    });
    document.addEventListener('keyup', function(){
        if(event.code === 'KeyE'){
            actionToggle = true;
        }
    });

    //Esc
    let escapeToggle = true
    document.addEventListener('keydown',function(){
        if(event.code === 'Escape' && escapeToggle){
            escapeToggle = false;
            if(displayShop){
                displayShop = false;
            }
        }
    });
    document.addEventListener('keyup', function(){
        if(event.code === 'Escape'){
            escapeToggle = true;
        }
    });

    
    canvas2.addEventListener('mousedown', function(e){
        if(e.offsetY <= canvas2.height/2 && e.offsetX >= canvas2.width*0.8){
            //skill 
        }else if(e.offsetY >=canvas2.height/2 && e.offsetX >= canvas2.width*0.8){
            mouseisdown = true;
            //inventory
            for(let i = 0, j = inventorySlots.length; i<j; i++){
                let k = inventorySlots[i];
                if(k.startx <= e.offsetX && k.endx >= e.offsetX && k.starty <= e.offsetY && k.endy >= e.offsetY){
                    itemoffsetx = k.startx+(k.endx-k.startx)/2 - e.offsetX;
                    itemoffsety = k.starty+(k.endy-k.starty)/2 - e.offsetY;
                    helditem = k.slot;
                    mouseposx = e.offsetX;
                    mouseposy = e.offsetY;
                }
            }
        }else if(e.offsetX <=canvas2.width*0.8){
            let posx;
            let posy;
            if(canvas.width/2 >= e.offsetX){
                posx = lastPacket.player.x - (canvas.width/2-e.offsetX)/tilesize;
            }else{
                posx = lastPacket.player.x + (e.offsetX-canvas.width/2)/tilesize;
            }
            if(canvas.height/2 >= e.offsetY){
                posy = lastPacket.player.y - (canvas.height/2-e.offsetY)/tilesize;
            }else{
                posy = lastPacket.player.y + (e.offsetY - canvas.height/2)/tilesize;
            }
            socket.emit('clicked', {x: posx, y: posy});
        }
    });

    canvas2.addEventListener('mousemove', function(e){
        if(mouseisdown){
            mouseposx = e.offsetX;
            mouseposy = e.offsetY;
        }
    });

    canvas2.addEventListener('mouseup', function(e){
        if(mouseisdown){
            let sent = false;
            for(let i = 0, j = inventorySlots.length; i<j; i++){
                let k = inventorySlots[i];
                if(k.startx <= e.offsetX && k.endx >= e.offsetX && k.starty <= e.offsetY && k.endy >= e.offsetY){
                    socket.emit('swap item', {old: helditem, new: k.slot});
                }else if(e.offsetX <= (canvas2.width*0.8+border) || e.offsetY <= (canvas2.height/2+(border*5))){
                    if(!sent){
                        socket.emit('drop item', helditem);
                        sent = true;
                    }
                }
            }
            helditem = null;
            mouseposx = null;
            mouseposy = null;
        }
        mouseisdown = false;
        droppedItem = true;
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
let lastPacket;

socket.on('update', function(data){
    lastPacket = data;
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

    drawScreen(data);
});

let shopItems;
let displayShop = false;
socket.on('Display Shop', function(data){
    shopItems = data;
    displayShop = true;
});

let map;
function drawScreen(data){
    map = data.map;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i = 0, j = Object.keys(map).length-1; i<j;i++){
        drawMap(data.player.x, data.player.y, i);
    }
    for(let i = 0, j = data.active.length; i < j; i++){
        let x = centrehori-(data.player.x-data.active[i].x)*tilesize;
        let y = centrevert-(data.player.y-data.active[i].y)*tilesize;
        drawPlayer(data.active[i], x, y);
        ctx.fillStyle = "black";
        ctx.font = "15px Calibri";
        ctx.textAlign = "center";
        ctx.fillText(data.active[i].username, x, y-tilesize*1.5);
    }
    if(data.items.length > 0){
        drawItems(data.player.x, data.player.y, data.items);
    }
    drawPlayer(data.player, centrehori, centrevert);
    drawMap(data.player.x, data.player.y, Object.keys(map).length-1);
    if(displayShop){
        drawShop();
    }
    drawUI(data.player.skills, data.player.xp, data.player.inventory, data.player.levelTable);
    //draw enemie(s) position/rotation/action
    //draw buildings position
    //if error, draw error.
    if(messageBuffer.length > 0){
        drawGameMessage();
    }
}

function drawShop(){
    let border = 10;
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.rect(canvas.width*0.1, canvas.height*0.1, canvas.width*0.8, canvas.height*0.8);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = "#DCCA98";
    ctx.rect(canvas.width*0.1+border, canvas.height*0.1+border, canvas.width*0.8-(border*2), canvas.height*0.8-(border*2));
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.font = "30px Calibri";
    ctx.fillText("Shop Inventory", canvas.width*0.1+border*2, canvas.height*0.15);
    let inventoryWidth = canvas.width*0.8-border*2;
    let itemWidth = tilesize+border*2;
    let numberOfItems = Math.floor(inventoryWidth/itemWidth);
    let startposx = (inventoryWidth-(itemWidth*numberOfItems))/2;
    let startposy = canvas.height*0.2;
    for(let i = 0, j = shopItems.length; i<j; i++){
        let sx = (shopItems[i]%10)*tilesize;
        let sy = Math.floor(shopItems[i]/10)*tilesize;
        if(shopItems[i]%10 !== 0){
            sx+=1;
            sy+=1;
        }
        //----------------------------------------------------------------------------------
        let dx = 
        let dx = (canvas2.width*0.8)+border+((i%5)*tilesize)+((i%5)+1)*horizontalSpace;
        let dy = canvas2.height/2+(border*6)+(Math.floor(i/5)*tilesize)+Math.floor(i/5)*verticalSpace;
        ctx2.drawImage(itemImg, sx, sy, tilesize, tilesize, dx, dy, tilesize, tilesize);
    }
}

function drawItems(x, y, input){
    for(let i = 0, j = input.length; i<j; i++){
        let posx;
        let posy;
        let sx = (input[i].type.item%10)*tilesize;
        let sy = Math.floor(input[i].type.item/10)*tilesize;
        if(input[i].type.item%10 !== 0){
            sx+=1;
            sy+=1;
        }
        if(x >= input[i].x){
            posx = canvas.width/2-(x-input[i].x)*tilesize;
        }else{
            posx = canvas.width/2+(input[i].x-x)*tilesize;
        }
        if(y >= input[i].y){
            posy = canvas.height/2-(y-input[i].y)*tilesize;
        }else{
            posy = canvas.height/2+(input[i].y-y)*tilesize;
        }
        ctx.drawImage(itemImg, sx, sy, tilesize, tilesize, posx-tilesize/2, posy-tilesize/2, tilesize, tilesize);
    }
}

function drawMap(inx, iny, layer){
    let county = 0;
    for(let coordy = starty;coordy<endy;coordy+=tilesize){
        let countx = 0;
        for(let coordx = startx;coordx<endx;coordx+=tilesize){
            let y = arrvert-vertviewdist+county;
            let x = arrhori-horiviewdist+countx;
            let temp = map[Object.keys(map)[layer]][y][x];
            if(temp !== 0){
                let sourcex = ((temp-1)%8)*32;
                let sourcey = (Math.floor((temp-1)/8))*32;
                let posx = coordx+(Math.floor(inx)-inx)*tilesize;
                let posy = coordy+(Math.floor(iny)-iny)*tilesize;
                ctx.drawImage(worldTiles, sourcex, sourcey, tilesize, tilesize, Math.round(posx), Math.round(posy), tilesize, tilesize);
            }
            countx++;
        }
        county++;
    }
}

let messageBuffer = [];
socket.on('Game Message', function(data){
    messageBuffer.push(data);
    setTimeout(function(){
        messageBuffer.shift();
        drawScreen(lastPacket);
    }, 4000);
});

function drawGameMessage(){
    ctx.font = "30px Calibri";
    let space = 30;
    for(let i = 0, j = messageBuffer.length; i < j; i++){
        ctx.textAlign = "left";
        ctx.fillText(messageBuffer[i], 10, canvas.height-10-(i*space));
    }    
}

let inventorySlots = [];
function inventoryPosition(){
    inventorySlots = [];
    let horizontalSpace = ((canvas2.width*0.2)-(border*2+2)-(tilesize*5))/6;
    let verticalSpace = (canvas2.height/2-(border*5+2)-(tilesize*6))/7;
    let halfh = horizontalSpace/2;
    let halfv = verticalSpace/2;
    for(let i = 0, j = Object.keys(storedInventory).length; i < j; i++){
        let tempx = (canvas2.width*0.8)+border+((i%5)*tilesize)+((i%5)+1)*horizontalSpace;
        let tempy = canvas2.height/2+(border*6)+(Math.floor(i/5)*tilesize)+Math.floor(i/5)*verticalSpace;
        inventorySlots.push({
            slot: i+1,
            startx: tempx-halfh,
            starty: tempy-halfv,
            endx: tempx+tilesize+halfh,
            endy: tempy+tilesize+halfv
        });
    }
    //console.log(inventorySlots[0].starty);
}

let storedXp, storedInventory;
let border = 10;
function drawUI(skills, xp, inventory, levelTable){
    ctx2.clearRect(0,0,canvas2.width*0.8,canvas2.height);
    if(JSON.stringify(storedXp) !== JSON.stringify(xp) || helditem !== null || droppedItem){
        ctx2.clearRect(canvas2.width*0.8,0,canvas2.width,canvas2.height/2);
        storedXp = xp;
        //draw XP
        ctx2.beginPath();
        ctx2.fillStyle = "black";
        ctx2.rect(canvas2.width*0.8, 0, canvas2.width*0.2, canvas2.height/2);
        ctx2.fill();
        ctx2.closePath();
        ctx2.beginPath();
        ctx2.fillStyle = "#DCCA98";
        ctx2.rect(canvas2.width*0.8+border, 0+border, canvas2.width*0.2-border*2, canvas2.height/2-border);
        ctx2.fill();
        ctx2.closePath();
        ctx2.fillStyle = "black";
        ctx2.font = "30px Calibri";
        ctx2.fillText("Skills", canvas2.width*0.8+border*2, 0+border*4);
        ctx2.font = "15px Calibri";
        let j = 0;
        for(let i in skills){
            let dx = canvas2.width*0.8+border*2;
            let dy = border*6+j*tilesize+j*border;
            ctx2.drawImage(skillIcons, j*tilesize, 0, tilesize, tilesize, dx, dy, tilesize, tilesize);
            ctx2.fillText("Lvl: "+skills[i], dx+tilesize+border, dy+tilesize/4);
            let temp;
            if(skills[i] >= Object.keys(levelTable).length){
                temp = xp[i]+"/Max";
            }else{
                temp = xp[i]+"/"+Object.values(levelTable)[skills[i]];
            }
            ctx2.fillText("Exp: "+temp, dx+tilesize+border, dy+tilesize);
            j++;
        }
    }
    if((JSON.stringify(storedInventory) !== JSON.stringify(inventory)) || helditem !== null || droppedItem){
        droppedItem = false;
        ctx2.clearRect(canvas2.width*0.8,canvas2.height/2,canvas2.width,canvas2.height);
        storedInventory = inventory;
        if(inventorySlots.length === 0){
            inventoryPosition();
        }

        //draw inventory
        ctx2.beginPath();
        ctx2.fillStyle = "black";
        ctx2.rect(canvas2.width*0.8, canvas2.height/2, canvas2.width, canvas2.height);
        ctx2.fill();
        ctx2.closePath();
        ctx2.beginPath();
        ctx2.fillStyle = "#DCCA98";
        ctx2.rect(canvas2.width*0.8+border, canvas2.height/2+border, canvas2.width*0.2-(border*2), canvas2.height/2-(border*2));
        ctx2.fill();
        ctx2.closePath();
        ctx2.fillStyle = "black";
        ctx2.font = "30px Calibri";
        ctx2.fillText("Inventory", canvas2.width*0.8+border*2, canvas.height/2+(border*4));
        let items = Object.values(inventory);
        let k = 0;
        let horizontalSpace = ((canvas2.width*0.2)-(border*2+2)-(tilesize*5))/6;
        let verticalSpace = (canvas2.height/2-(border*5+2)-(tilesize*6))/7;
        for(let i = 0, j = items.length; i<j; i++){
            if(items[i] !== ""){
                if(helditem-1 === i){
                    //currently dragged item
                    let sx = (items[i].item%10)*tilesize;
                    let sy = Math.floor(items[i].item/10)*tilesize;
                    if(items[i].item%10 !== 0){
                        sx+=1;
                        sy+=1;
                    }
                    let dx = mouseposx-(tilesize/2)+itemoffsetx;
                    let dy = mouseposy-(tilesize/2)+itemoffsety;
                    ctx2.drawImage(itemImg, sx, sy, tilesize, tilesize, dx, dy, tilesize, tilesize);
                }else{
                    let sx = (items[i].item%10)*tilesize;
                    let sy = Math.floor(items[i].item/10)*tilesize;
                    if(items[i].item%10 !== 0){
                        sx+=1;
                        sy+=1;
                    }
                    let dx = (canvas2.width*0.8)+border+((i%5)*tilesize)+((i%5)+1)*horizontalSpace;
                    let dy = canvas2.height/2+(border*6)+(Math.floor(i/5)*tilesize)+Math.floor(i/5)*verticalSpace;
                    ctx2.drawImage(itemImg, sx, sy, tilesize, tilesize, dx, dy, tilesize, tilesize);
                }
            }
        }
    }
}

function drawPlayer(data, x, y){
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
        ctx.drawImage(char, ((Date.now()-timemoving)%9)*tilesize*2, num, tilesize*2, tilesize*2, x-(tilesize), y-(tilesize*1.5), tilesize*2, tilesize*2);
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
        
        ctx.drawImage(char, num1, num2, tilesize*2, tilesize*2, x-(tilesize), y-(tilesize*1.5), tilesize*2, tilesize*2);
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
        ctx.drawImage(char, 0, num, tilesize*2, tilesize*2, x-(tilesize), y-(tilesize*1.5), tilesize*2, tilesize*2);
    }
}