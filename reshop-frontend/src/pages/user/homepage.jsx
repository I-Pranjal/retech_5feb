import React, { useState, useEffect, useCallback, memo } from 'react';
import { FaStar } from 'react-icons/fa';
import { useCart } from '../../hooks/useCart';
import CartItems from '../../components/user/cart/Cartitems';
import SEOComponent from '../../components/SEO/SEOComponent';
import ProfessionalNavbar from '../../components/user/navbar/navbar';
import Footer from "../../components/user/footer/footer";
import axios from 'axios';

// Memoize the CartItems component to prevent unnecessary re-renders
const MemoizedCartItems = memo(({ cartItems, onRemove }) => (
  <CartItems cartItem={cartItems} onRemove={onRemove} />
));

// Separate SideCart into its own component
const SideCart = memo(({ visible, onClose, cartItems, onRemove, onCheckout }) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-5 top-5 right-4 w-1/3 h-full bg-white shadow-2xl z-50">
      <div className="relative h-full">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-16 h-full overflow-y-auto">
          <MemoizedCartItems cartItems={cartItems} onRemove={onRemove} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
          <button 
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
            onClick={onCheckout}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
});

// Memoize the product card to prevent unnecessary re-renders
const ProductCard = memo(({ product, onAddToCart, onBuyNow }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow transform hover:-translate-y-1 relative">
    <div className="relative">
      <img
        src={product.img[0] || "/fallback-image.jpg"}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-75 text-white opacity-0 hover:opacity-100 transition-opacity">
        Shop Now
      </button>
    </div>
    <div className="p-4">
      <h3 className="font-medium mb-2">{product.name}</h3>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm">₹{product.price}</span>
        <div className="flex items-center">
          <FaStar className="text-yellow-400 mr-1" />
          <span className="text-sm">{product.rating}</span>
        </div>
      </div>
      <div className="mt-4 flex space-x-4">
        <button
          className="bg-indigo-500 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-600"
          onClick={() => onAddToCart(product)}
        >
          Add to Cart
        </button>
        <button
          className="bg-orange-500 text-white px-3 py-1 rounded-md text-sm hover:bg-orange-600"
          onClick={() => onBuyNow(product)}
        >
          Buy Now
        </button>
      </div>
    </div>
  </div>
));

const ProductGrid = ({ title, products, onAddToCart, onBuyNow }) => (
  <section className="container mx-auto px-4 py-8">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <a href="/shop">
        <button className="bg-pink-100 text-pink-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-200 transition-colors">
          View All
        </button>
      </a>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product.productId || index}
          product={product}
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
        />
      ))}
    </div>
  </section>
);

const ScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const currentScroll = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((currentScroll / scrollHeight) * 100);
    };

    window.addEventListener("scroll", updateScrollProgress);
    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${scrollProgress}%`,
        height: '4px',
        backgroundColor: '#ec4899',
        transition: 'width 0.3s ease-out',
        zIndex: 1000,
      }}
    />
  );
};

const HomePage = () => {
  const { enrichedCartItems, addToCart, removeFromCart, products } = useCart();
  const [sideCartVisible, setSideCartVisible] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = useCallback(async (product) => {
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    try {
      await addToCart(product);
      setSideCartVisible(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  }, [addToCart, isAddingToCart]);

  const handleBuyNow = useCallback(async (product) => {
    await handleAddToCart(product);
    window.location.href = "/cart";
  }, [handleAddToCart]);

  const handleCloseSideCart = useCallback(() => {
    setSideCartVisible(false);
  }, []);

  const handleCheckout = async (event) => {
    try {
        const mydata = enrichedCartItems.map(item => ({
            variant_id: item.productId,
            quantity: item.quantity || 1
        }));

        const transformedData = {
            cart_data: { items: mydata },
            redirect_url: "http://localhost:5000/shiprocketplaceorder"  ,
            timestamp: new Date().toISOString()
        };

        const {data} = await axios.post('http://localhost:5000/shiprocketapi', transformedData);
        const { token , orderId} = data;
        console.log(orderId) ;

       await window.HeadlessCheckout.addToCart(event, token, {
          fallbackUrl: "http://localhost:5000/shiprocketplaceorder" 
      });


      // After order is made, use the orderID to make a request to get order details
      placeOrder(orderId) ;  

    } catch (error) {
        console.error('Checkout failed');
        // Optional: show user-friendly error notification
    }
};

const placeOrder = async (orderID) => {
  try {
      const response = await fetch("http://localhost:5000/shiprocketplaceorder", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ orderID })  // Sending orderID in request body
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Shiprocket Place Order Response:", data);
      return data;
  } catch (error) {
      console.error("Error in shiprocketPlaceOrder:", error);
  }
};







  return (
    <div className="bg-gray-50">
      <SEOComponent />
      <ScrollProgress />
      <ProfessionalNavbar />
      <main>
        {/*  Existing carousel code here */}
        
        <ProductGrid 
          title="Top Picks" 
          products={products}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />

        <SideCart
          visible={sideCartVisible}
          onClose={handleCloseSideCart}
          cartItems={enrichedCartItems}
          onRemove={removeFromCart}
          onCheckout={handleCheckout}
        />

        <Footer />
      </main>
    </div>
  );
};

export default HomePage;