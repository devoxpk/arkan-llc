import React from 'react';
import styles from './Poster.module.css';
import Link from 'next/link';
const Poster = ({ header, text, videoPath, showButton }) => {
  return (
    <div className={styles.poster} style={!showButton ? { left: '-16px' } : {}}>
      <video className={styles.video} autoPlay loop muted playsInline>
        <source src={videoPath} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className={styles.content}>
        <h1>
          <span style={{ color: 'white' }}>{header.split(' ').slice(0, 2).join(' ')}</span>
          <span style={{ color: 'black' }}> {header.split(' ').slice(2).join(' ')}</span>
        </h1>
        <p>{text}</p>
        {showButton && <Link href="/about"><button className={styles.button}>Our work</button></Link>}
      </div>
    </div>
  );
};

export default Poster; 