# Correção do enquadramento mobile

As três cenas usam os vídeos verticais fornecidos (1080×1920), por meio das sequências `mobile-native` de 720×1280. A origem foi confirmada no navegador: nenhum recurso `desktop-native` foi solicitado nos perfis retrato de 320×568 e 390×844.

O recorte adicional vinha do preenchimento `cover` do canvas. Em 390×844, ele excluía aproximadamente 18% da largura da fonte vertical. O mobile agora mostra o quadro completo, mantendo a proporção original. O espaço excedente usa o fundo escuro do site; nenhuma faixa branca ou gradiente sobre a mídia foi acrescentado. Os closes e movimentos de câmera que já existem nos vídeos originais permanecem.

O poster inicial, o fallback e o modo leve foram alinhados ao mesmo enquadramento. O modo leve em retrato não aplica mais a ampliação decorativa. O desktop mantém sua composição anterior, e as cores originais continuam preservadas.

Validações executadas:

- Build estático, lint e TypeScript passaram; 27 testes unitários passaram.
- Novo teste geométrico prova que a fonte inteira permanece dentro do canvas mobile, sem distorção; outro preserva o `cover` desktop anterior.
- `qa-mobile-framing.mjs` confirmou as três fontes verticais, o ajuste completo, ausência de recursos desktop nos celulares, ausência de overflow e de escurecimento.
- Revisão visual das cenas e regressão mobile em dez viewports: avanço/retorno, altura dinâmica, orientação, modo leve e reduced motion passaram, sem erros JS/HTTP nos casos executados.
- Evidências de perfil: `docs/framing/profile-checks.json`; capturas locais em `docs/review`.

Auditoria Lighthouse desta revisão: desempenho mobile 80 e 75 em duas amostras, desktop 95; acessibilidade e boas práticas 100. SEO 66 por `noindex` intencional. A meta mobile de 85 não foi atingida; o LCP passou a identificar o fundo da cena inicial. Isso permanece como limitação de carregamento a investigar, sem alegar que a pontuação anterior de 98 se mantém. Medições desta revisão estão em `docs/framing/performance-summary.json`; `docs/metrics-summary.json` e o manifesto visual geral pertencem à revisão anterior.

Prévia: http://127.0.0.1:3002/ . Aparelhos Android/iOS físicos não foram testados. Os números de latência em LATENCIA.md pertencem à revisão anterior; o transporte, a quantidade de quadros e o agendamento foram preservados nesta correção de enquadramento.
