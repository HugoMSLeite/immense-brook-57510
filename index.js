const Server = require("./server");
var Turn = require('node-turn');
 
const server = new Server();
 
server.listen(port => {
 console.log(`Server is listening on http://localhost:${port}`);
});


// var turnServer = new Turn({
//   authMech: 'none',
//   credentials: {
//     username: "eEscola",
//     password: "eEscola"
//   }
// });
// turnServer.start();