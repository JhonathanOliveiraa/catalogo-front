#!/bin/sh
# Gera /tmp/config/config.json a partir de API_BASE_URL no start do contêiner (AD-3, AD-8).
# Roda pelo /docker-entrypoint.sh da imagem nginx; sair com código != 0 impede o nginx de subir.
set -eu

ME=$(basename "$0")
TEMPLATE=/opt/catalogo/config.json.template
DESTINO_DIR=/tmp/config

falhar() {
  echo "$ME: erro: $1" >&2
  exit 1
}

API_BASE_URL="${API_BASE_URL:-}"
[ -n "$API_BASE_URL" ] || falhar "API_BASE_URL não definida (URL https absoluta, sem barra final)"

# Uma única linha (grep avalia linha a linha).
case "$API_BASE_URL" in
  *"
"*) falhar "API_BASE_URL não pode ter quebra de linha" ;;
esac

# https, sem aspas, barra invertida nem espaço, e sem barra final. Mesmo que o padrão do spine
# (^https://[^"\\[:space:]]+[^/]$), mas o último caractere também não pode ser espaço/aspas.
printf '%s' "$API_BASE_URL" | grep -Eq '^https://[^"\\[:space:]]*[^"\\/[:space:]]$' \
  || falhar "API_BASE_URL inválida: '$API_BASE_URL' (esperado https://host[/caminho], sem barra final)"

export API_BASE_URL
mkdir -p "$DESTINO_DIR"
envsubst '${API_BASE_URL}' < "$TEMPLATE" > "$DESTINO_DIR/config.json"
echo "$ME: info: /config.json gerado com apiBaseUrl=$API_BASE_URL"
