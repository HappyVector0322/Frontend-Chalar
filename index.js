// Import routes
const connectDB = require("./config/db");

// Connect to MongoDB

const express = require("express");
const cors = require("cors");
const authRoute = require("./routes/authRoutes");
const emailRoute = require("./routes/emailRoutes");
const sendRoute = require("./routes/sendRoues");

const PORT =  3000;

const app = express();
connectDB();

// app.use(
//   cors({
//     origin: "*",
//   })
// );
app.use(cors({  
  origin: 'https://frontend-build-fawn.vercel.app',  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']  
}));  

app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/email", emailRoute);
app.use("/api/send", sendRoute);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
