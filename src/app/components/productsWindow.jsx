
import ProductsServer from "./productsServer";


export default function Products({ collectionsToFetch = [], styleHead = "grid", productsStyle = false, trending = false } = {}) {
    console.log(collectionsToFetch);
    return (
        <div>
            
            <ProductsServer collectionsToFetch={collectionsToFetch} styleHead={styleHead} productsStyle={productsStyle} trending={trending} />;
        </div>
    );
} 