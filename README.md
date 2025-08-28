# Inksa Restaurantes - Portal do Restaurante

Sistema de gestão para restaurantes da plataforma Inksa.

## Configuração de Ambiente

### Variáveis de Ambiente

Para configurar o ambiente, copie o arquivo `.env.example` para `.env.local` e ajuste as URLs conforme necessário:

```bash
cp .env.example .env.local
```

#### Variáveis Obrigatórias

- **VITE_AUTH_API_URL**: URL do backend de autenticação
  - Exemplo para desenvolvimento: `http://localhost:5000`
  - Exemplo para produção: `https://inksa-auth-flask-dev.onrender.com`

### API de Autenticação

O sistema utiliza um backend separado para autenticação que deve estar configurado adequadamente:

#### Requisitos de CORS

Quando cookies são utilizados para autenticação, o frontend automaticamente envia credenciais com todas as requisições para a API de autenticação. O backend deve estar configurado para:

1. **Permitir credenciais**: `supports_credentials=True` ou `credentials=True`
2. **Configurar origins permitidos**: Incluir o domínio do frontend (ex: Vercel)
3. **Headers permitidos**: `Content-Type`, `Authorization`
4. **Métodos permitidos**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
5. **Configuração de cookies**: Quando aplicável, usar `SameSite=None; Secure` para cookies em produção

#### Endpoints de Autenticação

O sistema consome os seguintes endpoints:
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/register` - Registro de novo restaurante
- `POST /api/auth/logout` - Logout do usuário
- `POST /api/auth/forgot-password` - Recuperação de senha
- `POST /api/auth/reset-password` - Reset de senha
- `PUT /api/auth/profile` - Atualização de perfil

## Desenvolvimento

### Instalação

```bash
npm install
```

### Execução

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Solução de Problemas

### Erros de CORS

Se você receber erros relacionados a CORS:

1. Verifique se a variável `VITE_AUTH_API_URL` está configurada corretamente
2. Confirme se o backend está rodando e acessível
3. Verifique se o backend está configurado para aceitar credenciais e o domínio do frontend
4. Em desenvolvimento, certifique-se de que o backend permite `localhost` ou `127.0.0.1`

### Problemas de Conectividade

Se não conseguir conectar ao backend:

1. Verifique se o URL está correto no `.env.local`
2. Teste o endpoint diretamente no browser ou com ferramentas como curl/Postman
3. Verifique os logs do backend para identificar problemas de configuração