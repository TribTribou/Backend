const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    console.log('image postée0')
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    console.log('image postée')
    callback(null, name + Date.now() + '.' + extension);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(new Error('Le fichier n\'est pas une image!'), false);
    }
  }
}).single('image');

const optimizeImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const optimizedImagePath = req.file.path.replace(/\.\w+$/, '_optimized.jpg');
  sharp(req.file.path)
    .resize({ width: 535 })
    .toFile(optimizedImagePath, (err, info) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de l\'optimisation de l\'image.' });
      }

      // Supprimer l'image d'origine après optimisation
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error(unlinkErr);
        }
        req.file.path = optimizedImagePath;
        next();
      });
    });
};


module.exports = {
  upload: upload,
  optimizeImage: optimizeImage
};