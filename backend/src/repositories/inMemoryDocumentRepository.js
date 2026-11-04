class InMemoryDocumentRepository {
  constructor() {
    this.documents = new Map();
  }

  async save(document) {
    this.documents.set(document.id, { ...document });
    return { ...document };
  }

  async findById(id) {
    const document = this.documents.get(id);
    return document ? { ...document } : null;
  }

  async findByOwner(owner) {
    return [...this.documents.values()]
      .filter((document) => document.owner === owner)
      .map((document) => ({ ...document }));
  }
}

module.exports = InMemoryDocumentRepository;