let uuid = require('uuid')
let twilio = require('twilio')(
    'ACdf255335cf14e64751dfb64ac8fc9f1e',
    '421357628985926aec97c7518345525a'
)

module.exports = function (socket, io, salas = []) {
    this.activeSockets = []

    const existingSocket = this.activeSockets.find(
        existingSocket => existingSocket === socket.id
    )

    if (!existingSocket) {
        this.activeSockets.push(socket.id);
    }

    socket.on("call-user", (data) => {
        socket.to(data.to).emit("call-made", data)
    })

    socket.on("make-answer", data => {
        socket.to(data.to).emit("answer-made", data)
    })

    socket.on("send-candidate", (data) => {
        socket.to(data.to).emit("candidate-made", data)
    })

    socket.on("disconnect", () => {
        this.activeSockets = this.activeSockets.filter(
            existingSocket => existingSocket !== socket.id
        );
    })

    socket.on('ice-services', () => {
        console.log('ice-services')
        twilio.tokens.create(function (err, response) {
            if (err) {
                console.log(err)
            } else {
                console.log('emit ice')
                socket.emit('ice-services', response)
            }
        })
    })

    socket.on('create-room', data => {
        data.salaId = uuid.v1()
        data.users = []
        salas.push(data)
        console.log('sala criada')
        io.emit('update-list-rooms', salas)
    })

    socket.on('enter-room', data => {
        salas.map(item => {
            if (item.salaId === data.salaId) {
                item.users.push(socket.id)
            }
        });
    })

    socket.on('update-list-rooms', () => {
        socket.emit('update-list-rooms', salas)
    })

    socket.on('get-room', data => {
        salas.map(item => {
            if (item.salaId === data) {
                socket.emit('get-room', item)
            }
        });

    })
}