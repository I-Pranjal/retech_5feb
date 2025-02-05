import React, { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import CartItems from "../../components/user/cart/Cartitems";

const ProductGrid = ({ title, products }) => {
  const { enrichedCartItems, addToCart } = useCart();
  const [sideCartVisible, setSideCartVisible] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

   
  function transformData(mydata) {
    return {
        cart_data: {
            items: mydata.map(item => ({
                variant_id: item.variant_id,
                quantity: item.quantity
            }))
        },
        redirect_url: "http://localhost:5000/shiprocketplaceorder" ,
        timestamp: new Date().toISOString()
    };
  }

  const handleBuyNow = async (product) => {
    await handleAddToCart(product);
    window.location.href = "/cart";
  };
  
  function transformData(mydata) {
    return {
        cart_data: {
            items: mydata.map(item => ({
                variant_id: item.variant_id,
                quantity: item.quantity
            }))
        },
        redirect_url: "http://localhost:5000/shiprocketplaceorder" ,
        timestamp: new Date().toISOString()
    };
  }
  
  const handleCheckout = async (event) => {
    const userId = "USER001";
    // const userId = sessionStorage.getItem('userId');
    // if (!userId) {
    //   alert('Please log in to proceed.');
    //   return;
    // }
  
    // Transform cart data
    const mydata = 
     enrichedCartItems.map(item => ({
        variant_id: item.productId,
        quantity: item.quantity || 1
      }));
        
    

    console.log("my data  : ", mydata); 
   
    try {
      const transformedData = transformData(mydata);
  
      const response = await fetch('http://localhost:5000/shiprocketapi', { 
          method: 'POST',
          headers: {
              "Content-Type": 'application/json',
          },
          body: JSON.stringify(transformedData)
      });
  
      const myresponse = await response.json() ;
      console.log("this was received : ", myresponse.token); 
      window.HeadlessCheckout.addToCart( event , myresponse.token, {fallbackUrl: "https://your.fallback.com?product=123"});
  } catch (error) {
      console.error('Error sending request:', error);
  }
  
  };


  const handleAddToCart = async (product) => {
    if (isAddingToCart) return; // Prevent multiple clicks
    
    setIsAddingToCart(true);
    
    try {
      await addToCart(product);
      setSideCartVisible(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const SideCart = () => (
    <div className="fixed bottom-5 top-5 right-4 w-1/3 h-full bg-white shadow-2xl z-50">
      <div className="relative h-full">
        <button 
          onClick={() => setSideCartVisible(false)}
          className="absolute top-4 right-4 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-16 h-full overflow-y-auto">
          <CartItems 
            cartItems={enrichedCartItems} 
            onRemove={(itemId) => {
              // Handle remove logic here
            }}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
          <button 
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section className="container mx-auto px-4 py-8">
      {sideCartVisible && <SideCart />}
      
      {/* Rest of your ProductGrid JSX */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Product card content */}
            <div className="p-4">
              <button
                className="bg-indigo-500 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-600 disabled:bg-indigo-300"
                onClick={() => handleAddToCart(product)}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;