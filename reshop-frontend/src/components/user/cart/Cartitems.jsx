import React, { useState, useEffect, useMemo } from "react";
import { faTrash, faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import emptyCart from "../../Images/empty_cart.webp";
import { Link } from "react-router-dom";
import axios from "axios";
import { useCart } from "../../../hooks/useCart";

const CartItems = () => {
  const {enrichedCartItems, totalCartPrice,fetchCart, updateCartQuantity,
    removeFromCart,} = useCart()
  const [items, setItems] = useState(  []);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([])
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);
  
  useEffect(() => {
    fetchCart()
    setLoading(false)
  }, [fetchCart]);
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://api.merabestie.com/get-product"); // Adjust endpoint as needed
      setProducts(response.data.products); // Save fetched products in state
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };
  





  const handleCheckout = async () => {
    const transformedData = {
      cart_data: { items: enrichedCartItems.map(({ productId, productQty }) => ({ variant_id: productId, quantity: productQty })) },
      redirect_url: "http://localhost:5000/shiprocketplaceorder" ,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await axios.post("https://api.merabestie.com/shiprocketapi", transformedData);
      if (response.data?.token) {
        window.HeadlessCheckout.addToCart(null, response.data.token, {
          fallbackUrl: "https://merabestie.com/checkout-fallback",
        });
      } else {
        alert("Something went wrong during checkout. Please try again.");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Unable to process your request. Please try again later.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-600"></div>
      </div>
    );
  }

  if (error || enrichedCartItems.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center justify-center">
        <img src={emptyCart} alt="Empty Cart" className="w-48 h-48 mb-4" />
        <p className="text-lg text-gray-600 mb-4">{error || "Your cart is empty"}</p>
        <Link to="/HomePage" className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
        </div>
        <div className="p-4 space-y-4">
          {enrichedCartItems.map((item) => (
            <div key={item.productId} className="flex flex-col md:flex-row items-center justify-between border-b pb-4 last:border-b-0">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full">
                <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                  <div>
                    <h3 className="font-semibold text-base">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full mt-4 md:mt-0">
                    <span className="font-medium text-base">₹{item.price}</span>
                    <div className="flex items-center border rounded-md">
                      <button onClick={() => updateCartQuantity(item.productId, -1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">
                        <FontAwesomeIcon icon={faMinus} className="text-sm" />
                      </button>
                      <input type="text" value={item.productQty} readOnly className="w-12 text-center border-none text-sm" />
                      <button onClick={() => updateCartQuantity(item.productId, 1)} className="px-2 py-1 text-gray-600 hover:bg-gray-100">
                        <FontAwesomeIcon icon={faPlus} className="text-sm" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700 transition-colors">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex justify-between items-center">
  <h3 className="text-lg font-bold">Total:</h3>
  <span className="text-lg font-bold text-pink-600">₹{totalCartPrice}</span>
</div>

      </div>
    </div>
  );
};

export default CartItems;
