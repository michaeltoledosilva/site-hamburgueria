# Publicação preparada — não executada

> Registro histórico dos comandos da primeira entrega. A criação do repositório e o push inicial foram autorizados e executados: https://github.com/michaeltoledosilva/site-hamburgueria, branch `master`, commit inicial `a3081a2`. Não executar `gh repo create` novamente. Atualizações autorizadas usam `git add`, `git commit` e `git push origin master` na mesma raiz Git. A pasta do aplicativo continua sendo `site-hamburgueria`. Não foi configurada hospedagem por este projeto.

A raiz Git é `C:\Users\micha\OneDrive\Documentos\ChatGPT\Hamburgueria`. O aplicativo fica na subpasta `site-hamburgueria`. A branch local já é `master`, sem commits e sem origin. A consulta do conector GitHub retornou HTTP 404 para `michaeltoledosilva/site-hamburgueria`: repositório ausente ou não acessível à conexão. Verificar novamente antes de criar.

Somente após aprovação, executar:

```powershell
Set-Location 'C:\Users\micha\OneDrive\Documentos\ChatGPT\Hamburgueria'
git status --short
git add README.md site-hamburgueria
git diff --cached --stat
git commit -m "Cria demonstração cinematográfica BRASA BURGER"
gh repo create michaeltoledosilva/site-hamburgueria --public --source . --remote origin
git push -u origin master
gh repo edit michaeltoledosilva/site-hamburgueria --default-branch master
```

Se o remoto já existir, substituir o comando `gh repo create` por:

```powershell
git remote add origin https://github.com/michaeltoledosilva/site-hamburgueria.git
git fetch origin
git log --oneline --all --graph -15
```

Nesse caso, revisar e preservar o histórico remoto antes de enviar. Não usar force push. Não foi criado `main`, repositório remoto ou infraestrutura de hospedagem. Cloudflare Pages não foi publicado. A configuração exporta arquivos estáticos para `site-hamburgueria/out`; uma futura hospedagem deve usar a subpasta do aplicativo como raiz de build.
