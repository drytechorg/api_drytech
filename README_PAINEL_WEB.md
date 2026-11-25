# Painel web no GitHub Pages

O GitHub Pages hospeda apenas o frontend estático. A API Express precisa continuar publicada em um servidor próprio.

## Configuração da API

Nas variáveis do serviço que hospeda a API, configure:

```env
MOCK_MODE=true
CORS_ORIGIN=https://SEU-USUARIO.github.io
ADMIN_USERNAME=seu-usuario-admin
ADMIN_PASSWORD=uma-senha-forte
JWT_SECRET=uma-chave-aleatoria-forte
```

Use a origem exata mostrada na barra do navegador, sem caminho final. Para um site de projeto, geralmente é `https://SEU-USUARIO.github.io`; não inclua `/nome-do-repositorio`. Se o painel for servido por mais de uma origem, separe-as por vírgula. Salve as variáveis e reinicie/reimplante a API.

## Acesso ao painel

Abra o endereço do GitHub Pages. No formulário, informe a URL base pública da API (por exemplo `https://minha-api.example.com`), sem `/api` no final, e use `ADMIN_USERNAME` e `ADMIN_PASSWORD`. A URL da API é salva neste navegador.

O login chama `POST /api/auth/login`. O painel usa o JWT retornado para editar o mock. O app deve ler `GET /api/mock/data` e pode assinar `GET /api/mock/events` para receber atualizações ao vivo. Alterações e reset exigem `Authorization: Bearer <token>`.

## Diagnóstico rápido de CORS

- `CORS_ORIGIN` precisa conter exatamente a origem do GitHub Pages (esquema HTTPS e hostname; sem rota).
- A URL base da API no painel precisa apontar para o host da API, não para `github.io`.
- Confira se `MOCK_MODE=true`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `JWT_SECRET` foram aplicados no serviço da API.
- Depois de mudar variáveis, reinicie/reimplante a API. O CORS não é configurado no GitHub Pages.
