const axios = require('axios');
const FormData = require('form-data');


const uploadToImgBB = async (imageBuffer, imageName) => {
    try {
        const apiKey = process.env.IMGBB_API_KEY;
        
        if (!apiKey) {
            throw new Error('IMGBB_API_KEY is not defined in environment variables');
        }

        // Convert buffer to base64
        const base64Image = imageBuffer.toString('base64');

        // Create form data
        const formData = new FormData();
        formData.append('key', apiKey);
        formData.append('image', base64Image);
        formData.append('name', imageName);

        // Upload to ImgBB
        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: formData.getHeaders()
        });

        if (response.data && response.data.success) {
            return response.data.data.url; // Return the image URL
        } else {
            throw new Error('Failed to upload image to ImgBB');
        }
    } catch (error) {
        console.error('ImgBB upload error:', error.response?.data || error.message);
        throw new Error(`Image upload failed: ${error.response?.data?.error?.message || error.message}`);
    }
};

module.exports = { uploadToImgBB };
