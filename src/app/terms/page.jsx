
'use client'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import TermComponent from './terms'
import Link from 'next/link'

export default function Terms(){
    if (typeof window !== "undefined") {
    return(
<>
<Navbar/>
<TermComponent/>
<Footer/>

</>
    );}
}