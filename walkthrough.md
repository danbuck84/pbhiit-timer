# PB HIIT - Visão Geral

## Visão Geral
PB HIIT é um Progressive Web App (PWA) de alta performance projetado para treinos HIIT em bicicleta ergométrica. Possui um motor de timer robusto, construtor de treinos personalizados e integração com Firebase para autenticação, histórico e ranking global.

## Funcionalidades Implementadas
- **Motor de Timer**: Timer de alta precisão com correção de desvio usando `Date.now()`. Suporta fases de Aquecimento, Trabalho, Descanso e Resfriamento.
- **Modos de Treino**:
  - **Predefinições**: Tabata Clássico (20/10s) e Sprints (30/30s).
  - **Construtor Personalizado**: Crie e salve treinos personalizados.
- **Persistência e Gamificação**:
  - **Autenticação Firebase**: Login com Google para acesso seguro.
  - **Histórico**: Rastreia treinos concluídos com duração e data. Inclui uma **Visualização de Calendário** para visualizar os dias de treino.
  - **Sequência (Streak)**: Exibe dias consecutivos de treino.
  - **Ranking Global**: Um placar comparando o tempo total e a contagem de treinos entre todos os usuários.
- **Interface e UX**:
  - **Grande e Nítido**: Botões grandes e texto de alto contraste para visibilidade durante exercícios intensos.
  - **Modo Escuro/Claro**: Tema alternável com persistência.
  - **Navegação Persistente**: Menu inferior fixo para fácil acesso a Início, Ranking e Histórico.
  - **Responsivo**: Otimizado para celular e tablet.
- **Sistema de Áudio**:
  - **Bips**: Tons sintéticos para contagens regressivas e mudanças de fase.
  - **Voz**: Anúncios de texto para fala para nomes de fases ("Prepare-se", "Tiro Máximo").
  - **Mudo**: Opção para silenciar o áudio.

## Tecnologias Utilizadas
- **Frontend**: React 19, Vite, TypeScript
- **Estilização**: Tailwind CSS v4
- **Backend**: Firebase v9 (Auth, Firestore)
- **Ícones**: Lucide React

## Instruções de Deploy (Netlify)
1. **Compilar o Projeto**:
   Execute o comando de build para gerar os arquivos estáticos na pasta `dist`.
   ```bash
   npm run build
   ```
2. **Deploy no Netlify**:
   - Arraste e solte a pasta `dist` no Netlify Drop.
   - Ou conecte seu repositório GitHub e defina o comando de build como `npm run build` e o diretório de publicação como `dist`.

## Configuração
A configuração do Firebase está localizada em `src/lib/firebase.ts`. Certifique-se de que seu projeto Firebase tenha Autenticação (Provedor Google) e Firestore habilitados.

## Estrutura do Projeto
- `src/components`: Componentes de UI reutilizáveis (Botão, Layout).
- `src/context`: Estado global (Auth, Theme, Data).
- `src/hooks`: Lógica personalizada (useTimer, useAudio).
- `src/pages`: Visualizações da aplicação (Home, Builder, ActiveWorkout, History, Ranking, Login).
- `src/types`: Definições TypeScript.
- `src/lib`: Configuração e utilitários.
