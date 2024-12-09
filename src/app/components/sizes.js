"use client"
import "../css/sizes.css"
import { useEffect,useState } from "react";
import {updateCartBadge} from "./cart"
import {db} from '../firebase'
import { collection, getDocs,doc,updateDoc,setDoc,getDoc,deleteField } from "firebase/firestore";



let fetchSizeChart;

export default function Sizes(){
    const [isOpen, setIsOpen] = useState(false);
    const [editedFieldName, setEditedFieldName] = useState("");
    const [editedValues, setEditedValues] = useState([]);
    const [newFieldName, setNewFieldName] = useState("");
    const [newValues, setNewValues] = useState(["", "", "", ""]); // For indices 0-3
    const [canEdit, setCanEdit] = useState(false);
    const [colID, setColID] = useState("");

    useEffect(() => {
      const quantityBar = document.getElementById("quantityBar");
      if (quantityBar) {
        if (isOpen) {
          quantityBar.style.display = 'flex';
        } else {
          quantityBar.style.display = 'none';
        }
      }
    }, [isOpen]);

    useEffect(() => {
        // Check for edit mode
        const params = new URLSearchParams(window.location.search);
        if (params.has("edit")) {
          const storedValue = localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY);
          if (storedValue === process.env.NEXT_PUBLIC_EDIT_VALUE) {
            setCanEdit(true);
          }
        }
      }, []);


      const handleValueChange = (index, value) => {
        const updatedValues = [...newValues];
        updatedValues[index] = value;
        setNewValues(updatedValues);
      };

      

      const handleEditFieldValue = (fieldIndex, valueIndex, newValue) => {
        const updatedValues = [...sizeChart[Object.keys(sizeChart)[fieldIndex]]];
        updatedValues[valueIndex] = newValue;
        setEditedValues(updatedValues);
      };
      

      const handleUpdate = async (fieldName, docID, updatedValues) => {
        try {
          // Reference the document within the "sizeChart" collection
          const docRef = doc(db, colID, docID);
          console.log(colID)
      
          // Use Firestore's updateDoc to update the field
          await updateDoc(docRef, {
            [fieldName]: updatedValues, // Update the field with new values
          });
      
          console.log(`Field "${fieldName}" updated successfully`);
          // Optionally, update the local state to reflect changes
          const updatedChart = { ...sizeChart };
          updatedChart[fieldName] = updatedValues;
          setSizeChart(updatedChart);
        } catch (error) {
          console.error("Error updating field: ", error);
        }
      };

      
      const handleDelete = async (fieldName, docID) => {
        try {
          // Reference the document within the "sizeChart" collection
          const docRef = doc(db, colID, docID);
      
          // Use Firestore's updateDoc to remove a specific field
          await updateDoc(docRef, {
            [fieldName]: deleteField(), // Firestore function to delete a field
          });
      
          console.log(`Field "${fieldName}" deleted successfully`);
          // Optionally, update the local state to reflect changes
          const updatedChart = { ...sizeChart };
          delete updatedChart[fieldName];
          setSizeChart(updatedChart);
        } catch (error) {
          console.error("Error deleting field: ", error);
        }
      };



      
      
      
      const handleSubmit = async (colID) => {
        console.log("colID:", colID);
        console.log("newFieldName:", newFieldName);
        console.log("newValues:", newValues);
      
        if (typeof newFieldName === "string" && newFieldName.trim() !== "" && Array.isArray(newValues)) {
          try {
            // Update the sizeChart state with the new field
            const updatedChart = {
              ...sizeChart,
              [newFieldName]: newValues,
            };
            console.log("Updated chart:", updatedChart);
            setSizeChart(updatedChart);
      
            // Firestore reference to the sizechart document
            const sizeChartRef = doc(db, colID, "sizechart");
      
            // Check if the document exists
            const docSnapshot = await getDoc(sizeChartRef);
      
            if (docSnapshot.exists()) {
              const existingData = docSnapshot.data() || {};
              console.log("Existing data from Firestore:", existingData);
      
              // Attempt to update the existing document
              try {
                await updateDoc(sizeChartRef, {
                  ...existingData,
                  [newFieldName]: newValues,
                });
                console.log("Field updated in Firestore successfully!");
              } catch (updateError) {
                console.error("Error while updating Firestore document:", updateError);
              }
            } else {
              // Attempt to create a new document
              try {
                await setDoc(sizeChartRef, {
                  [newFieldName]: newValues,
                });
                console.log("Sizechart document created and field added successfully!");
              } catch (setError) {
                console.error("Error while creating Firestore document:", setError);
              }
            }
      
            // Optionally reset the input fields after successful update
            setNewFieldName("");
            setNewValues(["", "", "", ""]);
          } catch (error) {
            console.error("Unexpected error in handleSubmit:", error);
          }
        } else {
          alert("Please provide a valid field name and ensure values are an array.");
        }
      };
      
      


    // Define state for size chart
  const [sizeChart, setSizeChart] = useState(null); // Initialize with null or an empty object if preferred
  const [iSSizeChart, setiSSizeChart] = useState(false); 
  useEffect(() => {
    console.log("iSSizeChart updated:", iSSizeChart);
  }, [iSSizeChart]);

   fetchSizeChart = async (collectionID) => {
    console.log(collectionID)
    console.log("Starting fetch for size chart...");

    try {
        setSizeChart(null);
        setColID(null);
        setiSSizeChart(false);
     
      const collectionRef = collection(db, collectionID);
      console.log("Firestore collection reference created:", collectionRef);

      // Fetch all documents in the collection
      const querySnapshot = await getDocs(collectionRef);

      console.log("Documents fetched:", querySnapshot.docs);
      setiSSizeChart(true);
      // Loop through each document and check if it matches the "sizechart" document
      querySnapshot.forEach((doc) => {
        if (doc.id === "sizechart") {
          const sizeChartData = doc.data();
          console.log("Fetched size chart data:", sizeChartData);

          // Log array fields and their values for specific indices
          Object.keys(sizeChartData).forEach((field) => {
            const arrayField = sizeChartData[field];
            if (Array.isArray(arrayField)) {
              console.log(`Values for field "${field}":`, arrayField);

        
            } else {
              console.warn(`Field "${field}" is not an array.`);
            }
          });

          // Update the state with size chart data

          setSizeChart(sizeChartData);
          setColID(collectionID)
          
          console.log(iSSizeChart);
          
        }
      });
    } catch (error) {
      console.error("Error fetching size chart:", error);
    }
  };
 
    
    function generateRandom() {
        const min = 1000000000; // 10 digit minimum number
        const max = 9999999999; // 10 digit maximum number
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    const [quantity, setQuantity] = useState(1);
    var quantityVar;
    function updateTotalPrice() {
        
        var quantity = document.getElementById("quantity").value;
   
        // Check if the elements exist before trying to access them
        var productPriceElement = document.getElementById("productPrice");
      
    
        if (productPriceElement) {
        // Retrieve product price from localStorage or HTML if not present in localStorage
        let productPrice = localStorage.getItem("firstPrice");
        
        if (!productPrice) {
            // Product price is not in localStorage, fetch it from the HTML element
            var productPriceStr = document.getElementById("productPrice").innerText;
            
            // Extract integer value from productPriceStr
            productPrice = parseInt(productPriceStr.trim().replace("Rs. ", ""), 10);
            
            // Check if productPrice is a valid number
            if (!isNaN(productPrice)) {
                // Store the price in localStorage
                localStorage.setItem("firstPrice", productPrice);
            } else {
                console.error("Invalid product price format in HTML.");
                return; // Exit function if price is invalid
            }
        } else {
            // Convert stored price to integer
            productPrice = parseInt(productPrice, 10);
        }
    
        // Retrieve quantity from an element or variable (assuming `quantity` is defined)
        quantityVar = parseInt(document.getElementById("quantity").value, 10); // Example, adjust as needed
    
        // Check if quantity is a valid number
        if (isNaN(quantityVar)) {
            console.error("Invalid quantity value.");
            return; // Exit function if quantity is invalid
        }
    
        // Calculate total price
        var totalPrice = quantityVar * productPrice;
    
        // Update the price in the HTML
        productPriceElement.innerText = "Rs. " + totalPrice;
    
    } else {
        console.error("Product price element not found.");
    }
    }
    useEffect(() => {
        const quantityInput = document.getElementById("quantity");
    
        if (quantityInput) {
            quantityInput.addEventListener("input", updateTotalPrice);
    
            // Cleanup function to remove the event listener
            return () => {
                quantityInput.removeEventListener("input", updateTotalPrice);
            };
        }
    }, [isOpen]);
    


    let newSize;
    function changeSizeAndStyle(buttonId, size) {
        console.log(buttonId, size);
      
        // Reset all button styles first
        document.querySelectorAll('.size-button').forEach(button => {
            button.style.backgroundColor = '';
            button.style.color = '';
        });
      
        // Get the clicked button element
        const clickedButton = document.getElementById(buttonId);
        if (clickedButton) {
            // Change the clicked button's styles
            clickedButton.style.backgroundColor = 'black';  
            clickedButton.style.color = 'white';  
        } else {
            console.error("Button not found for ID: ", buttonId);
        }
      
        // Store the clicked button ID in localStorage
        localStorage.setItem('clickedSize', buttonId);
      
        // Call the function to change size (ensure this exists)
        changeSize(size);
    }
    
    
    
    // Function to run on page load and apply saved button styles
    window.onload = function() {
        localStorage.removeItem("purchase");
        const savedButtonId = localStorage.getItem('clickedSize');
        console.log(savedButtonId)
        if (savedButtonId) {
            const savedButton = document.getElementById(savedButtonId);
            if (savedButton) {
                console.log(savedButton)
                savedButton.style.cssText = '';
                savedButton.style.backgroundColor = 'black';
                savedButton.style.color = 'white';
            }
        }
    };

    function changeSize(size) {
        
        newSize = size;
        localStorage.setItem("userSize",size)
        
        if (size === 36) {
            newSize = "Small";
        } else if (size === 40) {
            newSize = "Medium";
        } else if (size === 45) {
            newSize = "Large";
        } else if (size === 48) {
            newSize = "Extra Large";
        } else {
            newSize = size; 
        }
        console.log("Selected Size: " + newSize);
        
    }
    console.log("Render check, iSSizeChart:", iSSizeChart);

return(
    <>
    {iSSizeChart &&
        
     (
        <>
          <div
            className="custom-dropdown"
            ref={(dropdown) => {
              if (dropdown) {
                // Adding event listener to detect clicks outside the dropdown
                document.addEventListener("mousedown", (e) => {
                  // Check if the clicked target is outside the dropdown
                  if (!dropdown.contains(e.target)) {
                    // Hide the dropdown by setting display to 'none'
                    
      
                    // Clear 'preCartItems' from localStorage
                    localStorage.removeItem("purchase");
                   
                  }
                });
              }
            }}
          >



<div style={{display:"flex",justifyContent:"center",color:"black",justifyContent:"space-around",marginLeft:"50px"}}>
 <h1>
    SIZE GUIDE / SELECTION
    </h1> 
    <span onClick={()=>{setiSSizeChart(false)}}>X</span>  
    </div>
     
    <div
  className="size-bar"
  onClick={() => {
    setIsOpen((prev) => !prev);
    
  }}
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '10px 0',
    borderBottom: '1px solid #ccc',
  }}
>


  <h4 style={{ fontSize: '14px', fontWeight: 'normal' }}>INCREASE QUANTITY</h4>
  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{isOpen ? '-' : '+'}</span>
</div>

{/* Quantity selector, shown only when isOpen is true */}

  <div id="quantityBar" style={{display:"none"}}><h4>SELECT QUANTITY : </h4>
  <div className="number-control">
          <div
            className="number-left"
            onClick={() => {
              const quantityInput = document.getElementById("quantity");
              if (parseInt(quantityInput.value, 10) > 1) {
                quantityInput.value = parseInt(quantityInput.value, 10) - 1;
              }
              setQuantity((prev) => Math.max(1, prev - 1));
              updateTotalPrice();
            }}
          ></div>
          <input
            id="quantity"
            type="number"
            name="number"
            className="number-quantity"
            value={quantity}
            min="1"
            onChange={(e) => setQuantity(Math.max(1, e.target.value))}
          />
          <div
            className="number-right"
            onClick={() => {
              const quantityInput = document.getElementById("quantity");
  
              quantityInput.value = parseInt(quantityInput.value, 10) + 1;
  
              setQuantity((prev) => prev + 1);
              updateTotalPrice();
            }}
          ></div>
        </div>
        
  
  </div>
  
      
      




      

            <div style={{ display: "flex" ,justifyContent:"center"}}>
              <h4>SELECT SIZE</h4>
            </div>
            
            <div className="sizingBtns">
            <button 
  className="size-button" 
  value="36" 
  id="s" 
  onClick={() => changeSizeAndStyle("s", 36)}
>
  Small
</button>
<button 
  className="size-button" 
  value="40" 
  id="m" 
  onClick={() => changeSizeAndStyle("m", 40)}
>
  Medium
</button>
<button 
  className="size-button" 
  value="45" 
  id="l" 
  onClick={() => changeSizeAndStyle("l", 45)}
>
  Large
</button>
<button 
  className="size-button" 
  value="48" 
  id="xl" 
  onClick={() => changeSizeAndStyle("xl", 48)}
>
  XL
</button>

</div>
<div className="sizingBtns">
    
    
<button
              className="cartBtn"
              onClick={async () => {
                const userSize = localStorage.getItem("userSize");
                if (userSize) {
                  const userSizeInt = parseInt(userSize, 10);
                  let preCartItems =
                    JSON.parse(localStorage.getItem("preCartItems")) || [];
                  let cartItems =
                    JSON.parse(localStorage.getItem("cartItems")) || [];
                  const quantityVar = parseInt(
                    document.getElementById("quantity").value,
                    10
                  );
                  const productToAdd =
                    preCartItems.length > 0
                      ? preCartItems[preCartItems.length - 1]
                      : null;
                      console.log(productToAdd)
      
                  if (productToAdd) {
                    // Check if the product with the same name and size exists in cartItems
                    const existingProductIndex = cartItems.findIndex(
                      (item) =>
                        item.productName === productToAdd.productName &&
                        item.size === userSizeInt
                    );
      
                    if (existingProductIndex !== -1) {
                      // Update quantity if the product with same name and size exists
                      cartItems[existingProductIndex].quantity += quantityVar;
                    } else {
                      // Add as a new product if the size or name is different
                      const newItem = {
                        id: generateRandom(), // Generate a new id for the product
                        productName: productToAdd.productName,
                        price: productToAdd.price,
                        pic: productToAdd.pic,
                        quantity: quantityVar, // Set the quantity directly from user input
                        size: userSizeInt, // Add the size directly to the product object
                      };
                      cartItems.push(newItem);
                    }
      
                    // Save the updated cartItems back to localStorage
                    await new Promise((resolve) => {
                      localStorage.setItem("cartItems", JSON.stringify(cartItems));
                      resolve();
                    });
      
                    updateCartBadge();
      
                    if (localStorage.getItem("purchase")) {
                      // If "purchase" key exists, navigate to the purchase page
                      window.location.href = "purchase";
                      localStorage.removeItem("purchase");
                    } else {
                      // Hide the dropdown after adding the item
                      setTimeout(() => {
                        document.querySelector(".custom-dropdown").style.display =
                          "none";
                      }, 1000);
                    }
                  } else {
                    alert("No product found to add to the cart");
                  }
                } else {
                  alert("Please select a size");
                }
              }}
            >
              
              ADD TO CART
              
               
            </button>


    </div>

            {/* Adding size selection table */}
            <table className="size-table">
  <thead>
    <tr>
      <th></th>
      <th>S</th>
      <th>M</th>
      <th>L</th>
      <th>XL</th>
    </tr>
  </thead>



  <tbody>
  {sizeChart &&
     Object.keys(sizeChart).map((field, index) => (
        <tr key={index}>
          {/* Field Name */}
          <td className="sizeHeaders">
            {field} {/* Displaying the field name as text */}
          </td>
  
          {/* Field Values */}
          {Array.isArray(sizeChart[field]) ? (
            sizeChart[field].map((value, idx) => (
              <td key={idx}>{value}</td> // Displaying the field value as text
            ))
          ) : (
            <td colSpan="4">Invalid data</td>
          )}

        {/* Delete Button */}
       {canEdit && <td>
          <button onClick={() => handleDelete(field, "sizechart")}>Delete</button>
        </td>
}
      </tr>
    ))}

  {/* Input Row for Adding New Field */}
  {canEdit &&
  <tr>
    <td>
      <input
        type="text"
        placeholder="New Field Name"
        value={newFieldName}
        onChange={(e) => setNewFieldName(e.target.value)}
      />
    </td>
    {newValues.map((value, idx) => (
      <td key={idx}>
        <input
          type="text"
          placeholder={`Value ${idx + 1}`}
          value={value}
          onChange={(e) => handleValueChange(idx, e.target.value)}
        />
      </td>
    ))}
    <td>
      <button onClick={() => handleSubmit(colID)}>Add Field</button>
    </td>
  </tr>
}
</tbody>
</table>
      
       
    </div>
            
            
            
      
          
        </>
      )}
     </> );

      
      
}
export {fetchSizeChart};