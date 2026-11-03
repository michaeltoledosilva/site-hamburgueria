# Direção e escopo da revisão

> Plano inicial de criação. Na revisão posterior, o usuário pediu mídias vivas e originais: os gradientes de escurecimento foram removidos, preservando as cores e usando sombra somente nos textos. Consultar LATENCIA.md para a decisão atual e suas medições.

BRASA BURGER é uma marca fictícia para portfólio ZMT. A primeira ação é explorar o cardápio; delivery demonstra a futura conexão com canais reais. Não há preços, avaliações, endereço ou pedidos reais.

Mobile: produto ocupa a área superior; títulos, descrição e CTA ficam na faixa inferior protegida por gradiente, acima dos controles. Cabeçalho compacto e controles inferiores de 44px. Em telas baixas, reduzir título e espaços, mantendo descrição e CTA. Desktop: texto à esquerda e produto central/direita, composição ampla e contraste local.

Narrativa: hambúrguer pronto → chapa → camadas suspensas aproximando-se. Scroll nativo controla 80 quadros por cena; parar conserva a posição e subir retrocede. Não se promete montagem completa além da ação efetivamente presente no vídeo fornecido. Reduced motion exibe capítulos estáticos. Modo leve é escolha explícita. Sem vídeos com áudio ou autoplay fora da tela.

Fontes inspecionadas no começo, meio e fim, com pares horizontal/vertical consistentes em ingredientes, cenário e luz, mas movimentos/enquadramentos distintos entre tomadas. Todas Full HD, 24fps, 7,93s. Derivados WebP: desktop 1920×1080, mobile 720×1280, 80 quadros incluindo extremos próximos dos endpoints do vídeo; originais preservados. Derivados mobile comparados visualmente com as referências originais; cobertura emulada não certifica qualidade física em todos os DPRs.

Estados planejados: entry; cada capítulo e seu meio; adjacências de transição; cardápio; delivery; encerramento; exit; assinatura. Matriz principal 320×568, 390×844 e 1440×900, ampliada pelas suítes do starter. Orçamento de convergência do smoke: até 1500ms após salto de cena frio em loopback; é limite de teste, não promessa de apresentação contínua ou INP. Testes do starter usam limite de 8000ms para diagnosticar assets. Testes lentos de estresse não representam a rede de produção.

Referência indicada pelo briefing: https://beatrizvivot.pages.dev/ . Consulta web indisponível na execução; não foi usada como evidência de aprovação deste site. Base técnica reutilizada via gerador oficial, identidade própria de gastronomia. Máximo de três ciclos: implementação; composição/viewport; auditoria Lighthouse e ajustes de semântica/poster.

SEO local: HTML estático com título, descrição, idioma e alt; OG, Twitter e favicon da marca. Noindex intencional de prévia demonstrativa. Domínio, canonical e sitemap de produção pendentes, sem schema comercial fictício ou analytics.
