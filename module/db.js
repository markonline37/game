var mysql = require('mysql');

var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "game"
});

//no return
exports.query = function(sql){
	con.connect(function(err) {
		if (err) throw err;
		con.query(sql, function (err, result) {
			if (err) throw err;
		});
	});
};

//return 1
exports.queryOne = function(sql){
	return new Promise((resolve, reject) => {
		con.connect(function(err) {
			if (err) throw err;
			con.query(sql, function (err, result) {
				if (err) throw err;
				resolve(result);
			});
		});
	});
};

//return all - needs updated.
exports.queryAll = function(sql){
	con.connect(function(err) {
		if (err) throw err;
		con.query(sql, function (err, result, fields) {
			if (err) throw err;
			return result;
		});
	});
};

//promise structure.
/*db.queryOne("SELECT * FROM user WHERE username = '"+data.username+"'").then(row => {
	console.log(row[0].username);
}).catch(err => {
	console.log("Database error: " + err);
	throw err;
});*/