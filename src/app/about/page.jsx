'use client'
// pages/about/page.jsx
import Navbar from "../components/navbar"; // Adjust import path if necessary
import AboutComponent from "../components/about"; // Adjust import path if necessary
import Footer from "../components/footer"; // Adjust import path if necessary

export default function About() {
    if (typeof window !== 'undefined') {
    return (
        <>
            <Navbar />
            <AboutComponent />
            <Footer />
        </>
    );}
}
