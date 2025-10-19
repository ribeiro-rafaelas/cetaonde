const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(
      file.originalname || ''
    )}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMime.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error('Formato de imagem nao suportado.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = {
  upload,
  uploadsDir,
  singlePhotoUpload: (req, res, next) => {
    const handler = upload.single('photo');
    handler(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError || err.message) {
          res.status(400).json({
            success: false,
            errors: [err.message || 'Falha ao processar upload de imagem.']
          });
          return;
        }
        next(err);
        return;
      }
      next();
    });
  }
};
