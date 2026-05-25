const express=require("express");
const router=express.Router();
const upload=require("../../middleware/upload");
const { defaultApiLimiter } = require("../../validators/RateLimiter");


router.post("/upload",
    defaultApiLimiter,
    upload.single("image"),
    
)