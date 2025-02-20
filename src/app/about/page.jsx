export const dynamic = 'force-dynamic'; // Ensures the entire page is dynamically rendered
export const revalidate = 0; // Disable caching for this page

import AboutComponent from './aboutComponent';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WeBelieveComponent from './WeBelieveComponent';
import ClientLogosComponent from './ClientLogosComponent';
import ServiceCard from '../components/ServiceCard';

const Page = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/aboutEdit`, { cache: 'no-store' });
  const data = await res.json();
  const weBelieveRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weBelieve`);
  const weBelieveData = await weBelieveRes.json();
  const logosRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientLogos`);
  const logosData = await logosRes.json();
  const resService = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`, { cache: 'no-store' });
  const services = await resService.json();
  

  return (
    <>
      <Navbar />
      <AboutComponent header={data.header} paragraph={data.paragraph} />
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
      <WeBelieveComponent 
        initialText={weBelieveData.text} 
        initialHeader={weBelieveData.header} 
        initialTeam={weBelieveData.team} 
      />
      <ClientLogosComponent logos={logosData} />
      <Footer />
    </> 
  );
};

export default Page;
