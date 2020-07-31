import React, { useState, useEffect, useRef } from 'react';
import openSocket from 'socket.io-client';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import RTCVideo from './RTCVideo.js';
import { DEFAULT_CONSTRAINTS } from './functions/constants'

const useStyles = makeStyles((theme) => ({
    myVideo: {
        width: '250px',
        position: 'fixed',
        bottom: 20,
        right: 10,
        backgroundColor: '#000'
    },
    mainGrid: {
        width: '100vw',
        height: 'calc(100vh - 64px)',
        spacing: 0,
        justify: 'space-around',
        backgroundColor: '#fff'
    }
}));

const wsPath = window.location.protocol + "//" + window.location.hostname + ':8080';

function RoomPage(props) {
    const webSocket = useRef(null);
    const [stream, setStream] = useState();
    const [, setUpdateState] = useState();
    const iceServices = useRef([]);
    const [room, setRoom] = useState();
    const rtcPeerConnections = useRef([]);
    const listCandidates = useRef([]);
    const userVideo = useRef();

    useEffect(() => {
        navigator.mediaDevices.getUserMedia(DEFAULT_CONSTRAINTS).then((_stream) => {
            setStream(_stream);
            if (userVideo.current)
                userVideo.current.srcObject = _stream;
            webSocket.current.emit('ice-services');
        })
        webSocket.current = openSocket(wsPath);
        webSocket.current.on('connect', function () { });
        webSocket.current.on('disconnect', function () { });

        webSocket.current.on("call-made", data => {
            handleOffer(data)
        });

        webSocket.current.on("answer-made", data => {
            handleAnswer(data);
        });

        webSocket.current.on("candidate-made", data => {
            handleIceCandidate(data);
        });

        webSocket.current.on('ice-services', function (data) {
            handleIceServices(data.iceServers);
        });

        webSocket.current.on('return-room', data => {
            handleReturnRoom(data)
        });

    }, [])

    let UserVideo;
    if (stream) {
        UserVideo = (
            <video
                style={{ width: '100%' }}
                autoPlay
                ref={userVideo}
            ></video>
        )
    }

    useEffect(() => {
        if (room)
            room.users.forEach(async (_user) => {
                if (_user !== webSocket.current.id) {
                    let peer = new RTCPeerConnection({
                        iceServers: iceServices.current
                    });
                    stream.getTracks().forEach(track => peer.addTrack(track, stream));
                    peer.onicecandidate = (e => {
                        if (e && e.candidate) {
                            listCandidates.current.push(e.candidate);
                        }
                    });
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(new RTCSessionDescription(offer));
                    peer.ontrack = (({ streams: [stream] }) => {
                        rtcPeerConnections.current[rtcPeerConnections.current.length - 1].stream = stream
                    })
                    webSocket.current.emit('call-user', { from: webSocket.current.id, to: _user, offer: JSON.stringify(offer) })
                    rtcPeerConnections.current.push({ user: _user, connection: peer });
                    setUpdateState((value) => !value);
                }
            })
    }, [room])

    var handleReturnRoom = (_room) => {
        if (_room) {
            setRoom(_room);
        }
    }

    function handleIceServices(data) {
        iceServices.current = data
        webSocket.current.emit('enter-room', props.match.params.id)
    }

    async function handleOffer(data) {
        let rtcPeer = {};
        rtcPeer.user = data.from;
        rtcPeer.connection = new RTCPeerConnection({
            iceServers: iceServices.current
        });
        rtcPeer.connection.ontrack = ({ streams: [stream] }) => {
            rtcPeer.stream = stream;
        };
        let stream = await navigator.mediaDevices.getUserMedia(DEFAULT_CONSTRAINTS);
        stream.getTracks().forEach(track => rtcPeer.connection.addTrack(track, stream));
        await rtcPeer.connection.setRemoteDescription(
            new RTCSessionDescription(JSON.parse(data.offer))
        );
        const answer = await rtcPeer.connection.createAnswer();
        await rtcPeer.connection.setLocalDescription(answer);
        webSocket.current.emit('make-answer', { from: webSocket.current.id, to: data.from, answer: JSON.stringify(answer) })
        rtcPeer.connection.onicecandidate = (e => {
            if (e && e.candidate)
                webSocket.current.emit('send-candidate', {
                    candidate: JSON.stringify(e.candidate),
                    from: webSocket.current.id,
                    to: data.from
                });
        });
        rtcPeerConnections.current.push(rtcPeer);
        setUpdateState((value) => !value);
    }

    async function handleAnswer(data) {
        rtcPeerConnections.current.forEach(async (rtc) => {
            if (rtc.user === data.from) {
                await rtc.connection.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.answer)));
                listCandidates.current.forEach(candidate => {
                    webSocket.current.emit('send-candidate', {
                        candidate: JSON.stringify(candidate),
                        from: webSocket.current.id,
                        to: data.from
                    });
                });
            }
        });
    }

    let PartnersVideos;

    if (rtcPeerConnections.current.length > 0) {
        PartnersVideos = rtcPeerConnections.current.map((item, key) => {
            return (<Grid key={key} item xs={4} style={{ backgroundColor: '#000' }}>
                <RTCVideo mediaStream={handleGetStream(key)} />
            </Grid>);
        })
    }

    function handleGetStream(index) {
        return rtcPeerConnections.current[index].stream;
    }

    function handleIceCandidate(data) {
        rtcPeerConnections.current.forEach(rtc => {
            if (rtc.user === data.from) {
                if (rtc.connection.localDescription && data.candidate) {
                    console.log(data);
                    var rtcCandidate = new RTCIceCandidate(JSON.parse(data.candidate));
                    rtc.connection.addIceCandidate(rtcCandidate).catch(e => console.error(e));
                    setUpdateState((value) => !value);
                }
            }
        });
    }

    const classes = useStyles();

    return (
        <>
            <Grid container className={classes.mainGrid}>
                {PartnersVideos}
            </Grid>
            <div className={classes.myVideo}>
                {UserVideo}
            </div>
        </>
    )
}

export { RoomPage }