#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.local"
LOG_DIR="${PROJECT_ROOT}/logs"

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

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "エラー: .env.local がありません。GAS_WEBAPP_URL を .env.local に設定してください。" >&2
  exit 1
fi

GAS_WEBAPP_URL="$(read_env_value "GAS_WEBAPP_URL")"

if [[ -z "${GAS_WEBAPP_URL}" ]]; then
  echo "エラー: .env.local に GAS_WEBAPP_URL を設定してください。" >&2
  exit 1
fi

mkdir -p "${LOG_DIR}"

timestamp="$(date '+%Y%m%d_%H%M%S')"
response_file="${LOG_DIR}/gas-webapp-check_${timestamp}.json"

echo "GAS WebアプリのGET疎通確認を行います。"
echo "Sheets書き込み、メール送信、LINE通知は発生しません。"
echo "GAS WebアプリURLは画面に表示しません。"
read -r -p "疎通確認を実行しますか？ [y/N]: " answer

case "${answer}" in
  [yY]|[yY][eE][sS])
    ;;
  *)
    echo "中止しました。"
    exit 0
    ;;
esac

curl \
  --location \
  --silent \
  --show-error \
  --fail-with-body \
  --request GET \
  --output "${response_file}" \
  "${GAS_WEBAPP_URL}"

echo "レスポンスを保存しました: ${response_file}"
