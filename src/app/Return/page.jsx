'use client'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import ReturnComponent from './return'
import './return.css'


export default function Return(){
   

    if (typeof window !== "undefined") {
    return(
        <>
        <Navbar/>
        <ReturnComponent/>
        <Footer/>
        
        </>
    );}
}