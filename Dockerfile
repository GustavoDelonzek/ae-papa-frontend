# Estágio 1: Build da aplicação Angular
FROM node:22-alpine AS builder

WORKDIR /app

# Copia apenas o package.json para aproveitar o cache do Docker
COPY package*.json ./
# Instala as dependências
RUN npm install

# Copia todo o código fonte
COPY src/ .

# Build da aplicação para produção
RUN npm run build

# Estágio 2: Servidor de produção com Nginx
FROM nginx:stable-alpine

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nossa configuração personalizada do Nginx
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# --- CORREÇÃO CRÍTICA ABAIXO ---
COPY --from=builder /app/dist/src/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
