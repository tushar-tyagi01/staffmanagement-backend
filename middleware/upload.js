const multer=require("multer");
const path=require("path");

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"uploads/"); // local folder
    },
    filename:(req,file,cb)=>{
        const ext=path.extname(file.originalname);
        const name=Date.now()+"-"+Math.round(Math.random() * 1e9)+ext;
        cb(null,name);
    },
});

// allow only images

const  fileFilter=(req,file,cb)=>{
    if(file.mimetype.startsWith("image/")){
        cb(null,true);
    }
    else{
        cb(new Error("Only images are allowed"),false);
    }
};

const upload=multer({
   storage,
   fileFilter,
   limits:{
    fileSize:2*1024*1024,
   }
});

module.exports=upload;