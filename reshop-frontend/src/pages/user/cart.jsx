import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import CartItems from "../../components/user/cart/Cartitems";
import RecentlyViewed from "../../components/user/cart/recentlyviewed";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Navbar from "../../components/user/navbar/navbar";
import { Helmet } from "react-helmet";
import SEOComponent from "../../components/SEO/SEOComponent";
import axios from "axios";
import { useCart } from "../../hooks/useCart";
// import { useAuth } from "../../context/AuthContext"; 

const ShoppingCartPage = () => {
  // const { user } = useAuth(); // Get logged-in user details from AuthContext
 const {enrichedCartItems, totalCartPrice} = useCart()
 const handleCheckout = async (event) => {
  console.log("checkout attempt");
  console.log("enriched cart items : ", enrichedCartItems);

  const userId = "USER001";

  try {
    const payload = { cart_data: { items: enrichedCartItems } };
    console.log("Sending cart data:", JSON.stringify(payload, null, 2));

    const response = await fetch("http://localhost:5000/shiprocketapi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const myresponse = await response.json();
    console.log("this was received : ", myresponse.token);
    
    window.HeadlessCheckout.addToCart(event, myresponse.token, {
      fallbackUrl: process.env.API_ACCESS_URL,
    });

  } catch (error) {
    console.error("Error sending request:", error);
  }
};

  return (
    <div className="bg-pink-50 min-h-screen">
      <SEOComponent />
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6 mt-16">
        <div className="bg-white shadow-md rounded-lg">
          <div className="p-4 flex flex-col md:flex-row items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Shopping Cart</h1>
            <Link
              to="/HomePage"
              className="flex items-center space-x-2 text-pink-600 hover:text-pink-800 transition-colors mt-4 md:mt-0"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-auto">
          <CartItems  /> {/* Pass full product details to CartItems */}
          <RecentlyViewed />
          
        </div>
        
      </div>
    </div>
  );
};

export default ShoppingCartPage;
