const { randomUUID } = require('node:crypto');
const path = require('node:path');

class DocumentNotFoundError extends Error {
  constructor() {
    super('Documento não encontrado.');
    this.name = 'DocumentNotFoundError';
  }
}

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

function createDocumentService(documentRepository, fileRepository) {
  return {
    async createDocument(file, owner) {
      const originalName = path.basename(file.originalname.replace(/\\/g, '/'));
      const document = {
        id: randomUUID(),
        originalName,
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

    async listDocuments(owner) {
      const documents = await documentRepository.findByOwner(owner);
      return documents
        .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
        .map(toPublicDocument);
    },

    async getDownload(id, owner) {
      const document = await documentRepository.findById(id);
      if (!document || document.owner !== owner) {
        throw new DocumentNotFoundError();
      }

      try {
        const filePath = await fileRepository.getPath(document.storageName);
        return { document: toPublicDocument(document), filePath };
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new DocumentNotFoundError();
        }
        throw error;
      }
    },
  };
}

module.exports = createDocumentService;