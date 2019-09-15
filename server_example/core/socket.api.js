var socketIo = require("socket.io"); 

module.exports = function(webServer){
    var socketServer = socketIo.listen(webServer, {"log level":1});
    var roomMap = {};
    var clientMap = {};
    socketServer.on('connection', function (socket) {
        socket.emit('client_connected', { message: 'client connected successfully' });
        socket.on('client_info', function(data){
            var clientId = data.clientId;
            clientMap[socket.id] = clientId;
        });
        socket.on('disconnect',function(data){ 
            var roomName = roomMap[socket.id];
            var data = {room:roomName};
            socketServer.to(roomName).emit('peer_exit',data);
            console.log('client disconnect:',data.room);
        });
        socket.on('create_room', function (data) {
            roomMap[socket.id] = data.room;
            socket.join(data.room);
            socket.broadcast.emit('invite_join_room',data);
            console.log(clientMap[socket.id] + "进入房间:" + data.room );
        });
        socket.on('join_room', function(data){
            roomMap[socket.id] = data.room;
            socket.join(data.room);
            console.log(clientMap[socket.id] + "进入房间:" + data.room );
        });
        socket.on('dial',function(data){
            var room = data.room;
            socketServer.to(room).emit('dial',data);
        });
        socket.on('peer_exit',function(data){
            var room = data.room;
            socketServer.to(room).emit('peer_exit',data);
            console.log('peer_exit',data.room);
        });
        socket.on('cancel_calling',function(data){
            var room = data.room;
            socketServer.to(room).emit('cancel_calling',data);
        });
        socket.on('hangup_call',function(data){
            var room = data.room;
            socketServer.to(room).emit('hangup_call',data);
            console.log('hangup_call',data.room);
        });

    });
    return socketServer;
}