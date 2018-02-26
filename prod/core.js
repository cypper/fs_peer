exports.server = function(thisPeer) {
  const libs = require("./libs");
  const server = require("./mainServer");
  const peersUrl = "http://projects.ferm.pp.ua/files/peers.json";
  global.peers = [];

  


  libs.getAllPeers(peersUrl, function(allPeers) {
    global.peers = libs.cleanPeers(allPeers,thisPeer);

    console.log(global.peers);
    server(thisPeer);
  });
  return;



}