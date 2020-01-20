window.onload = function(){
    windowResize();
    window.addEventListener("resize", windowResize);
}

function windowResize(){
    let canvas = document.getElementById("canvas");
    if(canvas.style.display === "block"){
        if(window.innerWidth < canvaswidth){
            canvas.width = window.innerWidth;
        }else{
            canvas.width = canvaswidth;
        }
        if(window.innerHeight < canvasheight){
            canvas.height = window.innerHeight;
        }else{
            canvas.height = canvasheight;
        }
    }
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
    usernameError.innerHTML, emailError.innerHTML, passwordError.innerHTML = "";
    if(error.username.length > 0){
        document.getElementById('new-player-name-error').innerHTML = error.username;
    }
    if(error.email.length > 0){
        document.getElementById('new-player-email-error').innerHTML = error.email;
    }
    if(error.password.length > 0){
        document.getElementById('new-player-password-error').innerHTML = error.password;
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
    canvas.style.display = "block";
    windowResize();
    canvas.style.padding = "auto";
    canvas.style.margin = "auto";
    ctx = canvas.getContext("2d");

    action();
});