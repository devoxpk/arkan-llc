"use client";
import React from 'react';
import '../css/poster.css';

const Video = () => {
  return (
    <div className="poster-container" style={{minHeight:'0vh',backgroundColor:'white'}}>
      <img loading='lazy' style={{width:"100%"}} alt='Poster Video' src='/videoplayback.gif' />
      
      <div className="poster-bottom-space"></div>
    </div>
  );
};

export default Video;
