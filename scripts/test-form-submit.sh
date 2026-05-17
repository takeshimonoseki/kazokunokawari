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
response_file="${LOG_DIR}/form-submit-test_${timestamp}.json"
payload_file="$(mktemp)"
trap 'rm -f "${payload_file}"' EXIT

cat > "${payload_file}" <<'JSON'
{
  "受付種別": "テスト",
  "お名前": "テスト太郎",
  "電話番号": "090-0000-0000",
  "メールアドレス": "",
  "希望連絡方法": "メール",
  "希望サービス": "その他・個別相談",
  "訪問エリア": "下関市内・近隣エリア",
  "詳しい訪問場所": "テスト",
  "訪問場所調整": "テスト",
  "シミュレーター概算": "テスト",
  "オプション": "なし",
  "希望内容": "GAS単体テスト",
  "購入品の有無": "なし",
  "購入予定額・予算上限": "",
  "備考": "テスト送信",
  "流入元ページ": "local-test",
  "sourcePage": "local-test"
}
JSON

echo "これはテスト送信で、Sheetsへ保存される可能性があります。"
echo "管理者メールが送信される可能性があります。"
echo "GAS WebアプリURLは画面に表示しません。"
read -r -p "テストJSONを送信しますか？ [y/N]: " answer

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
  --request POST \
  --header "Content-Type: application/json" \
  --data-binary @"${payload_file}" \
  --output "${response_file}" \
  "${GAS_WEBAPP_URL}"

echo "レスポンスを保存しました: ${response_file}"
