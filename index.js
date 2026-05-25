require("module-alias/register");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDb = require("./config/mongodb");
const router = require("./config/routes");
const morgan = require("morgan");

dotenv.config();

const app = express();

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  }),
);

// Handle preflight requests
app.options(/(.*)/, cors());

app.use(express.json());

app.use("/uploads", express.static("uploads")); // makes my uploaded files accessible from the browser
console.log("come here");
app.use("/api", router);

connectDb();

module.exports = app;
