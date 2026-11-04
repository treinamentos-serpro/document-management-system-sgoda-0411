import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/documents.js';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    listDocuments()
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleUpload(file) {
    setUploading(true);
    setError('');
    setNotice('');

    try {
      const uploaded = await uploadDocument(file);
      setDocuments((current) => [uploaded, ...current]);
      setNotice('Documento enviado.');
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(documentItem) {
    setDownloadingId(documentItem.id);
    setError('');

    try {
      const file = await downloadDocument(documentItem.id);
      const objectUrl = URL.createObjectURL(file);
      const link = globalThis.document.createElement('a');
      link.href = objectUrl;
      link.download = documentItem.originalName;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="workspace">
      <header className="page-header">
        <p className="eyebrow">ARQUIVO PESSOAL</p>
        <h1>Documentos</h1>
        <p className="page-intro">Envie e consulte seus arquivos em um só lugar.</p>
      </header>

      <section className="upload-section" aria-labelledby="upload-heading">
        <div className="section-heading">
          <div>
            <p className="section-index">01 / ENTRADA</p>
            <h2 id="upload-heading">Adicionar documento</h2>
          </div>
          <span className="section-mark" aria-hidden="true">+</span>
        </div>
        <UploadComponent onUpload={handleUpload} uploading={uploading} />
      </section>

      {(error || notice) && (
        <p className={`feedback ${error ? 'feedback-error' : 'feedback-success'}`} role={error ? 'alert' : 'status'}>
          {error || notice}
        </p>
      )}

      <section className="documents-section" aria-labelledby="documents-heading">
        <div className="section-heading documents-heading">
          <div>
            <p className="section-index">02 / ACERVO</p>
            <h2 id="documents-heading">Seus documentos</h2>
          </div>
          <span className="document-count">{documents.length.toString().padStart(2, '0')} itens</span>
        </div>
        <DocumentList
          documents={documents}
          loading={loading}
          downloadingId={downloadingId}
          onDownload={handleDownload}
        />
      </section>
    </main>
  );
}
