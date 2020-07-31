import React, { useEffect, useRef } from 'react';

function RTCVideo(props) {
  const videoRef = useRef()

  useEffect(() => {
    console.log(videoRef, props.mediaStream)
    if (videoRef && props.mediaStream) {
      videoRef.current.srcObject = props.mediaStream;
    }
  }, [videoRef, props.mediaStream])

  return (
    <video
      style={{ width: '100%' }}
      autoPlay
      ref={videoRef}
    >
    </video>
  );
};


export default RTCVideo;