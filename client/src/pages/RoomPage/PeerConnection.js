import React, { Component } from 'react';
import { createMessage, createPayload } from './functions/utils';
import { TYPE_OFFER, TYPE_ICECANDIDATE } from './functions/constants';

class PeerConnection extends Component {
  constructor(props) {
    super(props)
  }

  state = { iceServers: [] };

  rtcPeerConnection = new RTCPeerConnection({ iceServers: this.state.iceServers });

  addMediaStreamTrack = async () => {
    const { localMediaStream } = this.props
    console.log('addMediaStream: ', localMediaStream);
    if (localMediaStream) {
      await localMediaStream.getTracks().forEach((mediaStreamTrack) => {
        this.rtcPeerConnection.addTrack(mediaStreamTrack);
      });
    }
  }

  handleOnNegotiationNeeded = async (negotiationNeededEvent) => {
    const { sendMessage, roomInfo } = this.props;
    try {
      const offer = await this.rtcPeerConnection.createOffer();
      await this.rtcPeerConnection.setLocalDescription(offer);
      const payload = createPayload(roomInfo.roomKey, roomInfo.socketID, this.rtcPeerConnection.localDescription);
      const offerMessage = createMessage(TYPE_OFFER, payload);
      sendMessage(JSON.stringify(offerMessage));
    } catch(error) {
      console.error('handleNegotiationNeeded Error: ', error)
    }
  }

  handleOnIceEvent = () => {
    if (this.rtcPeerConnectionIceEvent.candidate) {
      const { sendMessage, roomInfo } = this.props;
      const { candidate } = rtcPeerConnectionIceEvent;
      const payload = createPayload(roomInfo.roomKey, roomInfo.socketID, JSON.stringify(candidate));
      const iceCandidateMessage = createMessage(TYPE_ICECANDIDATE, payload);
      sendMessage(JSON.stringify(iceCandidateMessage));
    }
  }

  handleOnTrack = (trackEvent) => {
    const remoteMediaStream = new MediaStream([ trackEvent.track ]);
    this.props.addRemoteStream(remoteMediaStream);
  }

  componentDidMount() {
    const { rtcPeerConnection } = this.props;
    rtcPeerConnection.onnegotiationneeded = this.handleOnNegotiationNeeded;
    rtcPeerConnection.onicecandidate = this.handleOnIceEvent;
    rtcPeerConnection.ontrack = this.handleOnTrack;
  }

  componentDidUpdate(prevProps) {
    if (this.props.startConnection !== prevProps.startConnection) {
      this.addMediaStreamTrack();
    }
  }

  render() {
    return(
      <>
      </>
    );
  }
}
export default PeerConnection;