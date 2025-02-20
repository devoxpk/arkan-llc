import styles from './InfoBar.module.css';
import Link from 'next/link';
const InfoBar = () => {
  return (
    <div className={styles.infoBar}>
      <h2 className={styles.header}>We believe.</h2>
      <p className={styles.text}>
        We believe in listening and providing. Any demand you have, contact us and consider it done in the blink of an eye!
      </p>
      <div className={styles.buttons}>
        <Link href="/about">
          <button className={styles.aboutButton}>About us</button>
        </Link>
        <Link href="/contact">
          <button className={styles.contactButton}>Contact us</button>
        </Link>
      </div>
    </div>
  );
};

export default InfoBar; 