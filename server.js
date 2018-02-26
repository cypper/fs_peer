var thisPeer = {
	port: 1101,
	ip: 'localhost'
}
var server = require("./core").server;

server(thisPeer);