    import { db, storage } from '../firebase'; // Import Firestore and Storage instances
    import { doc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore'; // Firestore methods
    import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Storage methods
    
    import '../css/products.css';
    import { forceRefreshProducts } from './productsClient';
    
    export default function addProduct(divID) {
        const container = document.getElementById(divID);
    
        if (!container) {
            console.error(`Element with id ${divID} not found.`);
            return;
        }
    
        // Create Add Item button
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'button';
        addButton.id = `Add-${divID}`;
        addButton.innerHTML = `
            <span class="button__text">Add Item</span>
            <span class="button__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke="currentColor" height="24" fill="none" class="svg">
                    <line y2="19" y1="5" x2="12" x1="12"></line>
                    <line y2="12" y1="12" x2="19" x1="5"></line>
                </svg>
            </span>
        `;
        container.appendChild(addButton);
    
        // Check if Add Category button already exists
        let addCategoryButton = document.getElementById(`Add-Category`);
        if (!addCategoryButton) {
            // Create Add Category button
            addCategoryButton = document.createElement('button');
            addCategoryButton.type = 'button';
            addCategoryButton.className = 'button';
            addCategoryButton.id = `Add-Category`;
            addCategoryButton.innerHTML = `
                <span class="button__text">Add Category</span>
            `;
            addCategoryButton.style.zIndex = '9';
            addCategoryButton.style.position = 'fixed';
            addCategoryButton.style.bottom = '10px';
            addCategoryButton.style.cursor = 'pointer';
            container.appendChild(addCategoryButton);
        }
    
        // Create form container for product
        const formContainer = document.createElement('div');
        formContainer.id = `form-container-${divID}`;
        formContainer.className = 'unique-product-form-container';
        formContainer.style.display = 'none';
        formContainer.innerHTML = `
            <div class="unique-header-container">
                Add New Product
                <button style="float: right; cursor: pointer;">✖</button>
            </div>
            <form class="unique-product-form">
                <div class="unique-form-group">
                    <label for="product-name">Product Name</label>
                    <input type="text" id="product-name" name="product-name" placeholder="Add product name" required />
                </div>
                <div class="unique-form-group">
                    <label for="product-price">Product Price</label>
                    <input type="text" id="product-price" name="product-price" placeholder="Add product price" required />
                </div>
                <div class="unique-form-group">
                    <label for="product-cost">Product Cost</label>
                    <input type="text" id="product-cost" name="product-cost" placeholder="Add product cost" required />
                </div>
                <div class="unique-form-group">
                    <label for="discount-price">Discount Price</label>
                    <input type="text" id="discount-price" name="discount-price" placeholder="Add discount price (optional)" />
                </div>
                <div class="unique-form-group">
                    <label for="product-image">Product Image</label>
                    <input type="file" id="product-image" name="product-image" accept="image/*" required />
                </div>
                <button class="unique-product-submit-btn" type="submit">Add Product</button>
            </form>
        `;
        container.appendChild(formContainer);
    
        // Create form container for category
        const categoryFormContainer = document.createElement('div');
        categoryFormContainer.id = `category-form-container`;
        categoryFormContainer.className = 'unique-product-form-container';
        categoryFormContainer.style.display = 'none';
        categoryFormContainer.innerHTML = `
            <div class="unique-header-container">
                Add New Category
                <button style="float: right; cursor: pointer;">✖</button>
            </div>
            <form class="unique-category-form">
                <div class="unique-form-group">
                    <label for="first-header">First Header</label>
                    <input type="text" id="first-header" name="first-header" placeholder="Add first header" required />
                </div>
                <div class="unique-form-group">
                    <label for="second-header">Second Header</label>
                    <input type="text" id="second-header" name="second-header" placeholder="Add second header" required />
                </div>
                <div class="unique-form-group">
                    <label for="product-name">Product Name</label>
                    <input type="text" id="category-product-name" name="product-name" placeholder="Add product name" required />
                </div>
                <div class="unique-form-group">
                    <label for="product-price">Product Price</label>
                    <input type="text" id="category-product-price" name="product-price" placeholder="Add product price" required />
                </div>
                <div class="unique-form-group">
                    <label for="product-cost">Product Cost</label>
                    <input type="text" id="category-product-cost" name="product-cost" placeholder="Add product cost" required />
                </div>
                <div class="unique-form-group">
                    <label for="discount-price">Discount Price</label>
                    <input type="text" id="category-discount-price" name="discount-price" placeholder="Add discount price (optional)" />
                </div>
                <div class="unique-form-group">
                    <label for="product-image">Product Image</label>
                    <input type="file" id="category-product-image" name="product-image" accept="image/*" required />
                </div>
                <button class="unique-category-submit-btn button unique-product-submit-btn" type="submit">Add Category</button>
            </form>
        `;
        container.appendChild(categoryFormContainer);
    
        // Handle form toggle for product
        const handleFormToggle = () => {
            if (formContainer.style.display === 'none') {
                formContainer.style.display = 'flex';
            } else {
                formContainer.style.display = 'none';
            }
        };
    
        addButton.addEventListener('click', handleFormToggle);
    
        // Handle form close button for product
        const closeButton = formContainer.querySelector('.unique-header-container button');
        closeButton.addEventListener('click', handleFormToggle);
    
        // Handle form submission for product
        const form = formContainer.querySelector('.unique-product-form');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            document.querySelector(".loader").style.display = 'block'; // Show loader
    
            const productName = form['product-name'].value;
            const productPrice = form['product-price'].value;
            const productCost = form['product-cost'].value;
            const productImage = form['product-image'].files[0];
            const discountPrice = form['discount-price'].value;
            if (discountPrice <= productPrice) {
                alert('Discount price cannot be less than or equal to product price');
                return;
            }
    
            try {
                // Find the next available document ID
                const colRef = collection(db, divID);
                const querySnapshot = await getDocs(colRef);
                const docIds = querySnapshot.docs.map(doc => parseInt(doc.id, 10)).filter(id => !isNaN(id));
                const nextDocId = Math.max(0, ...docIds) + 1;
    
                // Upload image to Firebase Storage
                const imageRef = ref(storage, `products/${productName}`);
                const uploadTask = await uploadBytesResumable(imageRef, productImage);
                const imageUrl = await getDownloadURL(uploadTask.ref);
    
                // Add product to Firestore
                const productRef = doc(db, divID, String(nextDocId));
                await setDoc(productRef, {
                    productName,
                    price: productPrice,
                    productCP: productCost,
                    pic: imageUrl,
                    dPrice: discountPrice,
                    createdAt: serverTimestamp()
                });
                forceRefreshProducts(divID);
                console.log('Product added successfully');
            } catch (error) {
                console.error('Error adding product:', error);
            } finally {
                document.querySelector(".loader").style.display = 'none'; // Hide loader
                handleFormToggle(); // Close the form after submission
            }
        });
    
        // Handle form toggle for category
        const handleCategoryFormToggle = () => {
            if (categoryFormContainer.style.display === 'none') {
                categoryFormContainer.style.display = 'flex';
            } else {
                categoryFormContainer.style.display = 'none';
            }
        };
    
        addCategoryButton.addEventListener('click', handleCategoryFormToggle);
    
        // Handle form close button for category
        const categoryCloseButton = categoryFormContainer.querySelector('.unique-header-container button');
        categoryCloseButton.addEventListener('click', handleCategoryFormToggle);
    
        // Handle form submission for category
        const categoryForm = categoryFormContainer.querySelector('.unique-category-form');
       
    
    categoryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      document.querySelector(".loader").style.display = 'block'; // Show loader
    
      const firstHeader = categoryForm['first-header'].value;
      const secondHeader = categoryForm['second-header'].value;
      const productName = categoryForm['product-name'].value;
      const productPrice = categoryForm['product-price'].value;
      const productCost = categoryForm['product-cost'].value;
      const productImage = categoryForm['product-image'].files[0];
      const discountPrice = categoryForm['discount-price'].value;
      if (discountPrice !== '') {
          if (discountPrice <= productPrice) {
              alert('Discount price cannot be less than or equal to product price');
              return;
          }
      }
    
      try {
          // Find the next available category ID by checking for existing collections
          let nextCategoryId = 1;
          while (true) {
              const categoryRef = collection(db, String(nextCategoryId));
              const querySnapshot = await getDocs(categoryRef);
              if (querySnapshot.empty) {
                  break; // Found an empty collection ID
              }
              nextCategoryId++;
          }
    
          // Upload image to Firebase Storage
          const imageRef = ref(storage, `products/${productName}`);
          const uploadTask = await uploadBytesResumable(imageRef, productImage);
          const imageUrl = await getDownloadURL(uploadTask.ref);
    
          // Add category and product to Firestore
          const categoryRef = doc(db, String(nextCategoryId), '1');
          await setDoc(categoryRef, {
              productName,
              price: productPrice,
              productCP: productCost,
              pic: imageUrl,
              dPrice: discountPrice,
              createdAt: serverTimestamp()
          });

          // Set headers for the category
          const headersRef = doc(db, String(nextCategoryId), 'headers');
          await setDoc(headersRef, {
              header: [firstHeader, secondHeader]
          });

          await forceRefreshProducts(divID);
          console.log('Category and product added successfully');
      } catch (error) {
          console.error('Error adding category and product:', error);
      } finally {
          document.querySelector(".loader").style.display = 'none'; // Hide loader
          
          handleCategoryFormToggle(); // Close the form after submission
          
      }
    });
    
        }