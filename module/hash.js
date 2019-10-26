//https://nodejs.org/api/crypto.html
exports.hash = function(input){
	const crypto = require('crypto');
	const secret = 'GCURocks';
	const hash = crypto.createHmac('sha256', secret).update(input).digest('hex');
	return hash;
};