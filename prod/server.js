var thisPeer = {
	port: 1102,
	ip: 'localhost'
}
var server = require("./core").server;

server(thisPeer);
