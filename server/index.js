var express = require('express');
var http = require('http');
var io = require('socket.io');
var path = require('path');

var twilio = require('twilio')(
  'ACdf255335cf14e64751dfb64ac8fc9f1e',
  '421357628985926aec97c7518345525a'
);
 
class Server {
 
 DEFAULT_PORT = process.env.PORT || 8080;
 httpServer;
 app = express();
 io;
 activeSockets = [];
 
 constructor() {
   this.initialize();
 
   this.configureApp();
   this.handleRoutes();
   this.handleSocketConnection();
 }
 
  initialize() {
   this.app = express();
   this.httpServer = http.createServer(this.app);
   this.io = io(this.httpServer);
 }
 
 handleRoutes() {
    this.app.get("/", (req, res) => {
        res.sendFile("index.html");
      }); 
 }
 
 handleSocketConnection() {
    this.io.on("connection", socket => {
        const existingSocket = this.activeSockets.find(
          existingSocket => existingSocket === socket.id
        );
  
        if (!existingSocket) {
          this.activeSockets.push(socket.id);
  
          socket.emit("update-user-list", {
            users: this.activeSockets.filter(
              existingSocket => existingSocket !== socket.id
            )
          });
  
          socket.broadcast.emit("update-user-list", {
            users: [socket.id]
          });
        }
  
        socket.on("call-user", (data) => {
          socket.to(data.to).emit("call-made", {
            offer: data.offer,
            socket: socket.id
          });
        });
  
        socket.on("make-answer", data => {
          socket.to(data.to).emit("answer-made", {
            socket: socket.id,
            answer: data.answer
          });
        });
  
        socket.on("reject-call", data => {
          socket.to(data.from).emit("call-rejected", {
            socket: socket.id
          });
        });

        socket.on("send-candidate", (data) => {
            socket.to(data.to).emit("candidate-made", {
              candidate: data.candidate,
              socket: socket.id
            });
          });
  
        socket.on("disconnect", () => {
          this.activeSockets = this.activeSockets.filter(
            existingSocket => existingSocket !== socket.id
          );
          socket.broadcast.emit("remove-user", {
            socketId: socket.id
          });
        });

        socket.on('token', function(){
          twilio.tokens.create(function(err, response){
            if(err){
              console.log(err);
            }else{
              socket.emit('token', response);
            }
          });
        });
      });
 }
 
 listen(callback = (port) => {}) {
   this.httpServer.listen(this.DEFAULT_PORT, () =>
     callback(this.DEFAULT_PORT)
   );
 }

 configureApp() {
    this.app.use(express.static(path.join(__dirname, "../public")));
  }
}

module.exports = Server;