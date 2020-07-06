import axios from 'axios';
import openSocket from 'socket.io-client';

const api = axios.create({
    baseURL: 'http://localhost:8080',
});

function Websocket(props, socket) {
    const {
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        handleUpdateRoomList,
        handleGetRoom,
        handleCallRejected,
        handleIceServices
    } = props;
    if (!socket) {
        var wsPath = window.location.protocol + "//" + window.location.hostname + ':8080';
        socket = openSocket(wsPath);
        socket.on('connect', function () { });
        socket.on('disconnect', function () { });

        socket.on("call-made", data => {
            handleOffer(data)
        });

        socket.on("answer-made", data => {
            handleAnswer(data);
        });

        socket.on("call-rejected", data => {
            handleCallRejected();
        });

        socket.on("candidate-made", data => {
            handleIceCandidate(data);
        });

        socket.on('ice-services', function (data) {
            handleIceServices(data.iceServers);
        });

        socket.on('update-list-rooms', data => {
            handleUpdateRoomList(data)
        });

        socket.on('get-room', data => {
            handleGetRoom(data)
        });
    }

    function createRoom(room) {
        socket.emit('create-room', room)
    }

    function listarSalas() {
        socket.emit('update-list-rooms')
    }

    function getRoom(salaId) {
        socket.emit('get-room', salaId)
    }

    function getIceServices() {
        socket.emit('ice-services')
    }

    function enterRoom(sala) {
        console.log('enter-room')
        socket.emit('enter-room', sala)
    }

    function sendOffer(data) {
        socket.emit("call-made", data)
    }

    function sendAnswer(data) {
        socket.emit('make-answer', data)
    }

    function getId() {
        return socket.id;
    }

    return {
        listarSalas,
        createRoom,
        getRoom,
        getIceServices,
        enterRoom,
        sendOffer,
        sendAnswer,
        id: getId
    }
}

export { api, Websocket }