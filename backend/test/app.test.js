const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const appModule = require('../src/app');

let server;
let baseUrl;
let storageDirectory;

before(async () => {
  storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  const app = appModule.createApp({
    storageDirectory,
    maxFileSizeBytes: 10,
    identityMiddleware: (req, res, next) => {
      const userId = req.headers['x-test-user'];
      if (userId) req.user = { id: userId };
      next();
    },
  });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await fs.rm(storageDirectory, { recursive: true, force: true });
});

function userHeaders(userId) {
  return userId ? { 'x-test-user': userId } : {};
}

async function upload(userId, contents, filename = 'relatorio.txt') {
  const form = new FormData();
  form.append('file', new Blob([contents], { type: 'text/plain' }), filename);
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: userHeaders(userId),
    body: form,
  });
}

test('o app backend é exportado', () => {
  assert.equal(typeof appModule, 'function');
  assert.equal(typeof appModule.createApp, 'function');
});

test('faz upload, lista e baixa um documento', async () => {
  const uploadResponse = await upload('user-a', 'conteudo');
  assert.equal(uploadResponse.status, 201);
  const uploaded = await uploadResponse.json();
  assert.deepEqual(Object.keys(uploaded).sort(), [
    'id', 'originalName', 'owner', 'size', 'uploadedAt',
  ]);
  assert.equal(uploaded.originalName, 'relatorio.txt');
  assert.equal(uploaded.owner, 'user-a');
  assert.equal(uploaded.size, 8);
  assert.equal(Number.isNaN(Date.parse(uploaded.uploadedAt)), false);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: userHeaders('user-a'),
  });
  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), [uploaded]);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${uploaded.id}/download`,
    { headers: userHeaders('user-a') },
  );
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-type'), /^application\/octet-stream/);
  assert.equal(await downloadResponse.text(), 'conteudo');
  assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);
});

test('isola documentos por usuário e retorna 404 para documento alheio', async () => {
  const uploadResponse = await upload('owner-a', 'privado');
  const document = await uploadResponse.json();

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: userHeaders('owner-b'),
  });
  assert.deepEqual(await listResponse.json(), []);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: userHeaders('owner-b') },
  );
  assert.equal(downloadResponse.status, 404);
});

test('rejeita requisições sem identidade, sem arquivo e acima do limite', async () => {
  const unauthorized = await fetch(`${baseUrl}/documents`);
  assert.equal(unauthorized.status, 401);

  const missingFile = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: userHeaders('user-a'),
  });
  assert.equal(missingFile.status, 400);

  const oversized = await upload('user-a', '12345678901');
  assert.equal(oversized.status, 413);
});
