"use client";
import React from 'react';
import '../css/poster.css';
import dynamic from 'next/dynamic';

const DynamicImage = dynamic(() => import('next/image'), { ssr: false });

const Video = () => {
  return (
    <div className="poster-container" style={{minHeight:'0vh',backgroundColor:'white'}}>
      <DynamicImage loading='lazy' width={0} height={0} style={{width:"100%",height:"auto"}} alt='Poster Video' src='/videoplayback.gif' />
      <div className="poster-bottom-space"></div>
    </div>
  );
};

export default Video;
