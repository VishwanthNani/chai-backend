import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: "dd99zkkel", 
  api_key: "844596658534972", 
  api_secret: "YirFncGAt8gvVvvmo-GZ6meaYm0"
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            timeout: 120000  // Timeout set to 120 seconds
        });
        
        // File has been uploaded successfully
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.log(error);
        fs.unlinkSync(localFilePath); // Remove the locally saved temporary file as the upload operation failed
        return null;
    }
};

export { uploadOnCloudinary };
