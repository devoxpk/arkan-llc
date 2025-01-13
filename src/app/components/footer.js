"use client";
import { useEffect, useState } from "react";
import { db } from '../firebase'; // Import Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import saveContact from '../utilis/saveContact';
import Link from "next/link";
import Image from 'next/image'

function Footer() {
  const [categories, setCategories] = useState([]);
  const [email, setEmail] = useState('');

  useEffect(() => {
   
    const fetchCategories = async () => {
      let collectionsToFetch = [];
      if (typeof window !== "undefined"){
  collectionsToFetch = JSON.parse(localStorage.getItem("collectionsToFetch")) || [];
}

      const fetchedCategories = [];
    
      // If collectionsToFetch is empty, check for numeric collections directly
      if (collectionsToFetch.length === 0) {
        console.log("Fetching numeric collections from the database...");
        let i = 1;
        while (true) {
          try {
            // Check if the 'headers' document exists in the current collection
            const docRef = doc(db, `${i}/headers`);
            const docSnap = await getDoc(docRef);
    
            if (docSnap.exists()) {
              console.log(`Collection ${i} exists.`);
              collectionsToFetch.push(i.toString()); // Add the collection ID to the array
            } else {
              console.log(`Collection ${i} does not exist. Stopping search.`);
              break; // Stop the loop when a collection doesn't exist
            }
          } catch (error) {
            console.error(`Error checking collection ${i}:`, error);
            break; // Stop the loop if an error occurs
          }
          i++; // Increment to check the next collection
        }
        console.log("Found collections:", collectionsToFetch);
      } else {
        console.log("Using collections from localStorage:", collectionsToFetch);
      }
    
      // Fetch headers for the collections
      for (const collection of collectionsToFetch) {
        try {
          const docRef = doc(db, `${collection}/headers`);
          const docSnap = await getDoc(docRef);
    
          if (docSnap.exists()) {
            const header = docSnap.data().header[1]; // Assuming header is an array and [1] is the desired value
            fetchedCategories.push({
              id: collection,
              name: header,
            });
          } else {
            console.log(`No header document found for collection ${collection}`);
          }
        } catch (error) {
          console.error(`Error fetching category for collection ${collection}:`, error);
        }
      }
    
      console.log("Fetched categories:", fetchedCategories);
      setCategories(fetchedCategories); // Assuming setCategories updates the state
    
    

      setCategories(fetchedCategories);
    };

    fetchCategories();
  }, []);

  const handleSubscribe = () => {
    if (email) {
      saveContact(email);
      setEmail(''); // Clear the input field after subscribing
    }
  };

  return (
    <>
      {/* Newsletter Section */}
      <section className="section newsletter">
        <div className="container">
          <div
            className="newsletter-card"
            style={{ backgroundImage: "url('./assets/images/newsletter-bg.png')" }}
          >
            <h2 className="card-title">Subscribe Newsletter</h2>
            <p className="card-text">
              Enter your email below to be the first to know about new collections and product launches.
            </p>
            <form action="" className="card-form" onSubmit={(e) => e.preventDefault()}>
              <div className="input-wrapper">
                <ion-icon name="mail-outline"></ion-icon>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-primary w-100" onClick={handleSubscribe}>
                <span>Subscribe</span>
                <ion-icon name="arrow-forward" aria-hidden="true"></ion-icon>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-top">
          <div className="container">
            <div className="footer-brand">
            <Link href="/" legacyBehavior>
  <a className="logo">
    <Image
    width={100} height={0} 
      style={{ marginTop: '-25%',height:"auto" ,width:"100%" }} 
      src="/logo/dwlogo.png" 
      alt="DEVOX logo" 
    />
  </a>
</Link>

              <p className="footer-text">
              DEVOX is an anime embroidery brand specializing in embossed stitched designs crafted in Pakistan with fine quality. Our collection features a unique blend of traditional and contemporary styles, offering a wide range of products including Ethnic Wear, Casuals, Edgy Denims, and Accessories. Each piece is meticulously crafted to ensure superior quality and durability, making DEVOX the perfect choice for those who appreciate detailed artistry and exceptional craftsmanship.
              </p>

              <ul className="social-list">
                <li><a href="#" className="social-link"><ion-icon name="logo-facebook"></ion-icon></a></li>
                <li><a href="#" className="social-link"><ion-icon name="logo-twitter"></ion-icon></a></li>
                <li><a href="#" className="social-link"><ion-icon name="logo-instagram"></ion-icon></a></li>
                <li><a href="#" className="social-link"><ion-icon name="logo-pinterest"></ion-icon></a></li>
              </ul>
            </div>

            <ul className="footer-list">
              <li><p className="footer-list-title">Information</p></li>
              <li>
                <Link href="/about" legacyBehavior>
                  <a className="footer-link">About Brand</a>
                </Link>
              </li>
              {/* <li><a href="#" className="footer-link">Payment Type</a></li> */}
              <li><Link href='/tracking' legacyBehavior><a className="footer-link">Order Tracking</a></Link></li>
            </ul>

            {/* Dynamic Categories List */}
            <ul className="footer-list">
              <li><p className="footer-list-title">Category</p></li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/categories/${category.id}`} legacyBehavior>
                    <a className="footer-link">{category.name}</a>
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="footer-list">
              <li><p className="footer-list-title">Help & Support</p></li>
              
              <li><Link href='/FAQ' legacyBehavior><a  className="footer-link">FAQ Information</a></Link></li>
              <li><Link href='Return' legacyBehavior><a  className="footer-link">Return Policy</a></Link></li>
              <li><Link href='/shipping' legacyBehavior><a  className="footer-link">Shipping & Delivery</a></Link></li>
             
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">
            <p className="copyright">
              &copy; 2024 <Link href='/' legacyBehavior><a href="/">TSOA</a></Link>. All Rights Reserved.
            </p>
            <ul className="footer-bottom-list">
              <li><Link href='/privacypolicy' legacyBehavior><a className="footer-bottom-link">Privacy Policy</a></Link></li>
              <li><Link href='/terms' legacyBehavior><a  className="footer-bottom-link">Terms & Conditions</a></Link></li>
              <li><Link href='/blog' legacyBehavior><a className="footer-bottom-link">Blog</a></Link></li>
            </ul>
            {/* <div className="payment">
              <p className="payment-title">We Support</p>
              <img src="/payment-img.png" alt="Online payment logos" className="payment-img" />
            </div> */}
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
