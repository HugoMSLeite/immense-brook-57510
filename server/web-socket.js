let uuid = require('uuid')
let twilio = require('twilio')(
    'ACdf255335cf14e64751dfb64ac8fc9f1e',
    '61134e1eb12b2814683a87ec29dd1005'
)

module.exports = function (socket, io, salas) {
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
        salas.forEach(sala => {
            if (sala.salaId === socket.salaId) {
                var userIndex = sala.users.find(user => user === socket.id)
                if (userIndex != -1)
                    sala.users.splice(userIndex)
                return;
            }
        })
    })

    socket.on('ice-services', () => {
        twilio.tokens.create(function (err, response) {
            if (err) {
                console.log(err)
            } else {
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
        salas.forEach(item => {
            if (item.salaId === data) {
                item.users.push(socket.id)
                socket.emit('return-room', item)
                socket.salaId = item.salaId
            }
        });
    })

    socket.on('update-list-rooms', () => {
        socket.emit('update-list-rooms', salas)
    })

    socket.on('remove-room', data => {
        let index = salas.findIndex(item => item.salaId === data)
        if (index != -1)
            salas.splice(index, 1)
        io.emit('update-list-rooms', salas)
    })

    socket.on('leave-room', data => {
        let index = salas.map(sala => {
            if (sala.salaId === data) {
                var userIndex = sala.users.find(user => user === socket.id)
                if (userIndex != -1)
                    sala.users.splice(userIndex)
                return;
            }
        })
    })
}