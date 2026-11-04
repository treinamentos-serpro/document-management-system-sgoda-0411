const createDocumentUploadService = require('./documentUploadService');
const createDocumentListService = require('./documentListService');
const createDocumentDownloadService = require('./documentDownloadService');

function createDocumentService(documentRepository, fileRepository) {
  return {
    ...createDocumentUploadService(documentRepository, fileRepository),
    ...createDocumentListService(documentRepository),
    ...createDocumentDownloadService(documentRepository, fileRepository),
  };
}

module.exports = createDocumentService;