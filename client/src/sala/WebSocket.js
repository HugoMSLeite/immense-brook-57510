import React, { Component } from 'react';
import openSocket from 'socket.io-client';

class Websocket extends Component {
    constructor(props) {
        super(props);
    }

    socket;

    setupConnection = () => {
        const {
            handleOffer,
            handleAnswer,
            handleIceCandidate,
            handleUpdateUserList,
            handleRemoveUser,
            handleCallRejected
        } = this.props;

        socket.on("update-user-list", ({ users }) => {
            handleUpdateUserList(users);
        });

        socket.on("remove-user", ({ socketId }) => {
            handleRemoveUser(socketId);
        });

        socket.on("call-made", data => {
            handleOffer(data)
        });

        socket.on("answer-made", async data => {
            handleAnswer(data);
          });
          
          socket.on("call-rejected", data => {
            handleCallRejected();
          });
          
          socket.on("candidate-made", async data => {
            handleIceCandidate(data);
          });
    }

    componentDidMount() {
        socket = openSocket(window.location.origin);
        socket.on('connect', function(){});
        socket.on('disconnect', function(){});
        this.setupConnection();
    }
    
    render() {
        return (
            <>
            </>
        )
    }
}