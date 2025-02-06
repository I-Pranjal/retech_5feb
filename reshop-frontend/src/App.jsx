import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import HomePage from "./pages/user/homepage";
import About from "./pages/user/about";
import Contact from "./pages/user/contact";
import Login from "./pages/user/login";
import Signup from "./pages/user/signup";
import Shop from "./pages/user/shop";
import ProductDetail from "./pages/user/productdetails";
import ShoppingCartPage from "./pages/user/cart";
import Checkout from "./pages/user/checkout";
import Order from "./pages/user/orders";
import GiftBox from "./pages/user/gift-box";
import NotFoundPage from "./pages/user/notfound";


import DashboardPage from "./pages/admin/daashboard";
import Product from "./pages/admin/product";
import LoginPage from "./pages/admin/login";
import SellerPage from "./pages/admin/signup";
import Complaints from "./pages/admin/complaints";
import Orders from "./pages/admin/order";
import Customers from "./pages/admin/customer";
import CalendarPage from "./pages/admin/calendar";
import CouponPage from "./pages/admin/coupon";
import Reviews from "./pages/admin/review";
import SEO from "./pages/admin/SEO";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            
            <Route path="/" element={<HomePage />} />
            <Route path="/homepage" element={<HomePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/cart" element={<ShoppingCartPage />} />
            <Route path="/orders" element={<Order />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/product/:productId" element={<ProductDetail />} />

            <Route path="/gift-boxes" element={<GiftBox />} />
            <Route path="/books" element={<GiftBox />} />
            <Route path="/stationery" element={<GiftBox />} />

           
            <Route path="/admin/:sellerId" element={<DashboardPage />} />
            <Route path="/seller/login" element={<LoginPage />} />
            <Route path="/seller/signup" element={<SellerPage />} />
            <Route path="/seller/coupons/:sellerId" element={<CouponPage />} />
            <Route path="/admin/products/:sellerId" element={<Product />} />
            <Route path="/admin/complaints/:sellerId" element={<Complaints />} />
            <Route path="/admin/orders/:sellerId" element={<Orders />} />
            <Route path="/admin/customers/:sellerId" element={<Customers />} />
            <Route path="/admin/calendar/:sellerId" element={<CalendarPage />} />
            <Route path="/admin/reviews/:sellerId" element={<Reviews />} />
            <Route path="/admin/SEO/:sellerId" element={<SEO />} />

            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
