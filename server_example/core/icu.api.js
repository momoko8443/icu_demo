var express = require("express");
var fs = require('fs');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session = require('express-session')
var shortid = require('shortid');
var icudb = require('./icu.db');

var app = express();
var sessionPool = {};
app.use(express.static('static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'ICU_RTC',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true
    }
}));

app.use('/api/*', authMiddleware);


app.post('/authentication', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    password = crypto.createHash('md5').update(password).digest('hex');
    var validUser = icudb.getUser(username);
    if (username === "admin" && password === validUser.password) {
        var token = crypto.createHash('md5').update(username + password).digest('hex');
        sessionPool[req.session.id] = token;
        req.session.token = token;
        res.sendStatus(200);
    } else {
        res.sendStatus(401);
    }
});

app.get('/config', function(req, res){
    var cfg = JSON.parse(fs.readFileSync('config/config.json'));
    return res.send(cfg);
});

app.get('/api/channels', function (req, res) {
    var channels = icudb.getChannels();
    res.send(channels);
});

app.post('/api/channels/:channelid/peers', function (req, res) {
    var channelId = req.params.channelid;
    var alias = req.body.alias || shortid.generate();
    var peer = {
        id: shortid.generate(),
        alias: alias
    };
    var channel = icudb.getChannel(channelId);
    if (channel) {
        if (channel.peers.length < 2) {
            peer.channel = {
                id: channel.id,
                name: channel.name
            };
            icudb.addPeer(channelId,peer);
            res.send(peer);
        } else {
            //peer full
            res.status(500).send({
                message: "此频道已满员"
            });
        }
    } else {
        //channel not found
        res.status(404).send({
            message: "频道不存在"
        });
    }
});

app.delete('/api/channels/:channelid/peers/:peerid', function (req, res) {
    var channelId = req.params.channelid;
    var peerId = req.params.peerid;
    var channel = icudb.getChannel(channelId);
    if (channel) {
        var peer = icudb.getPeer(channelId,peerId);
        if(peer){
            icudb.removePeer(channelId,peerId);
            res.send(200);
        } else {
            res.status(404).send({
                message: "未找到当前终端"
            });
        }
    } else {
        //channel not found
        res.status(404).send({
            message: "频道不存在"
        });
    }
});

function authMiddleware(req, res, next) {
    if (sessionPool[req.session.id] && sessionPool[req.session.id] === req.session.token) {
        next();
    } else {
        res.sendStatus(401);
    }
}

module.exports = app;