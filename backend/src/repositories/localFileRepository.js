const fs = require('node:fs/promises');
const path = require('node:path');

class LocalFileRepository {
  constructor(storageDirectory) {
    this.storageDirectory = path.resolve(storageDirectory);
  }

  async ensureDirectory() {
    await fs.mkdir(this.storageDirectory, { recursive: true });
  }

  resolvePath(storageName) {
    if (!storageName || path.basename(storageName) !== storageName) {
      throw new Error('Nome de armazenamento inválido.');
    }

    const filePath = path.resolve(this.storageDirectory, storageName);
    if (!filePath.startsWith(`${this.storageDirectory}${path.sep}`)) {
      throw new Error('Caminho de armazenamento inválido.');
    }

    return filePath;
  }

  async getPath(storageName) {
    const filePath = this.resolvePath(storageName);
    await fs.access(filePath);
    return filePath;
  }

  async remove(storageName) {
    try {
      await fs.unlink(this.resolvePath(storageName));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

module.exports = LocalFileRepository;