#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.local"
GAS_DIR="${PROJECT_ROOT}/gas/sheets-setup"

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

extract_script_id() {
  local url="$1"

  if [[ "${url}" =~ script\.google\.com/(u/[0-9]+/)?home/projects/([^/?#]+) ]]; then
    printf '%s\n' "${BASH_REMATCH[2]}"
    return 0
  fi

  if [[ "${url}" =~ script\.google\.com/d/([^/?#]+) ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return 0
  fi

  return 1
}

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "エラー: .env.local がありません。先に .env.example をコピーして作成してください。" >&2
  exit 1
fi

if [[ ! -d "${GAS_DIR}" ]]; then
  echo "エラー: gas/sheets-setup が存在しません。" >&2
  exit 1
fi

SCRIPT_URL="$(read_env_value "SCRIPT_URL")"
SCRIPT_ID="$(read_env_value "SCRIPT_ID")"

script_id=""

if [[ -n "${SCRIPT_URL}" ]]; then
  if ! script_id="$(extract_script_id "${SCRIPT_URL}")"; then
    echo "エラー: SCRIPT_URL からScript IDを取得できませんでした。" >&2
    exit 1
  fi
  echo "Apps Script URLからScript IDを取得しました。"
elif [[ -n "${SCRIPT_ID}" ]]; then
  script_id="${SCRIPT_ID}"
  echo "SCRIPT_IDを使用します。"
else
  echo "エラー: .env.local に SCRIPT_URL または SCRIPT_ID を設定してください。" >&2
  exit 1
fi

if [[ -z "${script_id}" ]]; then
  echo "エラー: Script IDが空です。" >&2
  exit 1
fi

cat > "${GAS_DIR}/.clasp.json" <<JSON
{
  "scriptId": "${script_id}",
  "rootDir": "."
}
JSON

echo "これから既存Apps ScriptプロジェクトへGASコードを反映します。"
echo "新しいスプレッドシートや新しいApps Scriptは作成しません。"
read -r -p "続行しますか？ [y/N]: " answer

case "${answer}" in
  [yY]|[yY][eE][sS])
    ;;
  *)
    echo "中止しました。"
    exit 0
    ;;
esac

cd "${GAS_DIR}"
clasp push -f

echo "clasp push が完了しました。"
echo "次はApps Script画面で setupKazokunokawariSheets を1回だけ手動実行してください。"
