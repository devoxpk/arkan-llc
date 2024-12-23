'use server'
import { revalidatePath } from "next/cache";
import ProductsServer from "./productsServer";

export async function refreshProducts() {
   
    revalidatePath('/products');
}


export default async function Products({ collectionsToFetch = [], styleHead = "grid", productsStyle = false, trending = false } = {}) {
    
    return (
        <div>
            
            <ProductsServer collectionsToFetch={collectionsToFetch} styleHead={styleHead} productsStyle={productsStyle} trending={trending} />;
        </div>
    );
} 