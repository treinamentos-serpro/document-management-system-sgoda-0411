const { randomUUID } = require('node:crypto');
const path = require('node:path');
const { toPublicDocument } = require('./documentPresenter');

function createDocumentUploadService(documentRepository, fileRepository) {
  return {
    async createDocument(file, owner) {
      const document = {
        id: randomUUID(),
        originalName: path.basename(file.originalname.replace(/\\/g, '/')),
        size: file.size,
        uploadedAt: new Date().toISOString(),
        owner,
        storageName: file.filename,
      };

      try {
        await documentRepository.save(document);
      } catch (error) {
        await fileRepository.remove(file.filename).catch(() => {});
        throw error;
      }

      return toPublicDocument(document);
    },
  };
}

module.exports = createDocumentUploadService;