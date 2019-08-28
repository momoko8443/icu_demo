var icudb = require('./core/icu.db');
var shortid = require('shortid');

let clients = icudb.getClients();
//let client = icudb.setClient('8床',shortid.generate());
//let client2 = icudb.removeClient(client.clientId);
//let clients = icudb.getClients();
//console.log(client);
console.log(clients);