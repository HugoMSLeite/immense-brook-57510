import React, {
  Component
} from 'react';
import RTCVideo from '../pages/RoomPage/RTCVideo.js';
import openSocket from 'socket.io-client';
import {
  DEFAULT_CONSTRAINTS,
  DEFAULT_ICE_SERVERS,
  TYPE_ROOM,
  TYPE_ANSWER
} from '../pages/RoomPage/functions/constants';
import {
  buildServers,
  generateRoomKey,
  createMessage,
  createPayload
} from '../pages/RoomPage/functions/utils';

class Sala extends Component {
  existingCalls = []
  listCandidates = [];
  constructor(props) {
    super(props);
    const {
      mediaConstraints,
      iceServers
    } = props;
    // build iceServers config for RTCPeerConnection
    const iceServerURLs = buildServers(iceServers);
    this.state = {
      iceServers: iceServerURLs || DEFAULT_ICE_SERVERS,
      mediaConstraints: mediaConstraints || DEFAULT_CONSTRAINTS,
      localMediaStream: null,
      remoteMediaStream: null,
      roomKey: null,
      socketID: null,
      connectionStarted: false,
      text: '',
      listCandidates: []
    };
    this.wantCamera = true;
    this.rtcPeerConnection = null;
    this.socket = null;
  }

  componentDidMount() {
    var wsPath = window.location.protocol + "//" + window.location.hostname;
    this.socket = openSocket(wsPath);
    this.socket.on('connect', function () {});
    this.socket.on('disconnect', function () {});
    this.socket.on("update-user-list", ({
      users
    }) => {
      this.updateUserList(users);
    });

    this.socket.on("remove-user", ({
      socketId
    }) => {
      this.handleRemoveUser(socketId);
    });

    this.socket.on("call-made", data => {
      this.handleOffer(data)
    });

    this.socket.on("answer-made", async data => {
      this.handleAnswer(data);
    });

    this.socket.on("call-rejected", data => {
      this.handleCallRejected();
    });

    this.socket.on("candidate-made", async data => {
      this.handleIceCandidate(data);
    });

    this.socket.on('token', async token => {
      this.rtcPeerConnection = new RTCPeerConnection({
        iceServers: token.iceServers
      });
      this.rtcPeerConnection.ontrack = ({
        streams: [stream]
      }) => {
        this.setState({
          remoteMediaStream: stream
        })
      };
    });

    this.socket.emit('token');
  }

  unselectUsersFromList() {
    const alreadySelectedUser = document.querySelectorAll(
      ".active-user.active-user--selected"
    );

    alreadySelectedUser.forEach(el => {
      el.setAttribute("class", "active-user");
    });
  }

  createUserItemContainer(socketId) {
    const userContainerEl = document.createElement("div");

    const usernameEl = document.createElement("p");

    userContainerEl.setAttribute("class", "active-user");
    userContainerEl.setAttribute("id", socketId);
    usernameEl.setAttribute("class", "username");
    usernameEl.innerHTML = `Socket: ${socketId}`;

    userContainerEl.appendChild(usernameEl);

    userContainerEl.addEventListener("click", () => {
      //unselectUsersFromList();
      userContainerEl.setAttribute("class", "active-user active-user--selected");
      const talkingWithInfo = document.getElementById("talking-with-info");
      talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
      this.callUser(socketId);
    });

    return userContainerEl;
  }

  handleRemoveUser(socketId) {
    const elToRemove = document.getElementById(socketId);

    if (elToRemove) {
      elToRemove.remove();
    }
  }

  callUser = async (socketId) => {
    this.rtcPeerConnection.onicecandidate = (e => {
      if (e && e.candidate) {
        this.state.listCandidates.push(e.candidate);
        this.setState(this.state);
      }
    });

    var stream = await this.openCamera(false);
    //stream.getTracks().forEach(track => this.rtcPeerConnection.addTrack(track, stream));
    this.rtcPeerConnection.createOffer().then(offer => {
      this.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(offer)).then(() => {
        this.socket.emit("call-user", {
          offer: JSON.stringify(this.rtcPeerConnection.localDescription),
          to: socketId
        });
      });
    });

  }

  updateUserList(socketIds) {
    const activeUserContainer = document.getElementById("active-user-container");

    socketIds.forEach(socketId => {
      const alreadyExistingUser = document.getElementById(socketId);
      if (!alreadyExistingUser) {
        const userContainerEl = this.createUserItemContainer(socketId);

        activeUserContainer.appendChild(userContainerEl);
      }
    });
  }

  openCamera = async (fromHandleOffer) => {
    const {
      mediaConstraints,
      localMediaStream
    } = this.state;
    try {
      if (!localMediaStream) {
        let mediaStream;
        if (this.wantCamera) mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        else mediaStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints);
        this.setState({
          localMediaStream: mediaStream
        });
        mediaStream.getTracks().forEach(track => this.rtcPeerConnection.addTrack(track, mediaStream));
        return mediaStream;
      }
    } catch (error) {
      console.error('getUserMedia Error: ', error)
    }
  }

  handleOffer = async (data) => {
    var confirmed = window.confirm(
      `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
    );

    if (!confirmed) {
      this.socket.emit("reject-call", {
        from: data.socket
      });

      return;
    }
    const {
      localMediaStream,
      roomKey
    } = this.state;

    await this.rtcPeerConnection.setRemoteDescription(
      new RTCSessionDescription(JSON.parse(data.offer))
    );
    let mediaStream = localMediaStream

    if (!mediaStream) mediaStream = await this.openCamera(true);
    this.setState({
      connectionStarted: true,
      localMediaStream: mediaStream
    }, async function () {
      const answer = await this.rtcPeerConnection.createAnswer();
      await this.rtcPeerConnection.setLocalDescription(answer);
      this.socket.emit("make-answer", {
        answer: JSON.stringify(this.rtcPeerConnection.localDescription),
        to: data.socket
      });
      this.rtcPeerConnection.onicecandidate = (e => {
        if (e && e.candidate)
          this.socket.emit("send-candidate", {
            candidate: JSON.stringify(e.candidate),
            to: data.socket
          });
        console.log(e.candidate);
      });
    });
  }

  handleAnswer = async (data) => {
    await this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.answer)));
    this.state.listCandidates.forEach(candidate => {
      this.socket.emit("send-candidate", {
        candidate: JSON.stringify(candidate),
        to: data.socket
      });
    });
  }

  handleIceCandidate = async (data) => {
    if (this.rtcPeerConnection.localDescription && data.candidate) {
      console.log(data);
      var rtcCandidate = new RTCIceCandidate(JSON.parse(data.candidate));
      this.rtcPeerConnection.addIceCandidate(rtcCandidate).catch(e => console.error(e));
    }
  }

  handleShareDisplay = async () => {
    this.wantCamera = !this.wantCamera
    if (this.state.connectionStarted) {
      const {
        mediaConstraints,
        localMediaStream
      } = this.state;
      let mediaStream;
      if (this.wantCamera) mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
      else mediaStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints)

      let screenStream = mediaStream.getVideoTracks()[0]
      const transceiver = this.rtcPeerConnection.getTransceivers()[0]
      localMediaStream.removeTrack(localMediaStream.getTracks()[0])
      localMediaStream.addTrack(screenStream)
      transceiver['sender'].replaceTrack(screenStream)
    }
  }

  sendRoomKey = () => {
    const {
      roomKey,
      socketID
    } = this.state;
    if (!roomKey) {
      const key = generateRoomKey();
      const roomData = createMessage(TYPE_ROOM, createPayload(key, socketID));
      this.setState({
        roomKey: key
      })
      this.socket.send(JSON.stringify(roomData));
      alert(key);
    }
  }

  handleSocketConnection = (socketID) => {
    this.setState({
      socketID
    });
  }

  handleChange = (event) => {
    this.setState({
      text: event.target.value
    });
  }

  render() {
    const {
      localMediaStream,
      remoteMediaStream,
      text,
      roomKey,
      socketID,
      iceServers,
      connectionStarted,
    } = this.state;
    return < >
      <
      div className = {
        "container"
      } >
      <
      header className = "header" >
      <
      div className = "logo-container" >
      <
      img src = "'./img/doge.png'"
    alt = "doge logo"
    className = "logo-img" / >
      <
      h1 className = "logo-text" >
      Doge < span className = "logo-highlight" > ller < /span> <
      /h1> <
      /div> <
      /header> <
      div className = "content-container" >
      <
      div className = "active-users-panel"
    id = "active-user-container" >
      <
      h3 className = "panel-title" > Active Users: < /h3> <
      /div> <
      div className = "video-chat-container" >
      <
      h2 className = "talk-info"
    id = "talking-with-info" >
      Select active user on the left menu. <
      /h2> <
      div className = "video-container" >
      <
      RTCVideo mediaStream = {
        localMediaStream
      }
    /> <
    RTCVideo mediaStream = {
      remoteMediaStream
    }
    /> {
      /* <video autoPlay className="remote-video" id="remote-video"></video> */ } {
      /* <video autoPlay muted className="local-video" id="local-video"></video> */ } <
    /div> <
    /div> <
    /div> <
    /div> <
    />
  }
}

export default Sala;