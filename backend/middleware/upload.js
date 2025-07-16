const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const coverDir = 'uploads/cover-pages/';
const assetDir = 'uploads/asset-files/';
const profileDir = 'uploads/profile-images/';
const userCoverDir = 'uploads/user-cover-images/';
ensureDir(coverDir);
ensureDir(assetDir);
ensureDir(profileDir);
ensureDir(userCoverDir);

// Ensure upload directories exist
const showcaseDir = 'uploads/showcase-images/';
ensureDir(showcaseDir);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'coverPage') {
      cb(null, coverDir);
    } else if (file.fieldname === 'assetFile') {
      cb(null, assetDir);
    } else if (file.fieldname === 'profileImage') {
      cb(null, profileDir);
    } else if (file.fieldname === 'userCoverImage') {
      cb(null, userCoverDir);
    } else if (file.fieldname === 'showcaseImages') {
      cb(null, showcaseDir);
    } else {
      cb(null, 'uploads/other/');
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'coverPage' || file.fieldname === 'profileImage' || file.fieldname === 'userCoverImage' || file.fieldname === 'showcaseImages') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File must be an image.'), false);
    }
  } else {
    // Allow any file type for assetFile
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

module.exports = upload; 