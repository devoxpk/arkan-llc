export const dynamic = 'force-dynamic'; // Ensures the entire page is dynamically rendered
export const revalidate = 0; // Disable caching for this page

import Navbar from './components/Navbar';
import ServiceCard from './components/ServiceCard';
import Footer from './components/Footer';
import ContactForm from './components/ContactForm';
import AdminWrapper from './components/AdminWrapper';
import Poster from './components/Poster';
import InfoBar from './components/InfoBar';


export default async function Home() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`, { cache: 'no-store' });
  const services = await res.json();
  
  return (
    <>
      <Navbar />
      <Poster 
        header="Welcome to the Future."
        text="Arkan Golden Excellence is dedicated to providing you a service beyond your expectations" 
        videoPath="/videos/video1.mp4" 
        showButton={true} 
      />
      <main>
        <section id="services">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              text={service.text}
              image={service.image}
              reverse={service.reverse}
            />
          ))}
        </section>
        <AdminWrapper />
        <Poster 
          header="A name you can trust..."
          text="Arkan Golden Excellence Co. Ltd. offers unified services to enable the most innovative & cost-effective value solutions for its clients while upholding its commitment to quality & delivery timeline" 
          videoPath="/videos/video2.mp4" 
          showButton={false} 
        />
        <InfoBar />
        
      </main>
      <Footer />
    </>
  );
}