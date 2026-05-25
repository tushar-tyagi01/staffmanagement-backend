const mongoose=require("mongoose");

const connectDb=async()=>{
try{
    const connection=await mongoose.connect(process.env.DB_URL);
    console.log("Mongodb connected successfully");
}
catch(error){
   console.log("mongodb connection failed");
   console.error(error);
   process.exit(1);
}
};
module.exports=connectDb;