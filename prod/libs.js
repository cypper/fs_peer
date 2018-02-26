const http = require("http")
const fs = require("fs")
const urlParser = require("url")

const libs = {
  sendRequest: function(opt,onData, onErr) {
    const req = http.request(opt, function(res) {
        res.setEncoding('utf8');
        res.on('data', onData);
    });
    if (onErr) req.on('error', onErr);


    req.write(opt.body || '');
    req.end();
  },
  readFile: function(file_name,onRead,onErr) {
    fs.readFile(file_name, (err, data) => {
      if (err) {
        if (onErr) onErr(err);
        else throw err;
      } else {
        onRead(data);
      }
    });
  },
  writeFile: function(file_name,data,onWrote,onErr) {
    fs.writeFile(file_name, data, (err) => {
      if (err) {
        if (onErr) onErr(err);
        else throw err;
      } else {
        onWrote();
      }
    });
  },
  readBinaryFile: function(path,onRead) {
    fs.open(path, 'r', function(status, fd) {
        if (status) {
            console.log(status.message);
            return;
        }
        const buffer = new Buffer(100);
        fs.read(fd, buffer, 0, 100, 0, function(err, num) {
            console.log(buffer.toString('utf8', 0, num));
        });
    });
  },
  writeBinaryFile: function(path,buffer,onRead, onErr) {
    fs.open(path, 'w', function(err, fd) {
      if (err) {
        if (onErr) onErr(err);
        else throw err;
      } else {
        fs.write(fd, buffer, onRead);
      }
    });
  },
  parseBody: function(request,onBody) {
   let body = '';
    request.on('data', function (data) {
        body += data;
        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
            request.connection.destroy();
    });

    request.on('end', function () {
      onBody(body);
    });
  },
  onMethod: function(customEvents,method,callback) {
    customEvents[method] = callback;
  },
  fireMethod: function(customEvents,method,args) {
    if (!customEvents[method]) return;
    customEvents[method].apply(null, args);
  },
  getAllPeers: function(url,onGet) {
    const urlComponents = urlParser.parse(url);
    this.sendRequest(
      {
        host: urlComponents.host,
        path: urlComponents.path,
        method: 'GET',
      },
      function (chunk) {
        onGet(JSON.parse(chunk).peers);
        
    });
  },
  cleanPeers: function(allPeers,thisPeer) {
    let peers = [];
    for (let i = 0; i < allPeers.length;i++) {
      const peer = allPeers[i];
      if (!(peer.ip == thisPeer.ip && peer.port == thisPeer.port)) {
        peers.push(peer);
      }
    }
    return peers;
  },
  sendRequestToPeers: function(options,peers,onEnd) {
    const opts = options;
    let response = [];
    for (const peer of peers) {
      let tempOpts = Object.assign({
        host: peer.ip,
        port: peer.port,
      }, opts);
      this.sendRequest(tempOpts, function (chunk) {
        response.push({
          peer: peer,
          answer: chunk,
        })
        if (response.length == peers.length) {
          onEnd(response);
        };
      }, function(err) {
        response.push({
          peer: peer,
          answer: err,
        })
        if (response.length == peers.length) {
          onEnd(response);
        };
      });
    }
  }
}

module.exports = libs;
