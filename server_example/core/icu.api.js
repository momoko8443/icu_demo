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

//app.use('/api/*', authMiddleware);


app.post('/authentication', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    //password = crypto.createHash('md5').update(password).digest('hex');
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
app.get('/api/uncompleted_clients', function(req, res){
    var clients = icudb.getClients({isCompleted:false});
    if(clients){
        res.send(clients);
    }else{
        res.status(404).send({
            message: "client不存在"
        });
    }
});
app.get('/api/completed_clients', function(req, res){
    var clients = icudb.getClients({isCompleted:true});
    if(clients){
        res.send(clients);
    }else{
        res.status(404).send({
            message: "client不存在"
        });
    }
});
app.get('/api/clients/:name', function(req, res){
    var name = req.params.name;
    var clients = icudb.getClient(name)
    if(clients && clients[0]){
        res.send(client);
    }else{
        res.status(404).send({
            message: "client不存在"
        });
    }
});

app.put('/api/clients', authMiddleware,function(req, res){
    var name = req.body.name;
    var color = req.body.color;
    if(!color){
        res.status(400).send({
            message: "请填写客户端配色"
        });
    }
    var client = icudb.setClient(name, color,shortid.generate())
    if(client){
        res.send(client);
    }else{
        res.status(404).send({
            message: "client不存在"
        });
    }
});

app.delete('/api/clients/:id', authMiddleware, function(req, res){
    var id = req.params.id;
    var client = icudb.removeClient(id);
    if(client){
        res.send(client);
    }else{
        res.status(404).send({
            message: "client不存在"
        });
    }
});

app.delete('/api/clients', authMiddleware, function(req, res){
    icudb.removeAllClients();
    res.sendStatus(200);
});



function authMiddleware(req, res, next) {
    if (sessionPool[req.session.id] && sessionPool[req.session.id] === req.session.token) {
        next();
    } else {
        res.sendStatus(401);
    }
}

function authAPIMiddleware(req, res, next){
    let pwd = "admin:admin";
    let code = 'Basic ' + Buffer.from(pwd).toString('base64');//YWRtaW46YWRtaW4=
    console.log('code',code);
    console.log('head', JSON.stringify(req.headers['authorization']));
    if(req.headers['authorization'] && req.headers['authorization'] === code){
        next();
    }else{
        res.sendStatus(401);
    }
}

module.exports = app;