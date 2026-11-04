# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, mantendo os arquivos no filesystem local da aplicação e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Enviar um documento por requisição.
- Listar os documentos associados ao usuário solicitante.
- Baixar um documento pelo identificador, respeitando a propriedade.
- Registrar metadados em memória durante a execução do processo.
- Gravar arquivos em `backend/storage` usando Multer com `diskStorage`.
- Disponibilizar interface React para upload, listagem e download.

### Fora do escopo

- Armazenamento em nuvem ou em serviços externos.
- Versionamento, edição, exclusão e compartilhamento de documentos.
- Persistência durável dos metadados ou banco de dados.
- Cadastro, autenticação e recuperação de credenciais de usuários.
- Busca avançada, paginação e categorização de documentos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema aceita um arquivo enviado como `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema grava o conteúdo no armazenamento local usando Multer com `diskStorage`. |
| RF-03 | O servidor gera identificador único e nome interno que não depende do nome enviado pelo usuário. |
| RF-04 | O sistema registra os metadados em memória após o upload bem-sucedido. |
| RF-05 | O sistema lista somente documentos pertencentes ao usuário da requisição. |
| RF-06 | O sistema permite baixar pelo identificador somente documentos pertencentes ao usuário da requisição. |
| RF-07 | O sistema retorna erro apropriado quando falta arquivo, o arquivo excede o limite ou o documento não existe/não pertence ao usuário. |
| RF-08 | A interface permite enviar arquivo, consultar documentos e iniciar downloads. |
| RF-09 | A interface apresenta estados de carregamento e mensagens de erro ou sucesso. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos ficam em `backend/storage`; não usar armazenamento externo. |
| RNF-02 | Os metadados ficam em memória e podem ser perdidos quando o processo reiniciar. |
| RNF-03 | A porta e o limite de upload são configurados por variáveis de ambiente. |
| RNF-04 | `MAX_FILE_SIZE_BYTES` define o limite; o padrão é 10 MiB. |
| RNF-05 | O nome original é metadado não confiável; não define o caminho físico. |
| RNF-06 | A API não expõe o nome interno nem o caminho local do arquivo. |
| RNF-07 | Erros e metadados são JSON; downloads retornam conteúdo binário. |
| RNF-08 | O backend segue `routes -> controllers -> services -> repositories`. |
| RNF-09 | O frontend usa `fetch` pelo prefixo `/api`; o proxy de desenvolvimento do Vite direciona ao backend. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | UUID gerado pelo servidor. |
| `originalName` | string | Nome original tratado como nome de arquivo, sem diretórios. |
| `size` | number | Tamanho em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601 UTC. |
| `owner` | string | Identificador do usuário autenticado. |
| `storageName` | string | Nome interno usado para localizar o arquivo; não exposto pela API. |

O repositório em memória indexa registros por `id`. `storageName` referencia o arquivo local. O registro é criado somente após a gravação do arquivo concluir com sucesso.

## 6. Contratos de API

As rotas do backend não incluem prefixo. No frontend de desenvolvimento, `/api` é removido pelo proxy do Vite.

### Identidade

As rotas de documentos exigem um middleware de identidade confiável que disponibilize `req.user.id` como string não vazia. O app não implementa autenticação; a integração responsável por criar esse contexto deve ser fornecida pelo ambiente que monta o app. Sem identidade, as rotas retornam `401`. A API não confia em `owner` enviado pelo cliente nem em cabeçalho arbitrário.

### `POST /upload`

- Entrada: `multipart/form-data` com campo obrigatório `file`.
- O proprietário é obtido de `req.user.id`.
- Sucesso: `201 Created`.

Exemplo de resposta:

```json
{
  "id": "uuid",
  "originalName": "relatorio.pdf",
  "size": 2048,
  "uploadedAt": "2026-11-04T12:00:00.000Z",
  "owner": "user-123"
}
```

### `GET /documents`

- Lista somente documentos do usuário autenticado.
- Sucesso: `200 OK`; retorna `[]` quando não houver documentos.
- Ordenação: mais recentes primeiro.

### `GET /documents/:id/download`

- Baixa documento pertencente ao usuário autenticado.
- Sucesso: `200 OK`, corpo binário e `Content-Disposition: attachment` com o nome original tratado.
- Documento ausente ou de outro usuário: `404 Not Found`, sem revelar a existência de documentos de terceiros.

### Erros

Formato:

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "O arquivo excede o tamanho máximo permitido."
  }
}
```

| Status | Uso |
| --- | --- |
| `400 Bad Request` | Arquivo ausente ou requisição de upload inválida. |
| `401 Unauthorized` | Contexto de usuário ausente ou inválido. |
| `404 Not Found` | Documento inexistente ou não pertencente ao usuário. |
| `413 Payload Too Large` | Arquivo acima do limite configurado. |
| `500 Internal Server Error` | Falha inesperada de leitura, gravação ou processamento. |

## 7. Decisões arquiteturais e riscos

- Backend Express/CommonJS; rotas delegam a controllers, controllers chamam services e services usam repositories.
- Multer com `diskStorage` grava em `backend/storage`, com nome interno UUID. Nenhum provedor externo é usado.
- Repositório em memória para metadados; reiniciar o processo perde registros, embora os arquivos possam permanecer no disco.
- O app recebe middleware de identidade como dependência de composição; não implementa login ou autenticação.
- Frontend React encapsula chamadas HTTP em `frontend/src/services/`, usando `fetch` e `/api`.
- Se o registro de metadados falhar após a gravação do arquivo, o serviço tenta remover o arquivo para evitar órfãos.
- Nomes, caminhos e identificadores do cliente não são considerados confiáveis; caminhos físicos não são retornados.
- A perda dos metadados pode tornar arquivos locais inacessíveis pela API após reinício; isso é uma limitação aceita nesta fase.

## 8. Plano de execução

1. Aprovar esta especificação e integrar middleware confiável que preencha `req.user.id` no ambiente de execução.
2. Implementar repositórios para metadados em memória e arquivos locais, além do serviço de documentos; validar armazenamento, propriedade, limite e limpeza de falhas.
3. Implementar controllers e rotas para upload, listagem e download, com erros HTTP padronizados e identidade obrigatória.
4. Testar upload, arquivo ausente/limite excedido, listagem vazia, isolamento por usuário, download e documento inexistente com `node:test`.
5. Implementar serviço `fetch` e componentes React de upload, listagem e download; exibir carregamento, vazio e erros.
6. Validar build do frontend e integração ponta a ponta, incluindo persistência local do arquivo e limitação de metadados em memória.

O plano descreve etapas de implementação; a execução deve ser validada com os scripts de teste do backend e build do frontend.