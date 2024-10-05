import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, retries = 3) => {
  try {
    if (!localFilePath) return null;

    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
    // console.log("File has been uploaded successfully", response.url);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (err) {
    if (retries > 0) {
      await uploadOnCloudinary(localFilePath, retries - 1); // if failed to upload request again
    }

    fs.unlinkSync(localFilePath); // remove the temporary file from the filesystem as the upload got failed
  }
};

const deleteInCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) {
      return null;
    }
    const publicId = extractPublicId(fileUrl);
    if (!publicId) {
      return null;
    }

    let resourceType = "image"; // Default to image
    if (fileUrl.match(/\.(mp4|mkv|mov|avi)$/)) {
      resourceType = "video";
    } else if (fileUrl.match(/\.(mp3|wav)$/)) {
      resourceType = "raw"; // For audio or other file types
    }

    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return res;
  } catch (error) {
    return null;
  }
};

export { uploadOnCloudinary, deleteInCloudinary };
