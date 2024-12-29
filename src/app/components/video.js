"use client";
import React from 'react';
import '../css/poster.css';
import Image from 'next/image'

const Video = () => {
  return (
    <div className="poster-container" style={{minHeight:'0vh',backgroundColor:'white'}}>
      <Image loading='lazy' width={0} height={0} style={{width:"100%",height:"auto"}} alt='Poster Video' src='/videoplayback.gif' />
      
      <div className="poster-bottom-space"></div>
    </div>
  );
};

export default Video;
