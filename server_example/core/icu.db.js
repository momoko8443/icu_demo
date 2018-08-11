const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
console.log(__dirname);
const adapter = new FileSync('./db/db.json')

const db = low(adapter)

// Set some defaults (required if your JSON file is empty)
var channels = [{
        id: 'c1',
        name: 'Channel 1',
        peers: []
    },
    {
        id: 'c2',
        name: 'Channel 2',
        peers: []
    },
    {
        id: 'c3',
        name: 'Channel 3',
        peers: []
    },
    {
        id: 'c4',
        name: 'Channel 4',
        peers: []
    },
    {
        id: 'c5',
        name: 'Channel 5',
        peers: []
    }
];
db.defaults({
        channels: channels
    })
    .write();

db.defaults({
        users: [{
            username: 'admin',
            password: '161ebd7d45089b3446ee4e0d86dbcf92'
        }]
    })
    .write();

function IcuDB() {
    this.getUser = function(username){
        return db.get('users').find({username: username}).value();
    };

    this.getChannels = function () {
        return db.get('channels').value();
    };

    this.getChannel = function (channelId) {
        return db.get('channels').find({
            id: channelId
        }).value();
    }

    this.getPeers = function (channelId) {
        return db.get('channels').find({
            id: channelId
        }).get('peers').value();
    };

    this.getPeer = function (channelId, peerId) {
        return db.get('channels').find({
            id: channelId
        }).get('peers').find({
            id: peerId
        }).value();
    }

    this.addPeer = function (channelId, peer) {
        db.get('channels').find({
            id: channelId
        }).get('peers').push(peer).write();
    };

    this.removePeer = function (channelId, peerId) {
        db.get('channels').find({
            id: channelId
        }).get('peers').remove({
            id: peerId
        }).write();
    };
}

module.exports = new IcuDB();