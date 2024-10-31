"use client";
import { useEffect, useState } from "react";
import { db } from '../firebase'; // Import Firestore instance
import { doc, getDoc } from 'firebase/firestore';

import Link from "next/link";

function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const collectionsToFetch = JSON.parse(localStorage.getItem("collectionsToFetch")) || [];
      const fetchedCategories = [];

      for (const collection of collectionsToFetch) {
        try {
          const docRef = doc(db, `${collection}/headers`);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const header = docSnap.data().header[1];
            fetchedCategories.push({
              id: collection,
              name: header,
            });
          }
        } catch (error) {
          console.error(`Error fetching category for collection ${collection}:`, error);
        }
      }

      setCategories(fetchedCategories);
    };

    fetchCategories();
  }, []);

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
            <form action="" className="card-form">
              <div className="input-wrapper">
                <ion-icon name="mail-outline"></ion-icon>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                  className="input-field"
                />
              </div>
              <button type="submit" className="btn btn-primary w-100">
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
              <a href="#" className="logo">
                <img style={{ marginTop: '-25%' }} src="/logo/dwlogo.png" alt="Nouve logo" />
              </a>
              <p className="footer-text">
                Nouve is a fashion theme for presenting a complete wardrobe of uniquely crafted Ethnic Wear, Casuals,
                Edgy Denims, & Accessories inspired by the most contemporary styles.
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
  <Link href="/about">
    <a className="footer-link">About Brand</a>
  </Link>
</li>

              <li><a href="#" className="footer-link">Payment Type</a></li>
              <li><a href="#" className="footer-link">Refund Policy</a></li>
            </ul>

            {/* Dynamic Categories List */}
            <ul className="footer-list">
              <li><p className="footer-list-title">Category</p></li>
              {categories.map((category) => (
                <li key={category.id}>
                 <Link href={`/categories?cat=${category.id}`} legacyBehavior>
  <a className="footer-link">{category.name}</a>
</Link>


                </li>
              ))}
            </ul>

            <ul className="footer-list">
              <li><p className="footer-list-title">Help & Support</p></li>
              <li><a href="#" className="footer-link">Dealers & Agents</a></li>
              <li><a href="#" className="footer-link">FAQ Information</a></li>
              <li><a href="#" className="footer-link">Return Policy</a></li>
              <li><a href="#" className="footer-link">Shipping & Delivery</a></li>
              <li><a href="#" className="footer-link">Order Tracking</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">
            <p className="copyright">
              &copy; 2024 <a href="#">Nouve</a>. All Rights Reserved.
            </p>
            <ul className="footer-bottom-list">
              <li><a href="#" className="footer-bottom-link">Privacy Policy</a></li>
              <li><a href="#" className="footer-bottom-link">Terms & Conditions</a></li>
              <li><a href="#" className="footer-bottom-link">Sitemap</a></li>
            </ul>
            <div className="payment">
              <p className="payment-title">We Support</p>
              <img src="/payment-img.png" alt="Online payment logos" className="payment-img" />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
