import { useRef, useState } from 'react';

export default function UploadComponent({ onUpload, uploading }) {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || uploading) return;

    const uploaded = await onUpload(file);
    if (uploaded) {
      setFile(null);
      inputRef.current.value = '';
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="file-picker">
        <span className="file-picker-icon" aria-hidden="true">↥</span>
        <span className="file-picker-copy">
          <strong>{file ? file.name : 'Escolher arquivo'}</strong>
          <small>{file ? `${file.size.toLocaleString('pt-BR')} bytes` : 'Qualquer formato de arquivo'}</small>
        </span>
        <input
          ref={inputRef}
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>
      <button className="primary-button" type="submit" disabled={!file || uploading}>
        {uploading ? 'Enviando...' : 'Enviar documento'}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}