
'use client'
import ThanksComponent from "../components/thanks";

export default function Thanks(){
    if (typeof window !== "undefined") {
    return (
<ThanksComponent/>
    );
}
    
}