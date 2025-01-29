
export const dynamic = 'force-dynamic'; // Ensures the entire page is dynamically rendered
export const revalidate = 0; // Disable caching for this page

import Navbar from '../components/navbar';
import Footer from '../components/footer';

import Vton from './vtonServer'

export default function VtonPage(){
    return(
        <>
            <Navbar/>
            <Vton/>
            <Footer/>
        </>
    );
}