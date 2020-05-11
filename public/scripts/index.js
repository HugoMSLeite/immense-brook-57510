let isAlreadyCalling = false;
let getCalled = false;

const existingCalls = [];

const {
  RTCPeerConnection,
  RTCSessionDescription
} = window;

var peerConnection = new RTCPeerConnection();
peerConnection.iceServers = [];

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

  socket.on('token', async token => {
    peerConnection.iceServers.push(token.iceServers);

    const offer = await peerConnection.createOffer();
    
    peerConnection.onicecandidate = (e => {
      if (e && e.candidate)
        socket.emit("send-candidate", {
          candidate: JSON.stringify(e.candidate),
          to: socketId
        });
    });
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
    socket.emit("call-user", {
      offer,
      to: socketId
    });
    peerConnection.onsignalingstatechange = ev => console.log(ev);
  });
  socket.emit('token');
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

const socket = io.connect(window.location.origin);

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
  peerConnection.onsignalingstatechange = ev => console.log(ev);
  
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );
  const answer = await peerConnection.createAnswer();
  peerConnection.onicecandidate = (e => {
    if (e && e.candidate)
      socket.emit("send-candidate", {
        candidate: JSON.stringify(e.candidate),
        to: data.socket
      });
  });
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

  socket.emit("make-answer", {
    answer,
    to: data.socket
  });
  getCalled = true;
});

socket.on("answer-made", async data => {
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.answer)
  );
});

socket.on("call-rejected", data => {
  alert(`User: "Socket: ${data.socket}" rejected your call.`);
  unselectUsersFromList();
});

socket.on("candidate-made", async data => {
  console.log(data);
  if (typeof(peerConnection) != 'undefined' && data.candidate) {
    var rtcCandidate = new RTCIceCandidate(JSON.parse(data.candidate));
    peerConnection.addIceCandidate(rtcCandidate).catch(e => console.error(e));
  }
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
    window.localStream = stream;
    window.localStream.getTracks().forEach(track => peerConnection.addTrack(track, window.localStream));
  },
  error => {
    console.warn(error.message);
  }
);