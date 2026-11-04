import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, loading, downloadingId, onDownload }) {
  if (loading) {
    return <p className="list-state" role="status">Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return <p className="list-state">Nenhum documento enviado ainda.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Enviado em</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((documentItem) => (
            <tr key={documentItem.id}>
              <td className="document-name">{documentItem.originalName}</td>
              <td>{formatSize(documentItem.size)}</td>
              <td>{formatDate(documentItem.uploadedAt)}</td>
              <td className="action-cell">
                <DownloadButton
                  busy={downloadingId === documentItem.id}
                  onClick={() => onDownload(documentItem)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}