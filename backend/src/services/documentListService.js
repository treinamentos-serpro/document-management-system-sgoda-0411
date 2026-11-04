const { toPublicDocument } = require('./documentPresenter');

function createDocumentListService(documentRepository) {
  return {
    async listDocuments(owner) {
      const documents = await documentRepository.findByOwner(owner);
      return documents
        .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
        .map(toPublicDocument);
    },
  };
}

module.exports = createDocumentListService;