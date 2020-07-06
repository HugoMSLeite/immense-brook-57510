import React, { PureComponent } from 'react';

class RTCVideo extends PureComponent {
  constructor(props) {
    super(props)
  }

  addMediaStream = (video) => {
    const { mediaStream } = this.props;
    // Prevents throwing error upon a setState change when mediaStream is null
    // upon initial render
    if (mediaStream) video.srcObject = mediaStream;
  }

  render() {
    const { mediaStream } = this.props;
    console.log('mediaStream: ', mediaStream);

    return (
      <video
        style={{ width: '100%' }}
        autoPlay
        ref={mediaStream ? this.addMediaStream : null}
      >
        <track default kind="captions" />
      </video>
    );
  }
};

export default RTCVideo;