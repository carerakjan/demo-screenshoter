#!/usr/bin/env node

var WebSocketServer = require('ws').Server;

var webshot = require('webshot');
var http = require('http');
var url = require('url');
var fs = require('fs');

var args = { /* defaults */
  port: '8080'
};

/* Parse command line options */
var pattern = /^--(.*?)(?:=(.*))?$/;
process.argv.forEach(function(value) {
  var match = pattern.exec(value);
  if (match) {
    args[match[1]] = match[2] ? match[2] : true;
  }
});

var port = parseInt(args.port, 10);

console.log("Usage: ./server.js [--port=8080]");

var connections = {}; 

// ws is the fastest websocket lib - http://einaros.github.com/ws/
var wsServer = new WebSocketServer({port: port});

wsServer.on('connection', function(ws) {

  ws.id = Date.now(); // Assign unique id to this ws connection.
  connections[ws.id] = ws;

  var userAgent = ws.upgradeReq.headers['user-agent'];

  console.log((new Date()) + ' Connection accepted: ' + ws.id);

  var device = {};

  ws.on('message', function(message, flags) {

    if(typeof message === 'string') {
      message = JSON.parse(message);
      device.w = message.w;
      device.h = message.h;
    } else {
      console.log('Received ' + (flags.binary ? 'binary' : '') + ' message: ' +
          message.length + ' bytes.');

      webshot(message.toString(), Date.now() + '_' + Math.random() + '.png', {
        siteType:'html',
        screenSize: {
          width: device.w
          ,height: device.h
        }
        ,userAgent: userAgent
      }, function(err) {
        // screenshot now saved to hello_world.png
      });
    }



    //broadcast(message, this, flags);
  });

  ws.on('close', function() {
    console.log((new Date()) + " Peer " + this.id + " disconnected.");
    delete connections[this.id];
  });
});

// Broadcasts a message to all connected sockets accept for the sender.
function broadcast(message, fromWs, flags) {
  for (var id in connections) {
    if (id != fromWs.id) {
      connections[id].send(message, {
        binary: flags.binary ? true : false,
        mask: false
      });
    }
  }
}