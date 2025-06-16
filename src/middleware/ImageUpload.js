const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware for uploading image to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'auto',
      folder: 'localbliz', // You can customize the folder name
    });
    // Add cloudinary url to req.body
    req.body.imageUrl = result.secure_url;
    req.body.cloudinaryId = result.public_id;

    next();
  } catch (error) {
    console.error('Error uploading to cloudinary:', error);
    res.status(500).json({ error: 'Error uploading image' });
  }
};
//middleware will take multiple field names and upload multiple files to Cloudinary
const handleUploadMultipleFiles = (fieldNames) => {
  return [
    upload.fields(
      fieldNames.map(name => ({
        name,
        maxCount: 1
      }))
    ),

    async (req, res, next) => {
      try {


        const fileUploads = {};

        // Parse JSON fields from form data
        Object.keys(req.body).forEach(key => {
          try {
            req.body[key] = JSON.parse(req.body[key]);
          } catch (e) {
            // If parsing fails, keep the original value
          }
        });

        // Initialize all fields with null
        fieldNames.forEach(fieldName => {
          fileUploads[fieldName] = null;
        });

        if (!req.files || Object.keys(req.files).length === 0) {
          console.log('No files found in request');
          req.body = {
            ...req.body,
            ...fileUploads
          };
          return next();
        }

        for (const fieldName of fieldNames) {
          const file = req.files[fieldName]?.[0];
          if (!file) {
            console.log(`No file found for field: ${fieldName}`);
            continue;
          }

          const base64 = Buffer.from(file.buffer).toString('base64');
          const dataURI = `data:${file.mimetype};base64,${base64}`;

          const result = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'auto',
            folder: 'localbliz',
          });

          fileUploads[fieldName] = result.secure_url;
        }

        req.body = {
          ...req.body,
          ...fileUploads
        };

        next();
      } catch (error) {
        console.error('Error uploading files to Cloudinary:', error);
        res.status(500).json({ error: 'Error uploading images' });
      }
    }
  ];
};




// Create middleware that combines multer upload and cloudinary upload
const handleImageUpload = (fieldName) => {
  return [
    upload.single(fieldName),
    uploadToCloudinary
  ];
};

module.exports = {
  handleImageUpload,
  handleUploadMultipleFiles,
};
