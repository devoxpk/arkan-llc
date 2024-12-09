'use client'
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import TrackingComponent from '../components/tracking';

export default function Tracking(){
    if (typeof window !== "undefined") {
    return(
    <>
<Navbar/>
<TrackingComponent/>
<Footer/>
</>
    );}
}