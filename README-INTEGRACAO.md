# lêBrasil — integração local

## O que foi encontrado

O ZIP de origem contém 13 páginas HTML, mas não contém os arquivos referenciados de CSS, imagens, `FRONTEND/SCRIPTS/script.js` ou `FRONTEND/PAGES/Livros/Modo_Leitura.js`. Também não contém um backend, `package.json` ou configuração de ambiente. O dump SQL define sete tabelas e não inclui registros nem declarações de chaves estrangeiras.

Os arquivos de integração adicionados aqui criam uma API Node.js/Express e conectam cadastro, login, perfil, biblioteca pessoal e progresso de leitura ao MySQL. O visual original não foi redesenhado. As páginas CSS/imagens que não foram entregues não podem ser restauradas a partir do HTML.

## Requisitos

- Node.js 18 ou superior.
- MySQL 8, por exemplo o serviço MySQL instalado com WampServer.
- Banco `mydb` criado/importado a partir do dump recebido.

## Configuração

1. Abra o terminal nesta pasta do projeto.
2. Execute `npm install`.
3. Copie `.env.example` para `.env`.
4. Ajuste `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` para sua instalação. Não coloque o `.env` no Git.
5. Gere um segredo forte para `JWT_SECRET` (mínimo 32 caracteres), substituindo o valor de exemplo.
6. Antes da migração, faça backup do banco atual. Depois, execute `database/migrations/001_integracao_segura.sql` no banco `mydb`. Ela aumenta o tamanho das colunas de senha para permitir hashes bcrypt, remove índices únicos indevidos de senha e permite títulos repetidos entre usuários. A migração não apaga tabelas nem registros e deve ser executada uma vez.
7. Inicie com `npm start`.
8. Acesse `http://127.0.0.1:3000/PaginaInicial.html` ou as páginas individuais. A API deve responder em `http://127.0.0.1:3000/api/health`.

> Se seu MySQL estiver em outra porta, ajuste `DB_PORT`. Não é necessário colocar a senha do MySQL no frontend ou no Insomnia.

## Rotas implementadas

| Método | Rota | Autenticação | Função |
|---|---|---|---|
| GET | `/api/health` | Não | Verifica API e conexão MySQL |
| POST | `/api/auth/register` | Não | Cadastra usuário, nível e ranking inicial |
| POST | `/api/auth/login` | Não | Autentica e devolve token JWT |
| GET | `/api/me` | Bearer token | Consulta o usuário autenticado |
| GET | `/api/books` | Bearer token | Lista livros do usuário |
| POST | `/api/books` | Bearer token | Adiciona livro à biblioteca do usuário |
| PATCH | `/api/books/:id/progress` | Bearer token | Atualiza progresso de 0 a 100 |
| GET | `/api/ranking` | Bearer token | Consulta ranking armazenado no banco |

Respostas de erro são JSON no formato `{"erro":"mensagem"}`. O token é enviado no cabeçalho `Authorization: Bearer <token>`.

## Insomnia

Importe `insomnia/lebrasil-insomnia.json` pelo menu de importação do Insomnia. O ambiente usa `base_url` e `token`; depois do login, copie o token retornado para a variável `token`. As requisições de cadastro usam dados de exemplo: altere e não use dados pessoais reais em ambientes compartilhados.

## Limitações importantes

- O banco real não estava acessível neste ambiente e não foi possível confirmar credenciais, executar a migração ou provar a persistência em MySQL.
- O ZIP não contém os CSS, imagens, nem os arquivos JavaScript originais além das páginas HTML. Foram adicionados os scripts ausentes que são referenciados por caminho, mas não é possível validar ou preservar os estilos e comportamentos que dependem dos arquivos não enviados.
- O esquema fornecido não possui tabela de redações, então o salvamento de redações não foi simulado nem exposto como endpoint.
- O cadastro gera IDs para se adequar ao esquema legado, que não declara `AUTO_INCREMENT`. O bloqueio MySQL `GET_LOCK` serializa novos cadastros.
- As páginas de leitura salvam o progresso conforme a posição de rolagem da página. Esse cálculo é uma aproximação da leitura efetiva, não rastreamento de páginas lidas ou palavras compreendidas.
- O dump enviado não contém dados de usuários/livros; o estado atual do banco local precisa ser verificado separadamente antes de qualquer alteração.

## Testes que podem ser executados

- `npm run check` verifica a sintaxe dos arquivos JavaScript.
- `GET /api/health` deve retornar `200` e `{"status":"ok","api":"leBrasil","banco":"conectado"}` quando a API e o MySQL estiverem acessíveis.
- Teste cadastro/login e, usando o token retornado, consulte `/api/me`, `/api/books`, adicione um livro e atualize seu progresso.
- Erros de validação devem retornar `400`; credenciais inválidas `401`; conflitos `409`; registro ausente `404`.

Nenhum teste de integração com MySQL deve ser considerado aprovado até que seja executado no ambiente com o serviço e credenciais reais.


## Revisão de integração (21/10/2026)

### Ajustes aplicados nesta revisão

- O cadastro da API agora exige `confirmarSenha`, alinhado ao formulário e à coleção do Insomnia.
- A aquisição da conexão MySQL no cadastro passou a ficar dentro do tratamento de erros, evitando requisições sem resposta caso a conexão falhe.
- JSON malformado retorna HTTP 400 com mensagem JSON padronizada.
- O servidor não entrega por HTTP diretórios internos (`backend`, `database`, `insomnia`) nem arquivos de configuração/documentação do projeto.
- Foram implementadas as funções de navegação entre etapas, seleção de tema e contagem de palavras/caracteres na tela de redação.
- Os controles de aumento/redução da fonte nas páginas de leitura passaram a funcionar, e o rótulo de progresso é atualizado junto com a barra.
- A coleção do Insomnia foi validada sintaticamente como JSON.

### Verificações executadas nesta revisão

- `npm run check`: aprovado (verificação de sintaxe dos três arquivos JavaScript configurados).
- `node --check` nos arquivos do backend e frontend: aprovado.
- Coleção do Insomnia: JSON válido.
- Dump SQL: sete tabelas identificadas; as tabelas referenciadas pela migração existem no dump fornecido.

### Verificações não concluídas

A instalação das dependências com `npm install --no-audit --no-fund` excedeu o limite de execução deste ambiente. Por isso, não foi possível iniciar o servidor Express, abrir a aplicação no Chrome ou executar requisições HTTP reais. O MySQL local e suas credenciais também não estão disponíveis aqui; a migração SQL e a persistência real ainda precisam ser testadas no ambiente de execução do projeto. Os CSS e imagens ausentes no ZIP original continuam sendo uma limitação para a verificação visual.
