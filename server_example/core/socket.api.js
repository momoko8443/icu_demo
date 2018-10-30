var socketIo = require("socket.io"); 

module.exports = function(webServer){
    var socketServer = socketIo.listen(webServer, 
        {
            "log level":1,
            //pingInterval: 10000,
            //pingTimeout: 5000
        }
    );
    var roomMap = {};
    socketServer.on('connection', function (socket) {
        socket.emit('client_connected', { message: 'client connected successfully' });
        socket.on('disconnect',function(data){ 
            var roomName = roomMap[socket.id];
            var data = {room:roomName};
            socketServer.to(roomName).emit('peer_exit',data);
            console.log('----------------------', socket.id + ' disconnected');
        });
        socket.on('join_room', function (data) {
            var roomName = data.room;
            roomMap[socket.id] = data.room;
            socket.join(data.room);
            console.log('----------------------', socket.id + ' joined room ' + data.room);
        });
        socket.on('dial',function(data){
            var room = data.room;
            socketServer.to(room).emit('dial',data);
        });
        socket.on('peer_exit',function(data){
            var room = data.room;
            socketServer.to(room).emit('peer_exit',data);
        });
        socket.on('cancel_calling',function(data){
            var room = data.room;
            socketServer.to(room).emit('cancel_calling',data);
        });
        socket.on('hangup_call',function(data){
            var room = data.room;
            socketServer.to(room).emit('hangup_call',data);
        });

    });
    return socketServer;
}