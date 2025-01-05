
import SkinServer from './skinserver';
import Navbar from '../components/navbar';
import Footer from '../components/footer';
import Products from '../components/products';

const SkinRecommenderPage = () => {
  return (
    <div>
      <Navbar />
      <SkinServer />
      <Products styleHead="none"/>
      <Footer />
    </div>
  );
};

export default SkinRecommenderPage;
