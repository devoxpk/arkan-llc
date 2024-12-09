'use client'
import './shipping.css'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import ShippingComponent from './shipping'
export default function Shipping(){
    if (typeof window !== "undefined") {
return(

<>

<Navbar/>
<ShippingComponent/>
<Footer/>


</>
)}


}