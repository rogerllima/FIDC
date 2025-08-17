# Etapa 1: Build
FROM node:18.16.0 AS builder

# Define diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json primeiro (cache das dependências)
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Compila o projeto (gera dist/)
RUN npm run build

# Etapa 2: Produção
FROM node:18.16.0 AS production

WORKDIR /app
COPY .env ./
# Copia apenas o necessário da etapa de build
COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist

# Expõe a porta (ajuste se seu Nest usa outra)
EXPOSE 3000

# Comando de inicialização
CMD ["node", "dist/main.js"]
