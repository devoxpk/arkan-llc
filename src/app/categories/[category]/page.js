import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import Cart from "../../components/cart";
import Loader from "../../components/loader";
import CategoryClient from "../categoryClient"; // Import the new client component
import Products from "../../components/products";
export default function CategoriesPage({ params }) {
  const category = params.category;
  console.log('Category:', category);

  return (
    <>
      <Navbar />
      <Cart />

      <hr />

      {console.log('Rendering CategoryClient with category:', category)}
      <CategoryClient category={category} /> {/* Use the client component */}
<Products collectionsToFetch={[category]} key={category} />
      <Loader />
      <Footer />
    </>
  );
}
