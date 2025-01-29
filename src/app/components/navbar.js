"use client";

import React, { useState, useEffect, useRef } from 'react';
import '../css/navbar.css';
import Sizes from "./sizes";
import Cart from './cart';
import Chatbot from './chatbot.jsx';
import Link from 'next/link'

import Image from 'next/image'
import Announcement from './announcement'
import { useAuth, useSignOut } from '../context/AuthContext';
import { db, storage } from '../firebase'; // Import Firestore and Storage instances
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs,serverTimestamp } from 'firebase/firestore'; // Firestore methods
import SearchBar, { toggleSearchBar } from './searchBar'
import UserSession from './UserSession';
import EditModeButton from './editmode';
import serverWorker from '../utilis/serverworker'; // Ensure serverWorker is imported

  


function Navbar() {
  const [isNavActive, setNavActive] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  
 
  const headerRef = useRef(null);
  const overlayRef = useRef(null);



  const [categories, setCategories] = useState([]);
  const [expandedCollections, setExpandedCollections] = useState(false);


  
  useEffect(() => {
    const fetchCategories = async () => {
      let collectionsToFetch = [];

      // Retrieve collections from localStorage if available
      if(typeof window !== "undefined"){
      collectionsToFetch = JSON.parse(localStorage.getItem("collectionsToFetch")) || [];
      }
      const fetchedCategories = [];

      // If collectionsToFetch is empty, find numeric collections from the database
      if (collectionsToFetch.length === 0) {
        console.log("Fetching numeric collections from the database...");
        let i = 1;
        while (true) {
          try {
            const docRef = doc(db, `${i}/headers`);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              console.log(`Collection ${i} exists.`);
              collectionsToFetch.push(i.toString());
            } else {
              console.log(`Collection ${i} does not exist. Stopping search.`);
              break;
            }
          } catch (error) {
            console.error(`Error checking collection ${i}:`, error);
            break;
          }
          i++;
        }

        // Save the collections to localStorage for future use
        if(typeof window !== "undefined"){
        localStorage.setItem("collectionsToFetch", JSON.stringify(collectionsToFetch));}
      } else {
        console.log("Using collections from localStorage:", collectionsToFetch);
      }

      // Fetch headers for the collections
      for (const collection of collectionsToFetch) {
        try {
          const docRef = doc(db, `${collection}/headers`);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const header = docSnap.data().header[1]; // Adjust as per your data structure
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
      setCategories(fetchedCategories);
    };

    fetchCategories();
  }, []);

  // Toggle visibility of categories for a specific collection
  const toggleCollection = (collectionID) => {
    setExpandedCollections((prev) => ({
      ...prev,
      [collectionID]: !prev[collectionID],
    }));
  };

  useEffect(() => {
    let handleScroll;
    if(typeof window !== "undefined"){
       handleScroll = () => {
        if (headerRef.current) {
          if (window.scrollY >= 200) {
            headerRef.current.classList.add('active');
          } else {
            headerRef.current.classList.remove('active');
          }
        }
      };

      window.addEventListener("scroll", handleScroll);
    }

      // Cleanup event listener on component unmount
      return () => {
        if(typeof window !== "undefined"){
        window.removeEventListener("scroll", handleScroll);
        }
      };
    
  }, []);
  
  const toggleNavbar = () => {
    setNavActive((prev) => !prev);
  };

  const runServerWorker = async () => {
    console.log("navbar: Attempting to run serverWorker.");
    if (typeof window !== "undefined" && !sessionStorage.getItem('serverWorkerRun')) {
      try {
        console.log("navbar: serverWorker will run after 5-second delay.");
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay
        await serverWorker();
        sessionStorage.setItem('serverWorkerRun', 'true');
        console.log("navbar: serverWorker executed and sessionStorage updated.");
      } catch (error) {
        console.error("navbar: Error running serverWorker:", error);
      }
    } else {
      console.log("navbar: serverWorker has already been run or window is undefined.");
    }
  };

  if (typeof window !== "undefined") {
   runServerWorker();
    console.log("navbar: Added load event listener for serverWorker.");
  }

  return (
    <>
    <SearchBar/>
<EditModeButton/>
<Cart/>
    
      <div
        className="free"
        style={{
          backgroundColor: 'black',
          fontSize: 'smaller',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Announcement/>
      </div>

      

      <header className="header" data-header ref={headerRef}>
        <div className="container">
          <div className={`overlay ${isNavActive ? 'active' : ''}`} data-overlay ref={overlayRef}></div>

            
              <Link href="/" legacyBehavior>
                <a className="logo">
                  <Image id="logoimg" src="/logo/dwlogo.png" alt="LOW PRICE IN PAKISTAN" width="55" height="0" style={{height:"auto", filter: "invert(1)"}} />
                </a>
              </Link>
          <span id='brandNameSpan'>
            <Link href="/" >
            <h1 id="brandName" style={{ color: 'black', position: 'relative' }}>D E V O X</h1>
          </Link>
          </span>

          <div className="header-actions">
          

<UserSession/>



            <button
              onClick={() => {
               toggleSearchBar();
              }}
              className="header-action-btn"
            >
              <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
              <p className="header-action-label">Search</p>
            </button>

            <button id='cart-icon' className="header-action-btn" onClick={() => document.querySelector('.cart-card').style.display = 'block'}>
             <ion-icon name='cart-outline'></ion-icon>
              <p className="header-action-label" >Cart</p>
              <div className="btn-badge green" aria-hidden="true">0</div>
            </button> 


            <button
  className="header-action-btn  chatBtnHeader"
  onClick={() => setIsChatVisible((prev) => !prev)}
>
  <div className="chatBtn" >
    <svg height="1.6em" fill="black" xmlSpace="preserve" viewBox="0 0 1000 1000" y="0px" x="0px" version="1.1">
      <path d="M881.1,720.5H434.7L173.3,941V720.5h-54.4C58.8,720.5,10,671.1,10,610.2v-441C10,108.4,58.8,59,118.9,59h762.2C941.2,59,990,108.4,990,169.3v441C990,671.1,941.2,720.5,881.1,720.5L881.1,720.5z M935.6,169.3c0-30.4-24.4-55.2-54.5-55.2H118.9c-30.1,0-54.5,24.7-54.5,55.2v441c0,30.4,24.4,55.1,54.5,55.1h54.4h54.4v110.3l163.3-110.2H500h381.1c30.1,0,54.5-24.7,54.5-55.1V169.3L935.6,169.3z M717.8,444.8c-30.1,0-54.4-24.7-54.4-55.1c0-30.4,24.3-55.2,54.4-55.2c30.1,0,54.5,24.7,54.5,55.2C772.2,420.2,747.8,444.8,717.8,444.8L717.8,444.8z M500,444.8c-30.1,0-54.4-24.7-54.4-55.1c0-30.4,24.3-55.2,54.4-55.2c30.1,0,54.4,24.7,54.4,55.2C554.4,420.2,530.1,444.8,500,444.8L500,444.8z M282.2,444.8c-30.1,0-54.5-24.7-54.5-55.1c0-30.4,24.4-55.2,54.5-55.2c30.1,0,54.4,24.7,54.4,55.2C336.7,420.2,312.3,444.8,282.2,444.8L282.2,444.8z" />
    </svg>
    <span className="tooltip">Chat</span>
  </div>
  <p className="header-action-label">Chat</p>
  <div className="btn-badge" aria-hidden="true">2</div>
</button>

{isChatVisible ? <Chatbot /> : null}




          </div>

          <button className="nav-open-btn" onClick={toggleNavbar} aria-label="Open Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={`navbar ${isNavActive ? 'active' : ''}`} data-navbar>
            <div className="navbar-top">
                  
                  <Link href="/" legacyBehavior>
                    <a className="logo">
                      <Image src="/logo/dwlogo.png" alt="DEVOX Shirts in Pakistan" width="55" height="0" style={{height:"auto"}} />
                    </a>
                  </Link>
              <button className="nav-close-btn" onClick={toggleNavbar} aria-label="Close Menu">
                <ion-icon name="close-outline" aria-hidden="true"></ion-icon>
              </button>
            </div>

            <ul className="navbar-list">
              <li><Link href='/' legacyBehavior><a className="navbar-link" data-nav-link>Home</a></Link></li>
              <li><Link href='/skinrecommender' legacyBehavior><a className="navbar-link" data-nav-link >Skin Recommendention</a></Link></li>
              <li><Link href='/vton' legacyBehavior><a className="navbar-link" data-nav-link >Virtually Try On Clothes</a></Link></li>

              <li><Link href="/shop" legacyBehavior><a className="navbar-link" data-nav-link>Shop</a></Link></li>
              <li><Link href='/contact' legacyBehavior><a className="navbar-link" data-nav-link>Contact Us</a></Link></li>
              <li>
      <button
        id="navCategories"
        onClick={() => setExpandedCollections((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          background: "none",
          border: "none",
          color: "black",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        <span>Categories</span>
        <span
          style={{
            marginLeft: "8px",
            transform: expandedCollections ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </button>
      {expandedCollections && (
        <ul style={{ borderRadius:"6px",position:"fixed",marginLeft: "6px", listStyleType: "none", padding: "0" }}>
          {categories.map((category) => (
            <li key={category.id}>
              <Link href={`/categories/${category.id}`}>
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
            </ul>
            
            
  

  {/* Show collections when the button is clicked */}
  

          </nav>
        </div>
      </header>
      <Sizes/>
    </>
  );
}

if (typeof window !== "undefined") {
  window.addEventListener('load', async () => {
    await runServerWorker();
  }, { once: true });
  console.log("navbar: Added load event listener for serverWorker.");
}

export default Navbar;
