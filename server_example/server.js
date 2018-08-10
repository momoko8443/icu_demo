// Load required modules
var http    = require("http"); 
var https   = require("https");                  // http server core module
var express = require("express");       // web framework external module
var serveStatic = require('serve-static');  // serve static files
var socketIo = require("socket.io");        // web socket external module
var easyrtc = require("../");               // EasyRTC external module
var fs = require('fs');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session = require('express-session')
var shortid = require('shortid');

// Set process name
process.title = "node-easyrtc";

// Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var app = express();
app.use(serveStatic('static', {'index': ['index.html']}));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(session({
    secret: 'ICU_RTC',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }));

app.use('/api/*',authMiddleware);

var sessionPool = {};
app.post('/authentication', function(req ,res ){
    var username = req.body.username;
    var password = req.body.password;
    password = crypto.createHash('md5').update(password).digest('hex');
    if(username === "admin" && password === "161ebd7d45089b3446ee4e0d86dbcf92"){
        var token = crypto.createHash('md5').update(username+password).digest('hex');
        sessionPool[req.session.id] = token;
        req.session.token = token;
        res.sendStatus(200);
    }else{
        res.sendStatus(401);
    }
});

app.get('/api/channels',function(req,res){
    res.send(channels);
});

app.post('/api/channels/:channelid/peers',function(req, res){
    var channelId = req.params.channelid;
    var alias = req.body.alias || shortid.generate();
    var peer = {id:shortid.generate(),alias:alias};
    var channel = channels.find(function(ch){
        return ch.id === channelId;
    });
    if(channel){
        if(channel.peers.length < 2){
            channel.peers.push(peer);
            peer.channel = {id:channel.id,name:channel.name};
            res.send(peer);
        }else{
            //peer full
            res.status(500).send({message:"peers full"});
        }
    }else{
        //channel not found
        res.status(404).send({message:"channel not found"});
    }
});

app.delete('/api/channels/:channelid/peers/:peerid', function(req, res){
    var channelId = req.params.channelid;
    var peerId = req.params.peerid;
    var channel = channels.find(function(ch){
        return ch.id === channelId;
    });
    if(channel){
        var peerIndex = channel.peers.findIndex(function(peer){
            return peer.id = peerId;
        });
        if(peerIndex > -1){
            channel.peers.splice(peerIndex,1);
            res.send(200);
        }else{
            res.status(404).send({message:"peer not found"});
        }
    }else{
        //channel not found
        res.status(404).send({message:"channel not found"});
    }
});

var channels = [
    {id:'c1',name:'Channel 1',peers:[]},
    {id:'c2',name:'Channel 2',peers:[]},
    {id:'c3',name:'Channel 3',peers:[]},
    {id:'c4',name:'Channel 4',peers:[]},
    {id:'c5',name:'Channel 5',peers:[]}
];

function authMiddleware(req, res, next){
    if (sessionPool[req.session.id] && sessionPool[req.session.id] === req.session.token) {
        next();
    }else{
        res.sendStatus(401);
    }  
}




// Start Express http server on port 8080
var ssl = {
    key:  fs.readFileSync("./key.pem"),
    cert: fs.readFileSync("./cert.pem")
}
var webServer = https.createServer(ssl,app);
//var webServer = http.createServer(app);
// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {"log level":1});

easyrtc.setOption("logLevel", "debug");

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

        console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

//listen on port 8443
webServer.listen(8443, function () {
    console.log('listening on http://localhost:8443');
});
// webServer.listen(8080, function () {
//     console.log('listening on http://localhost:8080');
// });
