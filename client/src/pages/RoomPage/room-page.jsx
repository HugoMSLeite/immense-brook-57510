import React, { useState, useEffect } from 'react';
import { api, Websocket } from '../../api';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import { Height } from '@material-ui/icons';
import { Backdrop } from '@material-ui/core';
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

let socket;

function RoomPage(props) {
    let [localMediaStream, setLocalMediaStream] = useState(null);
    const [iceServices, setIceServices] = useState([]);
    let [room, setRoom] = useState(null);
    const [rtcPeerConnections, setRtcPeerConnections] = useState([]);
    const [listCandidates, setListCandidates] = useState([]);

    const ws = Websocket({
        handleGetRoom: handleGetRoom,
        handleUpdateRoomList: () => { },
        handleIceServices: handleIceServices,
        handleOffer: handleOffer,
        handleAnswer: handleAnswer,
        handleIceCandidate: handleIceCandidate
    }, socket)

    useEffect(() => {
        console.log(props.match.params.id)
        ws.getRoom(props.match.params.id)
        navigator.mediaDevices.getUserMedia(DEFAULT_CONSTRAINTS).then((stream) => {
            localMediaStream = stream
            setLocalMediaStream(stream)
        })
    }, [])

    function handleGetRoom(_room) {
        room = _room;
        setRoom(_room);
        ws.enterRoom(_room)
        ws.getIceServices()
    }

    function handleIceServices(data) {
        setIceServices(data);
        room.users.map(_user => {
            let peer = new RTCPeerConnection({
                iceServers: data
            });
            localMediaStream.getTracks().forEach(track => peer.addTrack(track, localMediaStream));
            peer.onicecandidate = (e => {
                if (e && e.candidate) {
                    listCandidates.push(e.candidate);
                    setListCandidates(listCandidates);
                }
            });
            peer.createOffer().then(offer => {
                peer.setLocalDescription(new RTCSessionDescription(offer)).then(() => {
                    ws.sendOffer({ from: ws.id(), to: _user, offer: JSON.stringify(offer) })
                    rtcPeerConnections.push({ user: _user, connection: peer });
                    setRtcPeerConnections(rtcPeerConnections)
                });
            });
        })
    }

    async function handleOffer(data) {
        let rtcPeer = {};
        rtcPeer.user = data.from;
        rtcPeer.connection = new RTCPeerConnection({
            iceServers: iceServices
        });
        rtcPeer.connection.ontrack(({ streams: [stream] }) => {
            rtcPeer.stream = stream;
        });
        await rtcPeer.connection.setRemoteDescription(
            new RTCSessionDescription(JSON.parse(data.offer))
        );
        const answer = await rtcPeer.connection.createAnswer();
        ws.sendAnswer({ from: ws.id(), to: data.from, answer: JSON.stringify(answer) })
        rtcPeer.connection.onicecandidate = (e => {
            if (e && e.candidate)
                ws.sendCandidate({
                    candidate: JSON.stringify(e.candidate),
                    to: data.from
                });
            console.log(e.candidate);
        });
        rtcPeerConnections.push(rtcPeer);
        setRtcPeerConnections(rtcPeerConnections)
    }

    async function handleAnswer(data) {
        rtcPeerConnections.map(async (rtc) => {
            if (rtc.user === data.from) {
                await rtc.connection.setRemoteDescription(new RTCSessionDescription(JSON.parse(data.answer)));
                listCandidates.forEach(candidate => {
                    ws.sendCandidate({
                        candidate: JSON.stringify(candidate),
                        from: ws.id(),
                        to: data.from
                    });
                });
            }
        });
    }

    function renderVideos() {
        return rtcPeerConnections.map((item, key) => {
            if (item.connection) {
                item.connection.ontrack = (({ streams: [stream] }) => {
                    rtcPeerConnections[key].stream = stream
                })
                return (<Grid key={key} item xs={4} style={{ backgroundColor: '#000' }}>
                    <RTCVideo mediaStream={rtcPeerConnections[key].stream} />
                </Grid>);
            }
        })
    }

    function handleIceCandidate(data) {
        rtcPeerConnections.map(rtc => {
            if (rtc.user === data.from) {
                if (rtc.localDescription && data.candidate) {
                    console.log(data);
                    var rtcCandidate = new RTCIceCandidate(JSON.parse(data.candidate));
                    this.rtcPeerConnection.addIceCandidate(rtcCandidate).catch(e => console.error(e));
                }
            }
        });
    }

    const classes = useStyles();

    return (
        <>
            <Grid container className={classes.mainGrid}>
                {renderVideos()}
            </Grid>
            <div className={classes.myVideo}>
                <RTCVideo mediaStream={localMediaStream} />
            </div>
        </>
    )
}

export { RoomPage }