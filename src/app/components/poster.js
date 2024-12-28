
"use client";
import React, { useEffect, useState } from 'react';
import '../css/poster.css';
import Image from 'next/image'
const Poster = () => {
  const posters = [
    { 
      type: 'image', 
      src: '/poster/poster-gray.png', 
      title: 'NOUVE', 
      subtitle: 'COLLECTION', 
      volume: 'VOL-I',
      style: { 
        container: { backgroundColor: '#f0f0f0' }, // Example specific style for this poster
      }
    }
    // Uncomment and use these posters as needed:
    // { 
    //   type: 'image', 
    //   src: '/poster/poster3.jpg',
    //   style: { 
    //     container: { backgroundColor: '#fff' }, // Another style for this poster
    //   }
    // },
    // { 
    //   type: 'image', 
    //   src: '/poster/poster3.jpg',
    //   style: { 
    //     container: { backgroundColor: '#eee' }, // Another style for this poster
    //   }
    // },
    // { 
    //   type: 'video', 
    //   src: '/poster/poster4.mp4',
    //   style: { 
    //     container: { backgroundColor: '#000' }, // Video specific styling
    //   }
    // }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndex === posters.length - 1) {
        return; // Do nothing if it's the last poster (video)
      }
      setFade(false); // Trigger fade out
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % posters.length);
        setFade(true); // Trigger fade in after the next poster is set
      }, 500); // Match this duration with the CSS transition duration
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [currentIndex]);

  const handleVideoEnded = () => {
    setIsVideoCompleted(true); // Set video completed to true
    setCurrentIndex(0); // Reset to the first poster
  };

  useEffect(() => {
    if (isVideoCompleted) {
      setIsVideoCompleted(false); // Reset video completion state
    }
  }, [currentIndex]);

  const currentPoster = posters[currentIndex];

  return (<>
    <div 
      className="poster-container"
      style={currentPoster.style?.container} // Apply specific container styles
    >
      <div className="poster-content">
        <div 
          className={`poster-content-inner ${fade ? 'fade-in' : 'fade-out'}`}
        >
          {currentPoster.type === 'image' ? (
            <div className="poster-image-container">
              <img id='posterImg' src={currentPoster.src} alt="Poster" />
              {currentIndex === 0 && (
                <div className="poster-text-container">
                  <p 
                    className="poster-title" 
                    style={currentPoster.style?.title} // Apply specific title styles
                  >
                    {currentPoster.title}
                  </p><br />
                  <p 
                    className="poster-subtitle" 
                    style={currentPoster.style?.subtitle} // Apply specific subtitle styles
                  >
                    {currentPoster.subtitle}
                  </p><br />
                  <p 
                    className="poster-volume" 
                    style={{ marginTop: '-15%', ...currentPoster.style?.volume }} // Apply specific volume styles
                  >
                    {currentPoster.volume}
                  </p><br />
                </div>
              )}
            </div>
          ) : (
            <div className="poster-video-container" style={{ height: '100%', width: '100%' }}>
              <video 
                id='posterVideo' 
                width="100%" 
                controls 
                autoPlay 
                onEnded={handleVideoEnded} // Call handleVideoEnded when video ends
              >
                <source src={currentPoster.src} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      </div>
      <div className="poster-bottom-space"></div>
    </div>



    </>

  );
};

export default Poster;
