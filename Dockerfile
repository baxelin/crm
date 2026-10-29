FROM node:24-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/app/data \
    UPLOADS_DIR=/app/data/uploads

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist /app/client/dist

RUN mkdir -p /app/data/uploads && chown -R node:node /app/data
USER node

EXPOSE 3000
CMD ["node", "server.js"]
