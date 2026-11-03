# BRASA BURGER — entrega local

**APROVADO COM RESSALVAS para revisão local.** Três ciclos: implementação, composição/viewport e auditoria técnica com correções de semântica/posters. Não publicado. Não é certificação de fluidez em aparelhos físicos.

- Aplicativo: `C:\Users\micha\OneDrive\Documentos\ChatGPT\Hamburgueria\site-hamburgueria`.
- Raiz Git: `C:\Users\micha\OneDrive\Documentos\ChatGPT\Hamburgueria`.
- Prévia de produção: http://127.0.0.1:3002/ . Servidor local iniciado; para reabrir: `npm run build`, `$env:PORT='3002'`, `npm start` na pasta do aplicativo.

## Implementação

Hero com o hambúrguer pronto; preparo na chapa; ingredientes suspensos e montagem conforme o movimento real do material; cardápio visual com três composições; delivery demonstrativo por iFood/WhatsApp com feedback acessível local; encerramento “BATEU A FOME?”; rodapé demonstrativo e assinatura ZMT central aprovada. Identidade preta/cobre/âmbar, logotipo tipográfico com chama, favicon, fonte local e microinterações.

O scroll nativo controla três sequências de 80 quadros WebP por perfil. Descer avança, parar mantém o quadro e subir retrocede. Há crossfade entre cenas, cancelamento de requisições obsoletas, cache limitado, poster/fallback, modo leve opcional e preferência de movimento reduzido. Não há reprodução simultânea de vídeos fora da tela, áudio, contatos ou links comerciais fictícios.

## Mídias

Todos os nove arquivos foram inventariados em `docs/media-map.json`. Originais mantidos intactos na pasta fornecida. Seis vídeos, cada um com 7,93s e 24fps; pares desktop 1920×1080 e mobile 1080×1920. Não existem masters 4K no material recebido.

| Cena | Desktop | Mobile |
|---|---|---|
| Hero / pronto | `Double_cheeseburger_on_wooden_co…_5702425a_1080p.mp4` | `Double_burger_on_wooden_counter_1c4710e6_1080p.mp4` |
| Chapa | `Smash_burgers_frying_on_griddle_4322cb97_1080p.mp4` | `Smash_burgers_cooking_on_griddle_88a2d445_1080p.mp4` |
| Camadas | `Composição_publicitária_gastronômica_cinematográfica_em_9e392441_1080p.mp4` | `Double_burger_ingredients_assemb…_bd064d6e_1080p.mp4` |

Três PNGs 1672×941 geram as imagens `burger`, `layers` e `griddle` do cardápio/encerramento. Derivados locais: 480 WebPs, desktop 1920×1080 e mobile 720×1280, mais três imagens 1600×900. Ativos públicos totalizam aproximadamente 40,2 MB em disco; somente uma fração é carregada inicialmente. O site entregue não depende da pasta Downloads. A animação não inventa quadros de montagem ausentes nos originais.

## Build e testes executados

- `npm run build`: exportação estática passou. `npm run lint`: passou, sem avisos na verificação final. `npm run typecheck`: passou. `npm test`: 12 testes passaram.
- `qa:mobile`: dez viewports, ida/volta dos capítulos, saída/pular/retorno, altura dinâmica, orientação, canvas parado, modo leve, reduced motion; sem erros de console/HTTP ou overflow nos casos executados.
- `qa:composition after` e `qa:chrome after`: 36 capturas cada, três cenas em dez dimensões mobile e dois desktops. Suíte chrome repetida após ajustes relevantes de cabeçalho/controles.
- `qa:defaults`: assinatura ZMT, origem BRASA BURGER, fonte, links e responsividade passaram. Nenhuma mensagem externa foi enviada.
- `qa-brasa`: transições, gestos reversos, rota normal sem diagnóstico, CTAs locais, seções e reduced motion passaram. Revisão visual real de 63 capturas em 320×568, 390×844 e 1440×900; revisão final proporcional de entry/exit/reduced. Capturas equivalentes das áreas não afetadas foram reutilizadas.
- `qa-final-states`: hero, rodapé e reduced motion sem overflow/sobreposição em 320, 390 e 1440px. `qa-keyboard`: foco visível, pular conteúdo e botão de demonstração passaram.
- Smoke compartilhado `browser-regression`: 2 casos / 22 amostras, zero falhas, PASS_WITH_LIMITS em Chromium desktop. Validador de proveniência visual: PASS_WITH_LIMITS, 63 capturas e 16 gates declarados. O validador não substitui a inspeção visual.
- `check-client`: passou, sem dados/mídias herdados de clientes anteriores.

## Lighthouse final — laboratório

| Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| Mobile | 98 | 100 | 100 | 66 | 1,21s | 0,065 | 116,5ms |
| Desktop | 95 | 100 | 100 | 66 | 1,45s | 0,003 | 2,5ms |

Uma amostra final por perfil, Lighthouse 13.6.0 / Edge headless / loopback. Transferência inicial aproximada: 1,22 MB mobile e 1,93 MB desktop. Número de requisições e métricas exatas em `docs/metrics-summary.json`. Cache local de mídia: max-age=3600; demais recursos: no-cache. Não representa política de CDN. Scores têm variabilidade. Antes das correções, a primeira medição mobile foi 98/100/96/66; não há baseline anterior à criação.

SEO 66 é o resultado bruto: o `noindex` de demonstração foi mantido deliberadamente. Os demais itens SEO auditados passaram. Canonical e sitemap dependem de domínio aprovado. Não há schema de restaurante, avaliações, endereço ou analytics inventados. TBT não é INP; Core Web Vitals de campo, TLS/CDN e indexação de produção não foram verificados.

## Medição de scroll e limites

Nove ensaios com CPU ×4 cobriram completo, leve e atraso artificial de 150ms por quadro. Como o primeiro lote coincidiu com parte do build, as três amostras do modo completo foram repetidas isoladamente. No lote isolado: 33,1–46,0 RAF fps, p95 de intervalo 50,0–66,8ms; p95 do probe alvo→desenho exato 68,3–95,9ms, zero erros de mídia. Esses números incluem instrumentação e emulação; RAF não é a taxa física de apresentação. Há atraso perceptível sob carga e não se afirma 60fps constantes.

No estresse de rede, cerca de 82% das amostras ficaram mais de dois quadros atrás do alvo. Esse cenário artificial é uma limitação registrada, sem substituição silenciosa da experiência por posters. O modo leve permanece escolha do visitante. O smoke normal convergiu dentro do orçamento declarado de 1500ms após saltos frios; não é promessa de latência contínua nem INP.

Pendentes: Chrome Android físico, Safari iOS físico, barras reais do navegador, rede/dispositivo reais, memória/GPU, conferência de domínio/TLS e canais comerciais. A prévia emulada passou; experiência mobile física impecável não foi certificada. A referência pública indicada no briefing não pôde ser acessada pela ferramenta web e não foi tratada como evidência de aprovação.

## Oito pilares — cobertura

| Pilar | Resultado e limite |
|---|---|
| Direção criativa | Identidade gastronômica própria e composição revisada nos dois formatos. |
| Conteúdo | Narrativa e ingredientes coerentes com as mídias; sem preços inventados. |
| Credibilidade | Marca fictícia identificada; sem depoimentos/credenciais falsos. Prova social comercial não aplicável à demonstração. |
| Conversão | Exploração e delivery demo funcionais; canais reais pendentes. Link ZMT separado. |
| Mobile/cinematografia | Regressões e revisão emulada passaram; aparelhos físicos pendentes. |
| Performance | Metas Lighthouse, LCP e CLS passaram; atraso sob CPU/rede limitados explicitado. INP de campo não verificado. |
| SEO | Metadados e HTML reais; proteção noindex mantida. Produção pendente. |
| Acessibilidade/entrega | Lighthouse 100, teclado, foco, reduced motion e build passaram; não é certificação integral de conformidade. |

Sem nota agregada dos pilares: cobertura física, de campo e comercial é parcial. Evidências completas locais ficam em `docs/review`, `docs/mobile-*`, `docs/browser-regression` e relatórios Lighthouse; excluídas do Git por serem artefatos de QA. O resumo de métricas e o mapeamento de mídias estão preparados para versionamento.

## GitHub e próximos comandos

Branch local `master`, sem commits, sem `origin` e sem `main` paralela. Consulta ao conector GitHub retornou 404: `site-hamburgueria` ausente ou inacessível à conexão. Não foi criado repositório remoto. Não houve commit, push ou deploy, inclusive Cloudflare Pages.

Os comandos exatos de criação pública e envio para `origin/master`, para execução somente após aprovação, estão em **PUBLICACAO.md**. O aplicativo usa uma subpasta da raiz Git; essa estrutura está explícita nas instruções.
