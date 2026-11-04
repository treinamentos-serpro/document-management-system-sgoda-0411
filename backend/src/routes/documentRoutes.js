const { randomUUID } = require('node:crypto');
const multer = require('multer');
const express = require('express');

function requireIdentity(req, res, next) {
  if (typeof req.user?.id !== 'string' || req.user.id.trim() === '') {
    res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Autenticação necessária.' },
    });
    return;
  }

  next();
}

function createDocumentRoutes(controller, fileRepository, maxFileSizeBytes) {
  const router = express.Router();
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, callback) => {
        fileRepository.ensureDirectory()
          .then(() => callback(null, fileRepository.storageDirectory))
          .catch(callback);
      },
      filename: (req, file, callback) => callback(null, randomUUID()),
    }),
    limits: { fileSize: maxFileSizeBytes },
  });

  router.post('/upload', requireIdentity, upload.single('file'), controller.upload);
  router.get('/documents', requireIdentity, controller.list);
  router.get('/documents/:id/download', requireIdentity, controller.download);

  return router;
}

module.exports = createDocumentRoutes;