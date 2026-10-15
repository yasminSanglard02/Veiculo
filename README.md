# API REST de Gerenciamento de Veículos

Backend em **Node.js + Express + Knex** com banco **PostgreSQL (Neon)**, para cadastrar, consultar, atualizar e remover veículos de uma montadora (CRUD).

Disciplina: Programação cliente/servidor — Prof. Henique Barbosa (FAETERJ).
Nome do aluno: Yasmin Sanglard Xavier 

## Tecnologias

- Node.js
- Express
- Knex (query builder) + `pg`
- dotenv
- cors

## Estrutura do projeto

```
├── server.js                       # Inicializa o Express
├── knexfile.js                     # Configuração do Knex (client pg, SSL)
├── .env                            # Variáveis de ambiente (NÃO versionado)
├── .env.example                    # Modelo do .env
└── src
    ├── routes.js                   # Rotas
    ├── controllers
    │   └── controllerProd.js       # Validações e regras das rotas
    └── database
        └── db.js                   # Instância do Knex (acesso a dados)
```

## Como executar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env` na raiz (use o `.env.example` como modelo) com a `DATABASE_URL` informada no enunciado:

   ```
   DATABASE_URL='postgresql://usuario:senha@host/banco?sslmode=require&channel_binding=require'
   PORT=3000
   ```

3. Inicie o servidor:

   ```bash
   npm run dev     # desenvolvimento (reinicia ao salvar)
   npm start       # produção
   ```

O servidor sobe em `http://localhost:3000` (ou na porta definida em `PORT`).

## Banco de dados

Tabela `veiculos` (banco `banco`, no Neon):

| Coluna | Tipo | Restrições |
|---|---|---|
| id | SERIAL | PRIMARY KEY |
| modelo | VARCHAR(100) | NOT NULL |
| tipo_propulsao | tipo_propulsao_enum | NOT NULL |
| ano_modelo | SMALLINT | NOT NULL |
| autonomia_km | INT | opcional |
| capacidade_bateria_kwh | DECIMAL(6,2) | opcional |
| preco_base | DECIMAL(10,2) | NOT NULL |
| status_producao | status_producao_enum | NOT NULL, DEFAULT 'em_producao' |

Para consultar os valores válidos dos enums, rode no SQL Editor do Neon:

```sql
SELECT enum_range(NULL::tipo_propulsao_enum);
SELECT enum_range(NULL::status_producao_enum);
```

## Rotas

| Método | Rota | Descrição | Sucesso | Erros |
|---|---|---|---|---|
| GET | /veiculos | Lista todos | 200 + array | 500 |
| GET | /veiculos/:id | Busca por id | 200 + objeto | 400 (id inválido), 404 |
| POST | /veiculos | Cadastra | 201 + veículo criado | 400 (dados inválidos) |
| PUT | /veiculos/:id | Atualiza | 200 + veículo atualizado | 400, 404 |
| DELETE | /veiculos/:id | Remove | 204 (sem conteúdo) | 400 (id inválido), 404 |

### Corpo de POST e PUT

```json
{
  "modelo": "Modelo Exemplo",
  "tipo_propulsao": "hibrido",
  "ano_modelo": 2026,
  "autonomia_km": 450,
  "capacidade_bateria_kwh": 75.50,
  "preco_base": 189900.00,
  "status_producao": "em_producao"
}
```

- Obrigatórios: `modelo`, `tipo_propulsao`, `ano_modelo`, `preco_base`.
- Opcionais: `autonomia_km`, `capacidade_bateria_kwh` (aceitam nulo) e `status_producao` (se omitido, vale o padrão `em_producao`).
- No PUT, o corpo deve conter todos os campos obrigatórios.

### Validações e códigos HTTP

- `400`: campo obrigatório ausente, tipo inválido, id não numérico, JSON malformado ou valor fora do enum.
- `404`: id inexistente em GET, PUT e DELETE.
- `500`: erro inesperado do servidor.

Todas as consultas usam o Knex (`select`, `insert`, `update`, `del`), sem concatenar valores em SQL.

## Testes (Thunder Client)

Testes feitos com o Thunder Client, usando o banco do enunciado.

| # | Cenário | Requisição | Esperado |
|---|---|---|---|
| 1 | Listar (sucesso) | `GET /veiculos` | 200 + array |
| 2 | Cadastrar (sucesso) | `POST /veiculos` com corpo completo | 201 + objeto com `id` |
| 3 | Cadastrar sem status | `POST /veiculos` sem `status_producao` | 201 + `status_producao: "em_producao"` |
| 4 | Cadastrar (erro) | `POST /veiculos` sem `modelo` | 400 |
| 5 | Cadastrar enum inválido | `POST /veiculos` com `tipo_propulsao: "xyz"` | 400 |
| 6 | Buscar por id (sucesso) | `GET /veiculos/9` (id existente) | 200 + objeto |
| 7 | Buscar por id (erro) | `GET /veiculos/9999` | 404 |
| 8 | Atualizar (sucesso) | `PUT /veiculos/:id` com corpo completo | 200 + objeto atualizado |
| 9 | Atualizar (erro) | `PUT /veiculos/9999` | 404 |
| 10 | Remover (sucesso) | `DELETE /veiculos/:id` | 204 |
| 11 | Remover (erro) | `DELETE /veiculos/9999` | 404 |
| 12 | Id inválido | `GET /veiculos/abc` | 400 |

### Resultados

### GET /veiculos
![GET lista - 200](prints/01-get-lista-200.png)

### GET /veiculos/:id
![GET por id - 200](prints/02-get-id-200.png)
![GET id inexistente - 404](prints/03-get-id-inexistente-404.png)
![GET id inválido - 400](prints/04-get-id-invalido-400.png)

### POST /veiculos
![POST sucesso - 201](prints/05-post-sucesso-201.png)
![POST sem modelo - 400](prints/06-post-sem-modelo-400.png)
![POST enum inválido - 400](prints/07-post-enum-invalido-400.png)

### PUT /veiculos/:id
![PUT sucesso - 200](prints/08-put-sucesso-200.png)
![PUT id inexistente - 404](prints/09-put-inexistente-404.png)

### DELETE /veiculos/:id
![DELETE sucesso - 204](prints/10-delete-sucesso-204.png)
![DELETE id inexistente - 404](prints/11-delete-inexistente-404.png)

## Observações

- O arquivo `.env` contém credenciais e está no `.gitignore`; não deve ser enviado ao GitHub. A pasta `node_modules` também é ignorada.
