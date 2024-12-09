'use client'
import PurchaseComponent from "../components/purchase"

export default function Purchase(){
    if (typeof window !== "undefined") {
    return (
<PurchaseComponent/>

    );}
}