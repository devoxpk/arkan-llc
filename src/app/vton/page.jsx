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