// Load required modules
var http    = require("http"); 
var https   = require("https");                  // http server core module
var easyrtc = require("../");               // EasyRTC external module
var fs = require('fs');
var app = require('./core/icu.api');
var createSocketServer = require('./core/socket.api');
var schedule = require('node-schedule');

// Set process name
process.title = "node-easyrtc";

// Start Express http server on port 8080
var ssl = {
    key:  fs.readFileSync("./key.pem"),
    cert: fs.readFileSync("./cert.pem")
}
var webServer = https.createServer(ssl,app);
//var webServer = http.createServer(app);
// Start Socket.io so it attaches itself to Express server
var socketServer = createSocketServer(webServer);

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
    console.log('listening on 8443');
});

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0,1,2,3,4,5,6];
rule.hour = 22;
rule.minute = 0;

var refreshJob = schedule.scheduleJob(rule, function(){
    socketServer.emit('refreshAllClient','refresh');
    console.log('refresh all client at', new Date().toLocaleDateString());
});

