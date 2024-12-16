import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // Server-side Firebase import
import Link from "next/link";
import '../css/aboutbrand.css';
import AboutBrandEditor from './AboutBrandEditor'; // Import the client component

const AboutBrand = async () => {
  let imgLink = "";

  // Fetch the image link from Firestore on the server side
  try {
    const docRef = doc(db, "gallery", "imgLinks");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      imgLink = data.aboutBrand || "";
    }
  } catch (error) {
    console.error("Error fetching image link:", error);
  }

  return (
    <div className="about-brand">
      <div className="image-container">
        {imgLink && (
          <img src={imgLink} alt="Our Brand" className="responsive-image" />
        )}
        <h1 id="our-brand">
          <Link href="/about">Our Brand</Link>
        </h1>
      </div>
      {/* Render the client-side editor component */}
      <AboutBrandEditor currentImgLink={imgLink} />
    </div>
  );
};

export default AboutBrand;