# BRASA BURGER

Landing page demonstrativa ZMT em Next.js, React, GSAP e Canvas. Três cenas reversíveis, seleção ilustrativa, delivery demonstrativo, encerramento e assinatura ZMT. Sem contatos, preços ou avaliações fictícias.

## Executar

```powershell
npm ci
npm run build
$env:PORT='3002'
npm start
```

Acesse http://127.0.0.1:3002/ . Build estático em `out/`.

## Verificar

```powershell
npm run lint
npm run typecheck
npm test
$env:QA_BASE_URL='http://127.0.0.1:3002'
npm run qa:mobile
npm run qa:composition -- after
npm run qa:chrome -- after
npm run qa:defaults
node scripts/qa-brasa.mjs
```

As suítes de navegador usam o Playwright já disponível neste computador e Edge headless. Para outro ambiente, configure PLAYWRIGHT_PATH nas suítes do starter e ajuste o caminho em qa-brasa.mjs. Não há instalação automática de navegador. As capturas e logs brutos ficam locais em docs e estão excluídos do Git.

## Mídias e publicação

`docs/media-map.json` registra todos os nomes reais, dimensões, duração e derivados. `scripts/prepare-media.mjs <pasta-dos-originais>` regenera os arquivos otimizados sem alterar originais. O site entregue usa derivados locais, sem depender da pasta de origem.

Consulte ENTREGA.md e PUBLICACAO.md. Prévia noindex; domínio/canonical/sitemap e canais comerciais pendentes. Nenhum commit, push, repositório remoto ou deploy foi realizado. Não publicar automaticamente.
