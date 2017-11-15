var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = process.env.SOCKETIO_GATEWAY_PORT || 5005;
var clientIndex = 0;
var clients = {};
var lastMsg = {};

var adminIo = io.of('/admin');

app.use(express.json());
app.get('/', (req, res) => res.send('Debug Tools: <a href="/log">Log</a> and <a href="/stats">Stats</a>'));
app.get('/log', (req, res) => {
  res.sendFile(__dirname + '/log.html');
});

app.get('/stats', (req, res) => {
  res.json(lastMsg);
});

app.post('/events/:room/:event', (req, res) => {

  io.to(req.params.room).emit(req.params.event, req.body);
  adminIo.emit('forward-message', {
    'room': req.params.room,
    'event': req.params.event,
    'content': req.body
  });

  lastMsg[req.params.room] = new Date().toISOString();

  res.end();
});

io.on('connection', function(socket){
  console.log(`Socket ${socket.id} connected`);
  clientId = clientIndex++;
  clients[clientId] = socket;

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
    delete clients[clientId];
  });

  socket.on('join', (room) => {
    console.log(`Socket ${socket.id} joined room ${room}`);
    socket.join(room);
  });
});

http.listen(port, function(){
  console.log(`socket.io-gateway listening on *:${port}`);
});
