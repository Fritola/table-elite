# Table Elite 🎾

**Table Elite** é o aplicativo definitivo para entusiastas e profissionais de tênis de mesa. Centralizamos rankings globais, perfis detalhados de atletas e calendários de torneios em uma interface moderna e intuitiva.

## 🚀 Funcionalidades Principal
- **Rankings Mundiais:** Integração com dados oficiais da WTT para exibir as classificações atualizadas.
- **Perfis de Atletas:** Biografias, estatísticas técnicas (mão de jogo, estilo) e fotos dos principais mesa-tenistas.
- **Agenda de Jogos:** Calendário completo de torneios e confrontos em tempo real.
- **Favoritos:** Siga seus jogadores favoritos e receba atualizações rápidas.
- **Internacionalização (i18n):** Suporte completo para Português (PT) e Inglês (EN).
- **Monetização Inteligente:** Integração com Google AdMob (protegida para ambiente de desenvolvimento).

## 🛠️ Stack Tecnológica
- **Mobile:** React Native com Expo (Router SDK 51+)
- **Backend:** Supabase (Auth, Database, Storage)
- **Internacionalização:** i18next
- **Cache & API:** React Query (TanStack) para sincronização de dados eficiente.
- **Estilização:** Sistema de cores personalizado e temas dinâmicos.

## 📦 Instalação e Uso
1. Clone o repositório:
   ```bash
   git clone https://github.com/Fritola/table-elite.git
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` baseado no `.env.example` com suas chaves do Supabase.
4. Inicie o projeto:
   ```bash
   npm start
   ```

## 🤖 Automação de Dados
O projeto utiliza **Scripts de Sincronização** (localizados em `/scripts`) para manter o banco de dados sempre atualizado com as APIs da WTT e ITTF.

---
Desenvolvido com 🏓 e ☕ por [Gustavo Fritola](https://github.com/Fritola).
