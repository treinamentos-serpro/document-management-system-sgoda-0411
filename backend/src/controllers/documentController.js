function getOwner(req, res) {
  const owner = req.user?.id;
  if (typeof owner !== 'string' || owner.trim() === '') {
    res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Autenticação necessária.' },
    });
    return null;
  }

  return owner;
}

function createDocumentController(documentService) {
  return {
    async upload(req, res, next) {
      const owner = getOwner(req, res);
      if (!owner) return;
      if (!req.file) {
        res.status(400).json({
          error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
        });
        return;
      }

      try {
        const document = await documentService.createDocument(req.file, owner);
        res.status(201).json(document);
      } catch (error) {
        next(error);
      }
    },

    async list(req, res, next) {
      const owner = getOwner(req, res);
      if (!owner) return;

      try {
        res.json(await documentService.listDocuments(owner));
      } catch (error) {
        next(error);
      }
    },

    async download(req, res, next) {
      const owner = getOwner(req, res);
      if (!owner) return;

      try {
        const { document, filePath } = await documentService.getDownload(req.params.id, owner);
        res.download(filePath, document.originalName, {
          headers: { 'Content-Type': 'application/octet-stream' },
        }, (error) => {
          if (error && !res.headersSent) next(error);
        });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = createDocumentController;