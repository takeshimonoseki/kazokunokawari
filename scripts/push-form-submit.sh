#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.local"
GAS_DIR="${PROJECT_ROOT}/gas/form-submit"

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
  echo "エラー: gas/form-submit が存在しません。" >&2
  exit 1
fi

FORM_SCRIPT_URL="$(read_env_value "FORM_SCRIPT_URL")"
FORM_SCRIPT_ID="$(read_env_value "FORM_SCRIPT_ID")"

script_id=""

if [[ -n "${FORM_SCRIPT_URL}" ]]; then
  if ! script_id="$(extract_script_id "${FORM_SCRIPT_URL}")"; then
    echo "エラー: FORM_SCRIPT_URL からScript IDを取得できませんでした。" >&2
    exit 1
  fi
  echo "フォーム送信用Apps Script URLからScript IDを取得しました。"
elif [[ -n "${FORM_SCRIPT_ID}" ]]; then
  script_id="${FORM_SCRIPT_ID}"
  echo "FORM_SCRIPT_IDを使用します。"
else
  echo "エラー: .env.local に FORM_SCRIPT_URL または FORM_SCRIPT_ID を設定してください。" >&2
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

echo "これからフォーム送信用Apps Scriptへ gas/form-submit を反映します。"
echo "GASデプロイ、新規作成、関数実行、フォーム送信テストは行いません。"
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
echo "次はApps Script画面でScript Propertiesを設定し、Webアプリデプロイ手順を別工程で確認してください。"
