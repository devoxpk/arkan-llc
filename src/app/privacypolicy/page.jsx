'use client'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import PrivacyComponent from './privacy'
import Link from 'next/link'

export default function Privacy(){
    if (typeof window !== "undefined") {
    return(
<>
<Navbar/>
<PrivacyComponent/>
<Footer/>


</>
    );}
}