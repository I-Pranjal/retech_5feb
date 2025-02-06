import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const userId = "USER001"; // only in test mode
  
  // Use refs to track if requests are in progress
  const isFetchingCart = useRef(false);
  const isFetchingProducts = useRef(false);

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    if (isFetchingProducts.current) return;
    
    try {
      isFetchingProducts.current = true;
      setLoading(true);
      const response = await axios.get("http://localhost:5000/get-product");
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
      isFetchingProducts.current = false;
    }
  }, []);

  // Fetch cart items
  const fetchCart = useCallback(async () => {
    if (isFetchingCart.current) return;

    try {
      isFetchingCart.current = true;
      const response = await axios.post("http://localhost:5000/cart/get-cart", { userId });
      if (response.data.success) {
        setCartItems(response.data.cart || []);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCartItems([]);
    } finally {
      isFetchingCart.current = false;
    }
  }, []);

  // Enrich cart items with product details
  const enrichedCartItems = useMemo(() => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return [];

    const cart = cartItems[0];
    if (!cart?.productsInCart) return [];

    return cart.productsInCart.map(item => {
      const productDetails = products.find(product => product?.productId === item?.productId);
      return {
        ...item,
        name: productDetails?.name || "Unknown Product",
        img: productDetails?.img || [],
        category: productDetails?.category || "No category available",
        price: productDetails?.price || 0,
        stock: productDetails?.stock || 0,
      };
    });
  }, [cartItems, products]);

  // Calculate total items in cart
  const totalCartItems = useMemo(() => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;
    const cart = cartItems[0];
    if (!cart?.productsInCart) return 0;
    return cart.productsInCart.length;
  }, [cartItems]);

  // Calculate total cart price
  const totalCartPrice = useMemo(() => {
    if (!Array.isArray(enrichedCartItems)) return "0.00";
    return enrichedCartItems.reduce((total, item) => 
      total + (parseFloat(item?.price || 0) * (parseInt(item?.productQty, 10) || 0)), 0
    ).toFixed(2);
  }, [enrichedCartItems]);

  // Add to cart with optimistic updates
  const addToCart = useCallback(async (product) => {
    try {
      let currentCart = cartItems[0];
      let updatedProductsInCart = [];
      
      // Optimistically update the local state
      const updatedCart = [...cartItems];
      if (currentCart?.productsInCart) {
        const existingItemIndex = currentCart.productsInCart.findIndex(
          item => item.productId === product.productId
        );

        if (existingItemIndex !== -1) {
          // Update existing item
          updatedCart[0] = {
            ...currentCart,
            productsInCart: currentCart.productsInCart.map((item, index) =>
              index === existingItemIndex
                ? { ...item, productQty: item.productQty + 1 }
                : item
            ),
          };
          updatedProductsInCart = [{
            productId: product.productId,
            productQty: currentCart.productsInCart[existingItemIndex].productQty + 1,
          }];
        } else {
          // Add new item
          updatedCart[0] = {
            ...currentCart,
            productsInCart: [...currentCart.productsInCart, { productId: product.productId, productQty: 1 }],
          };
          updatedProductsInCart = [{
            productId: product.productId,
            productQty: 1,
          }];
        }
      } else {
        // Create new cart
        updatedCart[0] = {
          productsInCart: [{ productId: product.productId, productQty: 1 }],
        };
        updatedProductsInCart = [{
          productId: product.productId,
          productQty: 1,
        }];
      }

      setCartItems(updatedCart);

      // Make API call
      const response = await axios.post("http://localhost:5000/cart/addtocart", {
        userId,
        productsInCart: updatedProductsInCart,
      });

      if (!response.data.success) {
        // Revert optimistic update if API call fails
        await fetchCart();
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      // Revert optimistic update on error
      await fetchCart();
    }
  }, [cartItems, fetchCart]);

  // Update cart quantity with optimistic updates
  const updateCartQuantity = useCallback(async (productId, change) => {
    try {
      const currentItem = enrichedCartItems.find(item => item.productId === productId);
      const updatedQty = Math.max(1, (currentItem?.productQty || 0) + change);

      // Optimistically update local state
      setCartItems(prevItems => prevItems.map(cart => ({
        ...cart,
        productsInCart: cart.productsInCart.map(item =>
          item.productId === productId
            ? { ...item, productQty: updatedQty }
            : item
        )
      })));

      const response = await axios.put("http://localhost:5000/cart/update-quantity", {
        userId,
        productId,
        productQty: updatedQty,
      });

      if (!response.data.success) {
        // Revert optimistic update if API call fails
        await fetchCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      // Revert optimistic update on error
      await fetchCart();
    }
  }, [enrichedCartItems, fetchCart]);

  // Remove from cart with optimistic updates
  const removeFromCart = useCallback(async (productId) => {
    try {
      // Optimistically update local state
      setCartItems(prevItems => prevItems.map(cart => ({
        ...cart,
        productsInCart: cart.productsInCart.filter(item => item.productId !== productId)
      })));

      const response = await axios.post("http://localhost:5000/cart/remove-item", {
        userId,
        productId,
      });

      if (!response.data.success) {
        // Revert optimistic update if API call fails
        await fetchCart();
      }
    } catch (error) {
      console.error("Error removing item:", error);
      // Revert optimistic update on error
      await fetchCart();
    }
  }, [fetchCart]);

  // Initial load effect
  useEffect(() => {
    if (isInitialLoad) {
      fetchProducts();
      fetchCart();
      setIsInitialLoad(false);
    }
  }, [fetchProducts, fetchCart, isInitialLoad]);

  const contextValue = useMemo(() => ({
    enrichedCartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    loading,
    products,
    totalCartItems,
    totalCartPrice,
    fetchCart,
    fetchProducts
  }), [
    enrichedCartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    loading,
    products,
    totalCartItems,
    totalCartPrice,
    fetchCart,
    fetchProducts
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};