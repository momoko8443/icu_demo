var socketIo = require("socket.io"); 

module.exports = function(webServer){
    var socketServer = socketIo.listen(webServer, {"log level":1});

    socketServer.on('connection', function (socket) {
        socket.emit('client_connected', { hello: 'world' });
        socket.on('join_room', function (data) {
            console.log(data);
            socket.join(data.room);
        });
        socket.on('dial',function(data){
            var room = data.room;
            socketServer.to(room).emit('dial',data);
        });
        socket.on('peer_exit',function(data){
            var room = data.room;
            socketServer.to(room).emit('peer_exit',data);
        });
    });
    return socketServer;
}