import { useContext } from "react";
import { CartContext } from "../context/CartContext";

// Custom hook to use cart context
export const useCart = () => useContext(CartContext);
