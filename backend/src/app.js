const express = require('express');
const path = require('node:path');
const InMemoryDocumentRepository = require('./repositories/inMemoryDocumentRepository');
const LocalFileRepository = require('./repositories/localFileRepository');
const createDocumentService = require('./services/documentService');
const createDocumentController = require('./controllers/documentController');
const createDocumentRoutes = require('./routes/documentRoutes');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function createApp(options = {}) {
  const maxFileSizeBytes = Number(
    options.maxFileSizeBytes ?? process.env.MAX_FILE_SIZE_BYTES ?? DEFAULT_MAX_FILE_SIZE_BYTES,
  );

  if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
    throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
  }

  const storageDirectory = options.storageDirectory
    || path.resolve(__dirname, '../storage');
  const identityMiddleware = options.identityMiddleware || ((req, res, next) => next());
  const documentRepository = new InMemoryDocumentRepository();
  const fileRepository = new LocalFileRepository(storageDirectory);
  const documentService = createDocumentService(documentRepository, fileRepository);
  const documentController = createDocumentController(documentService);
  const app = express();

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(identityMiddleware);
  app.use(createDocumentRoutes(documentController, fileRepository, maxFileSizeBytes));

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error.name === 'DocumentNotFoundError') {
      res.status(404).json({
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
      });
      return;
    }

    if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: { code: 'FILE_TOO_LARGE', message: 'O arquivo excede o tamanho máximo permitido.' },
      });
      return;
    }

    if (error.name === 'MulterError') {
      res.status(400).json({
        error: { code: 'INVALID_UPLOAD', message: 'Não foi possível processar o arquivo enviado.' },
      });
      return;
    }

    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro interno.' },
    });
  });

  return app;
}

const app = createApp();
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

app.createApp = createApp;
module.exports = app;
