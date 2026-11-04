const { toPublicDocument } = require('./documentPresenter');

class DocumentNotFoundError extends Error {
  constructor() {
    super('Documento não encontrado.');
    this.name = 'DocumentNotFoundError';
  }
}

function createDocumentDownloadService(documentRepository, fileRepository) {
  return {
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

module.exports = createDocumentDownloadService;