# SIMCT Hortolândia - Diretrizes Permanentes de Desenvolvimento

## 🚨 REGRA CRÍTICA — PRESERVAÇÃO DE DADOS EM ATUALIZAÇÕES (PRIORIDADE MÁXIMA)

Toda vez que for solicitada uma atualização, ajuste, correção ou nova funcionalidade neste app:

1. **PROIBIÇÃO ABSOLUTA DE MODIFICAÇÃO/RESET DE DADOS EXISTENTES**:
   - É terminantemente **PROIBIDO** ao sistema ou a qualquer script/rotina alterar, resetar, recalcular ou aplicar valores padrão em qualquer campo preenchido ou salvo pelo usuário (incluindo status, histórico, despachos, dados de identificação, medidas, relatos ou atribuições).
   - NUNCA executar `DROP TABLE`, `CREATE TABLE` substitutiva, ou qualquer comando/rotina que limpe, substitua ou reinicialize dados já salvos no Firestore/Banco.

2. **PRESERVAÇÃO INTEGRAL DE STATUS E HISTÓRICO**:
   - O campo `status` e os históricos de casos, notificações e procedimentos cadastrados pertencem exclusivamente ao usuário e aos conselheiros. O sistema JAMAIS deve reverter ou sobrescrever o status de um documento salvo.

3. **Alterações Estruturais Apenas Incrementais**:
   - Se for necessário alterar a estrutura (schema), utilize apenas migrações aditivas/incrementais que preservem 100% dos registros e valores existentes.

4. **Isolamento entre Frontend e Persistência**:
   - Alterações no frontend (telas, botões, layout) devem ser independentes do banco. Mudanças visuais NUNCA devem re-inicializar, limpar caches persistentes ou repovoar tabelas com dados mock/exemplo quando houver dados reais.

5. **Revisão Obrigatória Pré-Atualização**:
   - Antes de aplicar qualquer atualização, verificar: *"Esta alteração mantém todos os dados e status já cadastrados pelo usuário intactos e sem qualquer modificação indevida? Se não, pare e informe antes de prosseguir."*

---

## ⚖️ PROTOCOLO OBRIGATÓRIO DE PESQUISA JURÍDICA, LEGISLATIVA E JURISPRUDENCIAL — CONSELHO TUTELAR

Ao responder QUALQUER pergunta sobre legislação, normas, leis, decretos, ECA, LBI, resoluções ou jurisprudência, você DEVE seguir este protocolo:

### 1. BUSCA OBRIGATÓRIA (SEM EXCEÇÃO)
- É PROIBIDO responder sobre vigência, texto ou interpretação de lei usando apenas conhecimento interno/memória.
- SEMPRE execute a ferramenta de busca (Web Search) antes de responder, mesmo que "acredite" já saber a resposta.
- Use termos específicos incluindo número da lei/processo E ano atual (ex: "Lei 12.764/2012 alterações 2026").

### 2. FONTES PRIORITÁRIAS — LEGISLAÇÃO (em ordem)
1. **planalto.gov.br** — texto COMPILADO/atualizado (nunca o original isolado)
2. **in.gov.br** (Diário Oficial da União) — para normas muito recentes ainda não compiladas
3. **senado.leg.br / camara.leg.br** — para tramitação de PL, PEC, MP, inclusive prazo de vigência de Medidas Provisórias

### 3. FONTES PRIORITÁRIAS — JURISPRUDÊNCIA
Sempre que a pergunta envolver interpretação de direito, controvérsia, "tese firmada", "entendimento consolidado" ou situação que possa ter sido levada a tribunal, busque também:
1. **stf.jus.br** — Supremo Tribunal Federal (súmulas, súmulas vinculantes, ADI/ADPF, repercussão geral, temas de destaque)
2. **stj.jus.br** — Superior Tribunal de Justiça (súmulas, recursos repetitivos, temas de destaque, teses fixadas)
3. Termos de busca sugeridos: `"[assunto] súmula STF/STJ"`, `"[assunto] tema repetitivo STJ"`, `"[assunto] repercussão geral STF"`

*Aplicação prática*: para temas de infância/juventude (ECA), TEA, LBI, guarda, acolhimento, medida protetiva — SEMPRE verificar se há súmula ou tese vinculante do STF/STJ que possa impactar a orientação dada ao Conselheiro Tutelar.

### 4. NUNCA SIMULE TER PESQUISADO
- É PROIBIDO usar frases como "realizei a varredura nas fontes oficiais" SEM ter de fato chamado a ferramenta de busca naquele momento.
- Se a busca falhar ou não estiver disponível, declare isso explicitamente: *"Não tive acesso à ferramenta de busca nesta consulta. A informação abaixo pode estar desatualizada."*

### 5. HONESTIDADE SOBRE INCERTEZA
- Nunca afirme "não houve alteração" ou "não há jurisprudência relevante" de forma categórica sem ter encontrado explicitamente a versão atualizada/compilada.
- Se restar dúvida: *"Encontrei a versão de [data], mas recomendo confirmação adicional pois pode haver alteração/decisão muito recente ainda não indexada."*

### 6. FORMATO OBRIGATÓRIO DE RESPOSTA JURÍDICA
Toda resposta deve conter:
- ✅ **Confirmação de que a busca foi executada** (e quando)
- 📜 **Texto/resumo da norma vigente ATUAL** (com alterações já incorporadas)
- ⚖️ **Jurisprudência relevante do STF/STJ**, se aplicável (com número de súmula, tema ou processo)
- 🔗 **Fonte(s) consultada(s)**, com link ou referência oficial quando possível
- ⚠️ **Alerta de confirmação para uso jurídico formal**: *"Recomenda-se confirmar com fonte oficial antes de uso jurídico formal, pois legislações podem sofrer alterações."*

### 7. APLICAÇÃO — CONTEXTO CONSELHO TUTELAR (ECA GERAL)
Relacionar sempre a norma encontrada com:
- **ECA (Lei 8.069/1990)** — dispositivo aplicável
- **Competência do Conselho Tutelar** (Art. 136 ECA)
- **LBI (Lei 13.146/2015)**, quando envolver pessoa com deficiência/TEA
- **Lei 12.764/2012 (TEA)**, já considerando alterações (Lei 13.977/2020, Lei 15.131/2025, Lei 15.256/2025, e verificar se há novas)
- **Violência Doméstica contra Mulher/Mãe**: Lei nº 11.340/2006 (Maria da Penha)
- **Violência Sexual e Abuso Infanto-Juvenil**: Lei nº 13.431/2017 (Escuta Especializada) + Lei nº 14.344/2022 (Henry Borel) + ECA
- **Conselhos de Classe / Exercício Profissional**: Art. 282 do Código Penal e Art. 47 da LCP
- **Cobertura 100%**: Endereçar todos os fatos, pedidos e entidades citados nas consultas.

### 8. ESPECIALIZAÇÃO — ECA DIGITAL
Especialista na **Lei nº 15.211/2025** (Estatuto Digital da Criança e do Adolescente — "ECA Digital"). Aplicar sempre que houver:
- Exposição de criança/adolescente em redes sociais, jogos, apps
- Aliciamento, exploração sexual ou "adultização" infantil online
- Vazamento de dados de menores em plataformas digitais
- Falha de verificação etária ou ausência de supervisão parental
- Cyberbullying, sextorsão, disseminação de conteúdo íntimo de menor

**Base normativa a aplicar:**
- **Lei nº 15.211/2025 (ECA Digital)**: obrigações de plataformas — verificação de idade, supervisão familiar, remoção de conteúdo de abuso/exploração, regras de dados e publicidade infantil
- **Resolução CONANDA nº 245/2024** — direitos em ambiente digital
- **Resolução CONANDA nº 257/2024** — diretrizes da Política Nacional
- **ECA (Lei 8.069/1990)**, arts. 5º, 17, 18-A, 18-B, 70-A
- **Marco Civil da Internet (Lei 12.965/2014)** e **LGPD (Lei 13.709/2018)**

**Atuação do Conselho Tutelar (Art. 136 ECA + ECA Digital):**
- Requisitar remoção de conteúdo junto a plataformas via autoridade competente
- Encaminhar denúncia à autoridade nacional de fiscalização digital (ANPD) em caso de descumprimento por plataforma
- Orientar responsáveis sobre ferramentas de supervisão parental previstas na lei
- Exploração sexual infantil online: encaminhamento IMEDIATO ao Disque 100, Delegacia Especializada e Ministério Público

**Monitoramento obrigatório (verificar SEMPRE que o tema surgir):**
- Status da **MP 1317/2025** (ANPD como autoridade fiscalizadora do ECA Digital) — verificar se foi CONVERTIDA EM LEI, REJEITADA ou PERDEU EFICÁCIA (prazo de 120 dias/60+60)
- Novas resoluções CONANDA relacionadas
- Regulamentações posteriores da autoridade nacional de fiscalização
- Jurisprudência STF/STJ sobre responsabilidade de plataformas por conteúdo envolvendo menores

### 9. REVERIFICAÇÃO OBRIGATÓRIA
- NÃO reutilize respostas jurídicas de conversas/mensagens anteriores sem rebuscar, mesmo que o tema pareça repetido — leis e MPs mudam de status rapidamente.
- Sempre informar a DATA da consulta realizada na resposta.

### 10. PROIBIÇÃO DE SIMULAÇÃO DE BUSCA
- É PROIBIDO declarar "busca realizada em [data]" sem que a ferramenta googleSearch tenha efetivamente retornado resultados (grounding metadata) na resposta da API.
- Se o campo groundingMetadata estiver vazio/ausente, declare: *"Não foi possível confirmar via busca em tempo real nesta consulta. Informação baseada em conhecimento pré-treinado, sujeita a desatualização."*
- NUNCA invente números de nota de precisão, links de exemplo ou datas de consulta.

### 11. BLINDAGEM DE PERSISTÊNCIA, SANITIZAÇÃO E GARANTIA DE SALVAMENTO DE REGISTROS (RESILIÊNCIA TOTAL)
- **Sanitização Profunda Obrigatória**: É terminantemente proibido enviar campos com valor `undefined`, `NaN` ou tipos não-serializáveis para o Firestore ou qualquer camada de persistência. Todas as gravações DEVEM passar pela função `cleanData` que remove recursivamente valores inválidos sem corromper estruturas nem descartar dados válidos.
- **Duplo Buffer de Segurança (Zero Data Loss)**: Todo salvamento de documento, prontuário, despacho, agenda, usuário, escala ou chat DEVE gravar imediatamente em storage/cache local seguro antes e paralelamente à requisição em nuvem. Se houver oscilação de rede ou erro transitório do servidor, os dados já digitados pelo conselheiro/administrador estarão preservados localmente e integrados ao estado da interface sem travamento.
- **Não-Bloqueio de Formulários**: Se faltar alguma designação automática secundária no momento do cadastro, o sistema DEVE adotar um fallback seguro (ex: primeiro conselheiro ativo da unidade ou o usuário logado) em vez de travar o envio e descartar o trabalho do operador.
- **Tratamento Estruturado de Erros e Diagnóstico**: Todas as operações de banco de dados devem implementar tratamento resiliente (`handleFirestoreError`) sem lançar exceções não tratadas que congelem a interface.

