let isAlreadyCalling = false;
let getCalled = false;

const existingCalls = [], listCandidates = [];

var peerConnection;

function unselectUsersFromList() {
  const alreadySelectedUser = document.querySelectorAll(
    ".active-user.active-user--selected"
  );

  alreadySelectedUser.forEach(el => {
    el.setAttribute("class", "active-user");
  });
}

function createUserItemContainer(socketId) {
  const userContainerEl = document.createElement("div");

  const usernameEl = document.createElement("p");

  userContainerEl.setAttribute("class", "active-user");
  userContainerEl.setAttribute("id", socketId);
  usernameEl.setAttribute("class", "username");
  usernameEl.innerHTML = `Socket: ${socketId}`;

  userContainerEl.appendChild(usernameEl);

  userContainerEl.addEventListener("click", () => {
    unselectUsersFromList();
    userContainerEl.setAttribute("class", "active-user active-user--selected");
    const talkingWithInfo = document.getElementById("talking-with-info");
    talkingWithInfo.innerHTML = `Talking with: "Socket: ${socketId}"`;
    callUser(socketId);
  });

  return userContainerEl;
}

async function callUser(socketId) {
  peerConnection.onicecandidate = (e => {
    if (e && e.candidate)
      listCandidates.push(e.candidate);
  });
  peerConnection.createOffer().then(offer => {
    peerConnection.setLocalDescription(new RTCSessionDescription(offer)).then(() => {
      socket.emit("call-user", {
        offer: JSON.stringify(peerConnection.localDescription),
        to: socketId
      });
    });
  });
  
}

function updateUserList(socketIds) {
  const activeUserContainer = document.getElementById("active-user-container");

  socketIds.forEach(socketId => {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser) {
      const userContainerEl = createUserItemContainer(socketId);

      activeUserContainer.appendChild(userContainerEl);
    }
  });
}

var ioPath = window.location.protocol + "//" + window.location.hostname + ":8080" 
const socket = io.connect(ioPath);

socket.on("update-user-list", ({
  users
}) => {
  updateUserList(users);
});

socket.on("remove-user", ({
  socketId
}) => {
  const elToRemove = document.getElementById(socketId);

  if (elToRemove) {
    elToRemove.remove();
  }
});

socket.on("call-made", async data => {
  if (!getCalled) {
    const confirmed = confirm(
      `User "Socket: ${data.socket}" wants to call you. Do accept this call?`
    );

    if (!confirmed) {
      socket.emit("reject-call", {
        from: data.socket
      });

      return;
    }
  }
  
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(JSON.parse(data.offer))
  );
  peerConnection.createAnswer().then(answer => {
    peerConnection.setLocalDescription(new RTCSessionDescription(answer)).then(() => {
      socket.emit("make-answer", {
        answer: JSON.stringify(peerConnection.localDescription),
        to: data.socket
      });
    });
  });
  peerConnection.onicecandidate = (e => {
    if (e && e.candidate)
      socket.emit("send-candidate", {
        candidate: JSON.stringify(e.candidate),
        to: data.socket
      });
      console.log(e.candidate);
  });
  
  getCalled = true;
});

socket.on("answer-made", async data => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(JSON.parse( data.answer))
  );
  listCandidates.forEach(candidate => {
    socket.emit("send-candidate", {
      candidate: JSON.stringify(candidate),
      to: data.socket
    });
    console.log(candidate);
  });
});

socket.on("call-rejected", data => {
  alert(`User: "Socket: ${data.socket}" rejected your call.`);
  unselectUsersFromList();
});

socket.on("candidate-made", async data => {
  if (peerConnection.localDescription && data.candidate) {
    console.log(data);
    var rtcCandidate = new RTCIceCandidate(JSON.parse(data.candidate));
    peerConnection.addIceCandidate(rtcCandidate).catch(e => console.error(e));
  }
});

socket.on('token', async token => {
  peerConnection = new RTCPeerConnection({
    iceServers: token.iceServers
  });

  peerConnection.ontrack = function({ streams: [stream] }) {
    const remoteVideo = document.getElementById("remote-video");
    if (remoteVideo) {
      remoteVideo.srcObject = stream;
    }
  };
  
  navigator.getUserMedia({
      video: true,
      audio: true
    },
    stream => {
      const localVideo = document.getElementById("local-video");
      if (localVideo) {
        localVideo.srcObject = stream;
      }
      
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    },
    error => {
      console.warn(error.message);
    }
  );
  peerConnection.onsignalingstatechange = ev => console.log(ev);
});
socket.emit('token');