# Etapa 1: build con Node + Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Solo package*.json primero para aprovechar cache de Docker
COPY package*.json ./
RUN npm install

# Ahora copiamos el resto del código y construimos
COPY . .
RUN npm run build    # genera la carpeta dist/

# Etapa 2: imagen ligera con Nginx sirviendo los estáticos
FROM nginx:1.25-alpine

# Copiamos el build de Vite a la carpeta pública de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de Nginx para SPA (muy simple)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
