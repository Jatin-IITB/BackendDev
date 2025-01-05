import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises'; // Using promises-based fs module for async operations

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload a file to Cloudinary
const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
    try {
        if (!localFilePath) {
            throw new Error("No file path provided for upload.");
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
        });

        // Delete the local file after upload
        await fs.unlink(localFilePath);
        return response;
    } catch (error) {
        // Ensure local file is deleted even if upload fails
        if (await fs.access(localFilePath).then(() => true).catch(() => false)) {
            await fs.unlink(localFilePath);
        }
        console.error("Error uploading to Cloudinary:", error.message || error);
        throw new Error("Cloudinary upload failed. Please try again.");
    }
};

// Delete a file from Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
    try {
        if (!imageUrl) {
            throw new Error("No URL provided for deletion.");
        }

        // Extract the public ID from the URL
        const parts = imageUrl.split('/');
        const publicIdWithExtension = parts[parts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0]; // Remove file extension (e.g., .jpg)

        await cloudinary.uploader.destroy(publicId);
        console.log(`File with public ID ${publicId} deleted successfully from Cloudinary.`);
        return true;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error.message || error);
        throw new Error("Cloudinary deletion failed. Please try again.");
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
