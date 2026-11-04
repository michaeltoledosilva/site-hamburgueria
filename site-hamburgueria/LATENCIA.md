# Revisão de latência e cores — BRASA BURGER

> Medições da revisão `4f50011`. O ajuste posterior do recorte mobile está descrito em ENQUADRAMENTO.md; ele mantém as fontes verticais, as cores e o motor de carregamento.

As mídias agora aparecem sem o gradiente de escurecimento. Não foi aplicado aumento artificial de saturação nem nova recompressão: os WebPs existentes e os originais fornecidos foram preservados. A leitura usa sombra nos textos. Hero, chapa, montagem e encerramento foram revisados visualmente em mobile e desktop.

## Causas corrigidas

1. Espera de rede por quadro: pequenos blocos compartilham uma requisição entre 16 WebPs, com antecipação limitada conforme o movimento e a proximidade de transições.
2. Cancelamento de trabalho útil: downloads compartilhados continuam válidos para a mesma cena e para o retorno; orientação e descarte cancelam o trabalho incompatível.
3. Fila bloqueada: o alvo já disponível pode ser decodificado sem aguardar downloads antigos. Quando um bloco termina primeiro, ele substitui a requisição individual pendente do alvo.
4. Um RAF adicional no desktop: o desenho agora usa o ciclo já ativo do GSAP, cancelando trabalho agendado redundante pelo renderizador central. O scroll nativo mobile foi preservado.
5. Disputa com o carregamento inicial: o download dos blocos começa após a primeira pintura. A primeira imagem continua independente deles.

Preservados: três cenas, 80 posições por cena, fontes desktop/mobile, enquadramento, scroll reversível, geometria de viewport, modo leve opcional, reduced motion e fallback. Nenhuma animação foi trocada por poster como padrão.

## Antes e depois

Três execuções por cenário; medianas abaixo. Amostra atrasada significa **mais de dois quadros atrás do alvo atual**, com a mesma tolerância, entrada, duração e janela de coleta. Não representa porcentagem de usuários nem latência física de tela.

| Ensaio | Antes | Depois | Faixa depois |
|---|---:|---:|---:|
| Mobile 390×844, DPR2, CPU ×4, loopback | 13,9% | 1,4% | 0,9–1,9% |
| Mesmo mobile, 150ms por requisição de mídia | 81,9% | 18,2% | 16,7–23,1% |
| Desktop 1440×900, DPR1, CPU ×1 | 42,6% | 1,0% | 0–3,0% |

Redução mediana das amostras atrasadas: aproximadamente 90% no mobile normal, 78% no atraso artificial e 98% no desktop. A linha desktop compara transporte individual com o novo transporte e desenho sincronizado, nas mesmas mídias, dimensões e gestos. O baseline mobile usa o build original `2fi22UapUYlG7lJ82C9TY`, fonte `a3081a2`.

P95 alvo→desenho exato observado: mobile normal, mediana de 86,4ms para 49,8ms; desktop, de 24,8ms para 2,4ms. Essa métrica descreve os desenhos exatos observados; não inclui todos os eventos de entrada cancelados ou a apresentação física no monitor. RAF não comprova FPS físico e TBT não é INP.

## Custos e rede limitada

No percurso mobile, as requisições de mídia concluídas caíram de mediana 176 para 25. A transferência concluída aumentou de 11,81MB para 16,86MB: mais quadros ficam disponíveis para avanço e retorno. Os dados completos e amplitudes estão em `docs/latency/comparison.json`.

O cache de blocos comprimidos tem limite próprio de 20MiB, além do cache individual de até 12MiB. O orçamento de imagens decodificadas permaneceu em 48MiB mobile / 96MiB desktop. Esses números não são um limite global de RAM: canvas, buffers em voo e memória do navegador são separados.

Os blocos acrescentam cerca de 39,77MB ao artefato gerado em disco. Eles são reconstruídos no `prebuild` e no `pretest`, sem duplicar esses binários no Git. Os 480 WebPs individuais permanecem como fonte e fallback. Cada quadro incluído é comparado byte a byte com sua fonte; não há redução de resolução ou densidade para melhorar a medição.

Também foram executadas três passagens por transporte em CDP com download de 1,6Mbps, upload de 750kbps, latência de 80ms e CPU ×4. Não houve ganho conclusivo nesse cenário: a mediana até o primeiro quadro foi 4,49s no transporte individual e 4,81s com blocos, com faixas sobrepostas; cerca de 70% das amostras ficaram atrasadas nos dois transportes durante o percurso rápido. Portanto, **o atraso em banda muito limitada permanece uma limitação**. Não se promete fluidez em qualquer conexão mantendo a qualidade original.

Os bytes do ensaio limitado representam recursos/chunks observados; não contabilizam todo o buffering abortado/em voo nem tráfego físico de rede. A segunda passagem reutiliza o contexto, sem presumir que todos os quadros estejam previamente carregados. A última alteração de agendamento afeta apenas desktop; a evidência de banda mobile foi reutilizada porque seu caminho permaneceu equivalente.

## Validação

- Build estático, lint e TypeScript passaram.
- 25 testes passaram: cancelamento, reversão, perfil, integridade dos 480 quadros, formato inválido/truncado, descarte, limites de cache, ausência de loops de prefetch, fallback de pacote ausente, fallback de imagem inválida e ausência do RAF redundante.
- Regressão mobile em dez viewports: ida/volta, pular/retorno, altura dinâmica, orientação, repouso, modo leve e reduced motion; sem erros JS/HTTP ou overflow nos cenários testados.
- Smoke compartilhado: 2 perfis / 22 amostras, zero falhas, com limitações físicas explícitas.
- Rota normal sem diagnóstico e revisão visual de 63 capturas, incluindo telas de 320×568, 390×844 e 1440×900, cenas, transições, saída e rodapé.

| Lighthouse final | Mobile | Desktop |
|---|---:|---:|
| Performance | 98 | 96 |
| Acessibilidade | 100 | 100 |
| Boas práticas | 100 | 100 |
| SEO | 66 | 66 |
| LCP | 1,21s | 1,45s |
| CLS | 0,066 | 0,003 |
| TBT | 126,5ms | 0ms |

Lighthouse 13.6.0, uma amostra final por perfil em Edge headless e loopback. SEO 66 mantém o `noindex` intencional da prévia. As métricas são de laboratório e têm variabilidade; não são Core Web Vitals de campo. Chrome Android e Safari iOS físicos, barras reais, GPU/memória e rede real continuam pendentes.

## Reprodução e fonte

```powershell
npm ci
npm test
npm run lint
npm run typecheck
npm run build
$env:PORT='3002'
npm start
```

Prévia: http://127.0.0.1:3002/ . Para medir, usar os scripts de QA com `QA_BASE_URL` e Playwright local conforme o README. `benchmark-mobile.mjs` mantém os valores originais por padrão; permite configurar viewport, DPR, CPU e transporte para ensaios separados. `qa-latency-bandwidth.mjs` compara os transportes em banda limitada. `summarize-latency.mjs` consolida as medições e hashes.

Fonte mantido na branch `master` do mesmo repositório. Envio ao GitHub autorizado na conversa; nenhum comando de deploy ou criação de hospedagem foi executado. Relatórios iniciais foram preservados como históricos, sem atribuir seus resultados ao build atual.
