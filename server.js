var thisPeer = {
	port: process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
	ip: process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
}
var server = require("./core").server;

server(thisPeer);
