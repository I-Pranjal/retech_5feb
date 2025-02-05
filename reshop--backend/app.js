require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const nodemailer = require("nodemailer");
const Product = require("./models/product");
const Order = require("./models/ordermodel");
const authRoutes = require("./controllers/auth");
const adminAuthRoutes = require("./controllers/adminauth");
const cartRoutes = require("./controllers/cart");
const productRoutes = require("./controllers/product");
const complaintsRoutes = require("./controllers/complaints");
const couponRoutes = require("./controllers/coupon");
const imageRoutes = require("./controllers/image");
const reviewsRoutes = require("./controllers/reviews");
const SEORoutes = require("./controllers/seo");

if (!process.env.MONGO_URI) {
	throw new Error("Please Add MONGO_URI in environment variables...");
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cors({
		origin: process.env.ALLOWED_ORIGINS?.split(",").map((origin) =>
			origin.trim()
		) || ["http://localhost:5000"],
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			"X-Requested-With",
			"X-Api-Key",
			"X-Api-HMAC-SHA256",
		],
	})
);
app.use(require("cookie-parser")());
app.use(express.static("./public"));
app.use(express.static("./uploads"));

// Session Setup
app.use(
	session({
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: process.env.MONGO_URI,
			collectionName: "sessions",
		}),
		cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
	})
);

// File Upload Configuration
const storage = multer.diskStorage({
	destination: "./uploads/",
	filename: (req, file, cb) => {
		cb(
			null,
			file.fieldname + "-" + Date.now() + path.extname(file.originalname)
		);
	},
});
const upload = multer({ storage, limits: { fileSize: 1000000 } }).single(
	"myFile"
);

// Email Transporter
const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_SERVER,
	port: parseInt(process.env.EMAIL_PORT) || 465,
	secure: process.env.EMAIL_SECURE === "true",
	auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
	tls: { rejectUnauthorized: false },
});

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminAuthRoutes);
app.use("/cart", cartRoutes);
app.use("/products", productRoutes);
app.use("/complaints", complaintsRoutes);
app.use("/coupon", couponRoutes);
app.use("/image", imageRoutes);
app.use("/reviews", reviewsRoutes);
app.use("/seo", SEORoutes);

// Middleware for logging requests
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);

	if (req.method === "POST" || req.method === "PUT") {
		console.log("Request Body:", req.body);
	}

	if (Object.keys(req.query).length > 0) {
		console.log("Query Parameters:", req.query);
	}

	next(); // Pass control to the next handler
});

// Shiprocket API Integration
const calculate_hmac_sha256_as_base64 = (key, content) => {
    const hmac = crypto.createHmac('sha256', key).update(content).digest('base64'); 
    return hmac;
  };


// Write code for shiprocketapi 
// const axios = require('axios');

app.post('/shiprocketapi', async (req, res) => {
    console.log("Received request");
    const mydata = req.body;
    console.log("Requested body:", req.body);

    try {
        const apiKey = "F4ZJ0KzzTQw6M89A";
        const apiSecret = "XY9bc2WhIUnMorH0gPsEVDagZFuIFzfV";
        const makeApiRequest = async (apiKey, apiSecret, thedata) => {
            const timestamp = new Date().toISOString();

            const cartData = thedata;

            const requestBody = JSON.stringify(cartData);
            console.log("Cart Data:", requestBody);

            const signature = calculate_hmac_sha256_as_base64(apiSecret, requestBody);
            console.log("Signature:", signature);

            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: process.env.API_ACCESS_URL,
                headers: {
                    'X-Api-Key': apiKey,
                    'X-Api-HMAC-SHA256': signature,
                    'Content-Type': 'application/json'
                },
                data: requestBody // Use JSON stringified data
            };

            try {
					const response = await axios(config);
				console.log("Token generated:", response.data.result.token);
				console.log("API Response:", response.data);

				return {
					token: response.data.result.token,
					orderID: response.data.result.data.order_id
				};

            } catch (error) {
                console.error("API request failed:", error.response?.data || error.message);
                throw new Error("Failed to communicate with the API.");
            }
        };

        // Call makeApiRequest with proper parameters
        const {token, orderID} = await makeApiRequest(apiKey, apiSecret, mydata);

        if (!token) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve token from Shiprocket API'
            });
        }

        console.log("Token:", token);
        console.log("OrderID :", orderID);
		

        res.status(200).json({
			orderId : orderID ,
            token: token,
            success: true,
            message: 'Order processed successfully',
        });
    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing the order',
        });
    }
});


// Placing the order 
// app.post("/shiprocketplaceorder", async (req, res) => {
//     const { orderID } = req.body;
//     console.log("Order ID:", orderID);

//     const url = `https://reporting.pickrr.com/api/ve1/dashboard-service/order/get?id=${orderID}`;

//     try {
//         const response = await fetch(url, {
//             method: "GET",
//             headers: {
//                 "x-auth": "f485096d091aX0f13X497bX98acX249614901ecc",
//                 "Content-Type": "application/json"
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log("API Response:", data);

//         // Sending response back to the frontend
//         res.status(200).json(data);
//     } catch (error) {
//         console.error("Error fetching order details:", error);
//         res.status(500).json({ error: "Failed to fetch order details" });
//     }
// });

// app.get("/shiprocketplaceorder", async (req, res) => {
//     try {
//         const { oid, ost } = req.query; // Extract orderID and orderStatus from query parameters

//         if (!oid || !ost) {
//             return res.status(400).json({ error: "Missing orderID (oid) or orderStatus (ost)" });
//         }

//         console.log("Order ID:", oid);
//         console.log("Order Status:", ost);

//         const url = `https://reporting.pickrr.com/api/ve1/dashboard-service/order/get?id=${oid}`;

//         const response = await fetch(url, {
//             method: "GET",
//             headers: {
//                 "x-auth": "f485096d091aX0f13X497bX98acX249614901ecc",
//                 "Content-Type": "application/json"
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         console.log("API Response:", data);

//         // Sending the response back to the client
//         res.status(200).json({
//             message: "Order details fetched successfully",
//             orderID: oid,
//             orderStatus: ost,
//             data: data
//         });
//     } catch (error) {
//         console.error("Error fetching order details:", error);
//         res.status(500).json({ error: "Failed to fetch order details" });
//     }
// });




// Product Routes


app.get("/shiprocketplaceorder", async (req, res) => {
    try {
        const { oid, ost } = req.query; // Extract orderID and orderStatus from query parameters

        if (!oid || !ost) {
            return res.status(400).json({ error: "Missing orderID (oid) or orderStatus (ost)" });
        }

        console.log("Order ID:", oid);
        console.log("Order Status:", ost);

        const url = `https://reporting.pickrr.com/api/ve1/dashboard-service/order/get?id=${oid}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-auth": "f485096d091aX0f13X497bX98acX249614901ecc",
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        // Extract necessary details from the data object
        const orderDetails = data?.orderDetails || {};
        const shippingAddress = orderDetails?.shippingAddress || {};
        const billingAddress = orderDetails?.billingAddress || {};
        const lineItems = orderDetails?.lineItems || [];

        const orderItems = lineItems.map(item => ({
            name: item.name,
            sku: item.sku,
            units: item.quantity,
            selling_price: item.price,
            discount: item.discount || 0,
            tax: item.tax || 0,
            hsn: item.hsn || ''
        }));

        // Login to Shiprocket to get the token
        const loginData = JSON.stringify({
            email: "1234@merabestie.com",
            password: "Pass@12345"
        });

        const loginConfig = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://apiv2.shiprocket.in/v1/external/auth/login',
            headers: {
                'Content-Type': 'application/json'
            },
            data: loginData
        };

        const loginResponse = await axios(loginConfig);

        // Extract the token from the login response
        const token = loginResponse.data?.token;

        if (!token) {
            return res.status(401).json({ error: "Failed to retrieve token from Shiprocket" });
        }

        // Prepare data for creating custom order
        const customOrderData = {
			order_id: oid, // Provided externally (for example, from a query parameter)
			order_date: formatOrderDate(orderDetails.createdAt),
			pickup_location: "Bharat", // Replace with the actual pickup location if available
			// channel_id is optional; if not used, you can pass an empty string or omit it.
			channel_id: "",
			comment: "",
			reseller_name: "",
			company_name: "",
			billing_customer_name: billingAddress.firstName || "",
			billing_last_name: billingAddress.lastName || "",
			billing_address: billingAddress.line1 || "",
			billing_address_2: billingAddress.line2 || "",
			billing_isd_code: "91", // Assuming the ISD code is +91; adjust if needed.
			billing_city: billingAddress.city || "",
			// Ensure numeric fields are passed as numbers. If pincode comes as a string, convert it.
			billing_pincode: billingAddress.pincode ? parseInt(billingAddress.pincode, 10) : 0,
			billing_state: billingAddress.state || "",
			billing_country: billingAddress.country || "",
			billing_email: billingAddress.email || "",
			billing_phone: billingAddress.phone ? parseInt(billingAddress.phone, 10) : 0,
			billing_alternate_phone: "", // Optional; leave empty or provide a value if available.
			// If shipping address is the same as billing, set shipping_is_billing to true.
			shipping_is_billing: true,
			shipping_customer_name: shippingAddress.firstName || "",
			shipping_last_name: shippingAddress.lastName || "",
			shipping_address: shippingAddress.line1 || "",
			shipping_address_2: shippingAddress.line2 || "",
			shipping_city: shippingAddress.city || "",
			shipping_pincode: shippingAddress.pincode ? parseInt(shippingAddress.pincode, 10) : 0,
			shipping_country: shippingAddress.country || "",
			shipping_state: shippingAddress.state || "",
			shipping_email: shippingAddress.email || "",
			shipping_phone: shippingAddress.phone ? parseInt(shippingAddress.phone, 10) : 0,
			order_items: orderItems,
			// Payment method should be either "COD" or "Prepaid"
			payment_method: orderDetails.paymentType || "",
			shipping_charges: orderDetails.shippingCharges || 0,
			giftwrap_charges: 0,
			transaction_charges: 0,
			total_discount: orderDetails.totalDiscount || 0,
			sub_total: orderDetails.totalPrice || 0,
			// For dimensions and weight, use defaults or actual values if available.
			length: 10,
			breadth: 15,
			height: 20,
			weight: 2.5,
			ewaybill_no: "",
			customer_gstin: "",
			invoice_number: "",
			order_type: "ESSENTIALS" // or "ESSENTIALS"/"NON ESSENTIALS" based on your case
		  };

		
		console.log("This data is being sent : ", customOrderData); 

        // Create custom order via Shiprocket API
        const createOrderConfig = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: customOrderData
        };

        // Sending the data to Shiprocket API to create the order
        const orderCreationResponse = await axios(createOrderConfig);

        console.log("Custom Order Creation Response:", orderCreationResponse.data);

        // Sending the response back to the client
        res.status(200).json({
            message: "Order details fetched and custom order created successfully",
            orderID: oid,
            orderStatus: ost,
            data: orderCreationResponse.data
        });
    } catch (error) {
        console.error("Error fetching order details or creating custom order:", error );
        res.status(500).json({ error: "Failed to fetch order details or create custom order" });
    }
});

function formatOrderDate(dateString) {
  // Create a new Date object from the input string
  const date = new Date(dateString);

  // Extract the year, month, day, hours, and minutes
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, so add 1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // Format the date as "yyyy-mm-dd hh:mm"
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}


app.route("/product/:productId")
	.get(async (req, res) => {
		try {
			const product = await Product.findById(req.params.productId);
			if (!product)
				return res
					.status(404)
					.json({ success: false, message: "Product not found" });
			res.status(200).json({ success: true, product });
		} catch (error) {
			res.status(500).json({ success: false, message: error.message });
		}
	})
	.delete(async (req, res) => {
		try {
			const result = await Product.findByIdAndDelete(req.params.productId);
			if (!result)
				return res
					.status(404)
					.json({ success: false, message: "Product not found" });
			res
				.status(200)
				.json({ success: true, message: "Product deleted successfully" });
		} catch (error) {
			res.status(500).json({ success: false, message: error.message });
		}
	});

// Order Routes
app.get("/orders", async (req, res) => {
	try {
		const orders = await Order.find().populate("productIds");
		res.status(200).json({ success: true, orders });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// Initialize MONGODB
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => {
		console.log("Connected to MongoDB");
		const PORT = process.env.PORT || 5000;
		app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err);
		process.exit(1); // Exit the process if DB connection fails
	});
