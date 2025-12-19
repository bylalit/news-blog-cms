const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'news-images', // Cloudinary folder name
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [
            { width: 800, height: 500, crop: 'limit' }
        ]
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB
    }
});

module.exports = upload;
