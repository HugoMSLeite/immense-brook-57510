let express = require('express')
let http = require('http')
let io = require('socket.io')
let path = require('path')
let ws = require('./web-socket')
const jwt = require('jsonwebtoken')
let bodyParser = require('body-parser')
let uuid = require('uuid');


let twilio = require('twilio')(
  'ACdf255335cf14e64751dfb64ac8fc9f1e',
  '421357628985926aec97c7518345525a'
);

class Server {

  DEFAULT_PORT = process.env.PORT || 8080
  httpServer
  app = express()
  io
  activeSockets = []
  listTokens = []
  salas = []

  constructor() {
    this.initialize()

    this.configureApp()
    this.handleRoutes()
    this.handleSocketConnection()
  }

  initialize() {
    this.app = express()
    this.httpServer = http.createServer(this.app)
    this.io = io(this.httpServer)
  }

  handleRoutes() {
    this.app.use(bodyParser.urlencoded({
      extended: false
    }));
    this.app.use(bodyParser.json());

    this.app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*")
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Tokenid")
      next()
    })

    this.app.get("/", (req, res) => {
      res.sendFile("index.html")
    })

    this.app.get("/*", (req, res) => {
      res.sendFile("index.html")
    })

    this.app.get("/routes", (req, res) => {
      twilio.tokens.create(function (err, response) {
        if (err) {
          console.log(err)
        } else {
          res.send(response)
        }
      });
    });

    this.app.post("/authenticate", (req, res) => {
      var token = jwt.sign({
        user: req.body
      }, 'secret', {
        expiresIn: '1h'
      })
      let user = {
        ...req.body,
        id: uuid.v1()
      }
      this.listTokens[user.id] = {
        user,
        token
      }
      return res.json({
        user,
        token
      })
    })

    this.app.post("/refresh-token", (req, res) => {
      var token = jwt.sign({
        user: this.listTokens[req.headers.Tokenid]
      }, 'secret', {
        expiresIn: '1h'
      })
      if (this.listTokens[req.headers.Tokenid]) {
        this.listTokens[req.headers.Tokenid].token = token
        return res.json({
          token
        })
      } else {
        return res.status(204).send('token não encontrado')
      }
    })

    this.app.post('/revoke-token', (req, res) => {
      this.listTokens[req.headers.Tokenid] = null
      return res.send();
    })

    this.app.post('/validate-reset-token', (req, res) => {
      try {
        var decoded = jwt.verify(token, 'secret');
        if (decoded.user && this.listTokens[req.headers.Tokenid]) {
          var token = jwt.sign({
            user: this.listTokens[req.headers.Tokenid]
          }, 'secret', {
            expiresIn: '1h'
          })
          this.listTokens[req.headers.Tokenid].token = token
          return res.json({
            token
          })
        } else {
          return res.statusCode(409)
        }
      } catch (err) {
        return res.statusCode(409)
      }
    })
  }

  handleSocketConnection() {
    this.io.on("connection", socket => {
      ws(socket, this.io, this.salas)
    })
  }

  listen(callback = (port) => {}) {
    this.httpServer.listen(this.DEFAULT_PORT, () =>
      callback(this.DEFAULT_PORT)
    )
  }

  configureApp() {
    this.app.use(express.static(path.join(__dirname, "../client/build")))
  }
}

module.exports = Server;