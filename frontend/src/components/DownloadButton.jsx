export default function DownloadButton({ busy, onClick }) {
  return (
    <button
      className="download-button"
      type="button"
      aria-label={busy ? 'Baixando documento' : 'Baixar documento'}
      title="Baixar documento"
      disabled={busy}
      onClick={onClick}
    >
      <span aria-hidden="true">{busy ? '…' : '↓'}</span>
    </button>
  );
}