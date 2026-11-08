# syntax=docker/dockerfile:1

# Build no arch do runner (sem emulação): a saída é estática e serve a qualquer plataforma (AD-8).
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
ENV NG_CLI_ANALYTICS=false
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# prebuild gera o cliente da API a partir de openapi/catalogo-api.json (AD-2).
RUN npm run build

# Imagem final: nginx não-root (UID 101), porta 8080. O nginx.conf principal da imagem não é
# substituído: ele já põe pid e temporários em /tmp, compatível com readOnlyRootFilesystem
# + emptyDir em /tmp e /var/cache/nginx.
FROM nginxinc/nginx-unprivileged:stable-alpine
# Pacotes da imagem base atualizados no build: correções do Alpine publicadas depois da última
# imagem do nginx (ex.: CVE-2026-111497 em brotli-libs, barrada pelo Trivy na 1ª esteira).
# Único RUN do estágio arm64 (executado sob QEMU na CI; leva poucos segundos).
USER root
RUN apk upgrade --no-cache
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY docker/config.json.template /opt/catalogo/config.json.template
COPY --chmod=0755 docker/entrypoint/40-config-json.sh /docker-entrypoint.d/40-config-json.sh
COPY --from=build /app/dist/catalogo-front/browser /usr/share/nginx/html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
