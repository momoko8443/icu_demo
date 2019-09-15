const low = require('lowdb')
const _ = require('lodash')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./db/db.json')

const db = low(adapter)

// Set some defaults (required if your JSON file is empty)
//const beds = ["1床","2床","3床","4床","5床","6床","7床","8床","9床","10床","11床","12床","13床","14床","15床","16床","17床","18床","19床","20床","21床"];
const clients = [
    {
        name: "1号病区",
        type: "callee",
        range: ["1床","2床","3床","4床","5床","6床","7床"],
        clientId: "",
        isCompleted: false
    },
    {
        name: "2号病区",
        type: "callee",
        range: ["8床","9床","10床","11床","12床","13床","14床"],
        clientId: "",
        isCompleted: false
    },
    {
        name: "3号病区",
        type: "callee",
        range: ["15床","16床","17床","18床","19床","20床","21床"],
        clientId: "",
        isCompleted: false
    },
    {
        name: "护士站",
        type: "caller",
        range: ["护士站"],
        clientId: "",
        isCompleted: false
    },
    {
        name: "探视端",
        type: "caller",
        range: ["探视端"],
        clientId: "",
        isCompleted: false
    },
]
db.defaults({
    clients: clients
    })
    .write();

db.defaults({
        users: [{
            username: 'admin',
            password: 'admin'
        }]
    })
    .write();

function IcuDB() {
    this.getUser = function(username){
        return db.get('users').find({username: username}).value();
    };
    this.getClients = function(filter){
        return db.get('clients').filter(filter).value();
    };

    this.getClient = function(alias){
        return db.get('clients').filter((o)=>{
            return _.includes(o.range,alias);
        }).value();
    };

    this.setClient = function(name, clientId){
        return db.get('clients').find({'name':name}).assign({ 'clientId': clientId, 'isCompleted': true }).write();
    };

    this.removeClient = function(clientId){
        return db.get('clients').find({'clientId': clientId}).assign({ 'clientId': '', 'isCompleted': false }).write();
    }
}

module.exports = new IcuDB();