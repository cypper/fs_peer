const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const libs = require("./libs");
const customEvents = {};

libs.onMethod(customEvents, "GETSTATUS", function(res){
  res.end("ok");
})
libs.onMethod(customEvents, "SENDFILE", function(res,name,file){
  libs.writeFile('data/'+name,file,function(){
    res.end("file,send,saved");
  },function(err) {
    res.end("error:" + err);
  })
})
libs.onMethod(customEvents, "GETFILE", function(res,name){
  libs.readFile('data/'+name,function(data){
    res.end(data.toString());
  },function(err) {
    res.end("error:" + err);
  })
})

module.exports = function(thisPeer) {
  http.createServer(function(request, response) {
    console.log(request.method," ",request.url);
    // if (request.method != 'POST' || request.url != '/') return;

    if (request.method == "GET") {
      libs.readFile("./gui.html", function(data){
        response.write(data);
        response.end();
      })
    } else if (request.method == "POST") {
      if (request.url == "/GETFILE") {
        libs.parseBody(request,function(body){
          let data;
          try {
              data = JSON.parse(body);
          } catch (e) {
              response.end("ERROR: "+body);
              return;
          }
          if (!data.name) {
            response.end(data);
            return;
          }

          libs.sendRequestToPeers({
              path: '/GETFILE',
              method: 'PATCH',
              body: JSON.stringify({name:data.name})
          }, global.peers, function(obj){
            response.end('<b>'+data.name+'</b>\n' + JSON.stringify(obj));
          })

        })
      } else if (request.url == "/SENDFILE") {
        libs.parseBody(request,function(body){
          let data;
          try {
              data = JSON.parse(body);
          } catch (e) {
              response.end("ERROR: "+body);
              return;
          }
          if (!data.name || !data.data) {
            response.end(data);
            return;
          }
          libs.writeFile('data/'+data.name,data.data,function(){
            libs.readFile('data/'+data.name,function(file){
              libs.sendRequestToPeers({
                  path: '/SENDFILE',
                  method: 'PATCH',
                  body: JSON.stringify({name:data.name,data:file.toString()})
              }, global.peers, function(obj){
                response.end('Response\n' + JSON.stringify(obj));
              })

              // libs.sendRequest(
              //   {
              //     host: peer.ip,
              //     port: peer.port,
              //     path: '/SENDFILE',
              //     method: 'PATCH',
              //   body: JSON.stringify({name:data.name,data:file.toString()})
              //   },
              //   function (chunk) {
              //     response.end('Response: ' + chunk);
                  
              // });
            });
          },function(err) {
            res.end("error:" + err);
          })
        });
      } else if (request.url == "/GETSTATUS") {
        libs.sendRequestToPeers({
            path: '/GETSTATUS',
            method: 'PATCH',
        }, global.peers, function(obj){
          response.end(JSON.stringify(obj));
        })

      }
    } else if (request.method == "PATCH") {
      if (request.url == "/GETSTATUS") {
        libs.fireMethod(customEvents, "GETSTATUS", [response]);
      } else if (request.url == "/SENDFILE") {
        libs.parseBody(request,function(body){
          const data = JSON.parse(body);
          libs.fireMethod(customEvents, "SENDFILE", [response,data.name,data.data]);
        })
      } else if (request.url == "/GETFILE") {
        libs.parseBody(request,function(body){
          const data = JSON.parse(body);
          libs.fireMethod(customEvents, "GETFILE", [response,data.name]);
        })
      }
    } else {
      response.end();
    }


  }).listen(thisPeer.port,thisPeer.ip);
}