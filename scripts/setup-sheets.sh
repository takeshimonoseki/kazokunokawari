#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.local"
GAS_DIR="${PROJECT_ROOT}/gas/sheets-setup"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "エラー: プロジェクト直下に .env.local がありません。" >&2
  exit 1
fi

if [[ ! -d "${GAS_DIR}" ]]; then
  echo "エラー: gas/sheets-setup が存在しません。" >&2
  exit 1
fi

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

SPREADSHEET_URL="$(read_env_value "SPREADSHEET_URL")"
SPREADSHEET_ID="$(read_env_value "SPREADSHEET_ID")"

extract_spreadsheet_id() {
  local url="$1"
  if [[ "${url}" =~ /spreadsheets/d/([^/?#]+) ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return 0
  fi
  return 1
}

sheet_id=""

if [[ -n "${SPREADSHEET_URL}" ]]; then
  if ! sheet_id="$(extract_spreadsheet_id "${SPREADSHEET_URL}")"; then
    echo "エラー: SPREADSHEET_URL からSpreadsheet IDを取得できませんでした。" >&2
    exit 1
  fi
  echo "スプレッドシートURLからIDを取得しました。"
elif [[ -n "${SPREADSHEET_ID}" ]]; then
  sheet_id="${SPREADSHEET_ID}"
  echo "SPREADSHEET_IDを使用します。"
else
  echo "エラー: SPREADSHEET_URL または SPREADSHEET_ID を .env.local に設定してください。" >&2
  exit 1
fi

if [[ -z "${sheet_id}" ]]; then
  echo "エラー: Spreadsheet IDが空です。" >&2
  exit 1
fi

SPREADSHEET_ID="${sheet_id}"
trap 'unset SPREADSHEET_ID' EXIT

echo "これからGoogle Apps Scriptのセットアップ処理を実行します。"
read -r -p "続行しますか？ [y/N]: " answer
case "${answer}" in
  [yY]|[yY][eE][sS])
    ;;
  *)
    echo "中止しました。"
    exit 0
    ;;
esac

cd "${PROJECT_ROOT}"

clasp create --type sheets --parentId "${SPREADSHEET_ID}" --rootDir gas/sheets-setup
clasp push -f
clasp run setupKazokunokawariSheets
