import React, { useEffect, useState } from 'react';

const PromoTextRotator = () => {
  const texts = [
    'FREE DELIVERY NATIONWIDE',
    'LIMITED TIME SALE - UP TO 50% OFF',
    'TRENDING NOW: NEW WINTER COLLECTION',
    'BUY ONE, GET ONE FREE ON SELECT ITEMS',
    'EXCLUSIVE ONLINE OFFERS AVAILABLE',
    'FAST SHIPPING GUARANTEED',
    'QUALITY YOU CAN TRUST',
    'COMFORTABLE AND STYLISH CLOTHING',
    'NEW ARRIVALS ADDED DAILY',
    'EASY RETURNS AND EXCHANGES',
    'STAY WARM WITH OUR WINTER DEALS',
    'FASHION THAT FITS YOUR LIFESTYLE',
    'SHOP THE LOOK YOU LOVE',
    'SAVE BIG ON YOUR FAVORITE STYLES',
    'TRENDY OUTFITS FOR EVERY OCCASION',
    'LUXURY MADE AFFORDABLE',
    'REFRESH YOUR WARDROBE TODAY',
    'UNBEATABLE PRICES ON MUST-HAVE ITEMS',
    'DRESS TO IMPRESS WITH OUR COLLECTION',
    'GET READY FOR THE SEASON IN STYLE',
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // Trigger fade-out
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
        setFade(true); // Trigger fade-in
      }, 1000); // Duration of fade-out before changing text
    }, 5000); // 5 seconds interval

    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <span
      style={{
        color: '#a5a5a5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fade ? 1 : 0,
        transition: 'opacity 1s ease',
      }}
      id="freetext"
    >
      {texts[currentIndex]}
    </span>
  );
};

export default PromoTextRotator;
