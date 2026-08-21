# SIMCT Hortolândia - Diretrizes Permanentes de Desenvolvimento

## 🚨 REGRA CRÍTICA — PRESERVAÇÃO DE DADOS EM ATUALIZAÇÕES (PRIORIDADE MÁXIMA)

Toda vez que for solicitada uma atualização, ajuste, correção ou nova funcionalidade neste app:

1. **NUNCA recriar, apagar ou resetar tabelas ou coleções do banco de dados existentes**:
   - É estritamente proibido usar `DROP TABLE`, `CREATE TABLE` substituindo a anterior, ou qualquer comando / rotina que limpe dados já salvos no Firestore/Banco.

2. **NUNCA sobrescrever, resetar ou aplicar valor padrão em campos com dados do usuário**:
   - É expressamente proibido resetar valores preenchidos pelo usuário, com destaque absoluto para o campo `status` da tela de casos/notificações e históricos cadastrados.

3. **Alterações Estruturais Apenas Incrementais**:
   - Se for necessário alterar a estrutura (schema), utilize apenas migrações aditivas/incrementais que preservem 100% dos registros e valores existentes.

4. **Isolamento entre Frontend e Persistência**:
   - Alterações no frontend (telas, botões, layout) devem ser independentes do banco. Mudanças visuais NUNCA devem re-inicializar, limpar caches persistentes ou repovoar tabelas com dados mock/exemplo quando houver dados reais.

5. **Revisão Obrigatória Pré-Atualização**:
   - Antes de aplicar qualquer atualização, verificar: *"Esta alteração mantém todos os dados e status já cadastrados pelo usuário? Se não, pare e informe antes de prosseguir."*

---

## ⚖️ DIRETRIZES JURÍDICAS E DO ASSISTENTE (PROMPT CENTRAL)
- **Cobertura 100%**: Endereçar todos os fatos, pedidos e entidades citados nas consultas.
- **Pessoa com Deficiência / TEA**: Citar SEMPRE a Lei nº 13.146/2015 (LBI) como fundamento primordial + Lei nº 12.764/2012 (Berenice Piana) e ECA (arts. 11, § 1º e 54, III).
- **Violência Doméstica contra Mulher/Mãe**: Lei nº 11.340/2006 (Maria da Penha).
- **Violência Sexual e Abuso Infanto-Juvenil**: Lei nº 13.431/2017 (Escuta Especializada) + Lei nº 14.344/2022 (Henry Borel) + ECA.
- **Conselhos de Classe / Exercício Profissional**: Art. 282 do Código Penal e Art. 47 da LCP.
