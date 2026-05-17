#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.local"
CONFIG_FILE="${PROJECT_ROOT}/assets/js/form-config.js"

read_env_value() {
  local key="$1"
  local line value
  line="$(grep -E "^[[:space:]]*${key}=" "${ENV_FILE}" | tail -n 1 || true)"
  value="${line#*=}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  if [[ "${value}" == \"*\" && "${value}" == *\" ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "${value}" == \'*\' && "${value}" == *\' ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s\n' "${value}"
}

escape_js_string() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "エラー: .env.local がありません。GAS_WEBAPP_URL を .env.local に設定してください。" >&2
  exit 1
fi

GAS_WEBAPP_URL="$(read_env_value "GAS_WEBAPP_URL")"

if [[ -z "${GAS_WEBAPP_URL}" ]]; then
  echo "エラー: .env.local に GAS_WEBAPP_URL を設定してください。" >&2
  exit 1
fi

escaped_url="$(escape_js_string "${GAS_WEBAPP_URL}")"

cat > "${CONFIG_FILE}" <<JS
window.KAZOKU_FORM_CONFIG = {
  gasWebAppUrl: "${escaped_url}",
};
JS

echo "assets/js/form-config.js を生成しました。URLは表示しません。"
