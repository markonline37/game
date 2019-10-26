window.onload = function(){
    var canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log(canvas.width);
    console.log(canvas.height);

    window.addEventListener("resize", function(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}


var socket = io();

function submitCreateNewUser(e){
	if (e.keyCode === 13){
        createNewUser();
    }
}

function createNewUser(){
	errors = false;
	var username, email, password, error, usernameError, emailError, passwordError = "";
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
    	//https://tylermcginnis.com/validate-email-address-javascript/
    	if(!emailIsValid(email)){
    		emailError.innerHTML = "Email is not in a valid format";
    		errors = true;
    	} else if(email.length > 128){
    		emailError.innerHTML = "Email must be less than 128 characters";
    		errors = true;
    	}
    	if(password.length < 4 || password.length > 32){
    		passwordError.innerHTML = "Password must between 4 and 32 characters";
    		errors = true;
    	}
    }
    if(!errors){
    	var newPlayer = {
    		username: username,
    		email: email,
    		password: password
    	}
    	socket.emit('new player', newPlayer);
    }
}

function submitReturningPlayer(e){
    if (e.keyCode === 13){
        returningPlayer();
    }
}

function returningPlayer(){
    var errors = false;
    var email, password = "";
    email = document.getElementById('returning-player-email').value;
    password = document.getElementById('returning-player-password').value;
    //validation

    if(!errors){
        var user = {
            email: email,
            password: password
        }
        socket.emit('returning player', user);
    }
}

//https://tylermcginnis.com/validate-email-address-javascript/
function emailIsValid (email) {
    return /\S+@\S+\.\S+/.test(email);
}

socket.on('success', function(){
	document.getElementById('login').style.display = "none";
	document.getElementById('canvas').style.display = "block";
});

socket.on('failed new user', function(error){
    var usernameError = document.getElementById('new-player-name-error');
    var emailError = document.getElementById('new-player-email-error');
    var passwordError = document.getElementById('new-player-password-error');
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
	


//socket.emit('new player');

/*setInterval(function() {
	socket.emit('movement', movement);
}, 1000 / 60);*/

/*var canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext('2d');*/
socket.on('state', function(players) {
	/*context.clearRect(0, 0, 800, 600);
	context.fillStyle = 'green';
	for (var id in players) {
		var player = players[id];
		context.beginPath();
		context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
		context.fill();
	}*/
});
socket.on('update', function(data){
    console.log(data);
});