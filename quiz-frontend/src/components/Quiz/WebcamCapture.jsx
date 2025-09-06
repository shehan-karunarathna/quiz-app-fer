import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FiRotateCw, FiEye, FiEyeOff } from 'react-icons/fi';

const WebcamCapture = forwardRef((props, ref) => {
  const webcamRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isWebcamVisible, setIsWebcamVisible] = useState(true);
  
  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: isFlipped ? "environment" : "user"
  };

  // Expose getScreenshot to parent via ref
  useImperativeHandle(ref, () => ({
    getScreenshot: () => {
      if (!isWebcamVisible || !webcamRef.current) {
        console.warn("Webcam is disabled or not ready");
        return null;
      }
      return webcamRef.current.getScreenshot();
    },
    isWebcamActive: () => isWebcamVisible
  }));

  const toggleCamera = () => {
    setIsFlipped(!isFlipped);
  };

  const toggleWebcamVisibility = () => {
    setIsWebcamVisible(!isWebcamVisible);
  };

  return (
    <div className={`webcam-wrapper ${!isWebcamVisible ? 'hidden' : ''}`}>
      <div className="webcam-header">
        <div className="webcam-toggle-container">
          <h4>Face Camera</h4>
          <button 
            onClick={toggleWebcamVisibility} 
            className="toggle-visibility-btn"
            aria-label={isWebcamVisible ? "Hide and disable camera" : "Show and enable camera"}
          >
            {isWebcamVisible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            <span className="toggle-label">
              {isWebcamVisible ? 'Disable' : 'Enable'}
            </span>
          </button>
        </div>
        {isWebcamVisible && (
          <button onClick={toggleCamera} className="flip-btn">
            <FiRotateCw size={18} />
          </button>
        )}
      </div>
      
      {isWebcamVisible ? (
        <>
          <div className="webcam-container">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              mirrored={!isFlipped}
              style={{
                borderRadius: '12px',
                width: '50%',
                height: '50%',
                objectFit: 'cover'
              }}
              forceScreenshotSourceSize={true}
            />
          </div>
          <p className="webcam-instruction">
            Position your face within the frame
          </p>
        </>
      ) : (
        <div className="webcam-disabled-message">
          Camera is currently disabled. Click "Enable" to turn it on.
        </div>
      )}
    </div>
  );
});

export default WebcamCapture;