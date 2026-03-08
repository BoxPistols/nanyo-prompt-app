#!/usr/bin/env python3
"""
南陽市DXプロンプトライブラリ - 上流データ完全同期スクリプト

nanyo-line/prompt GitHubリポジトリと完全同期:
  - 新規プロンプトの追加検知
  - 既存プロンプトの更新検知（SHA比較）
  - 削除されたプロンプトの検知・除去
  - 変更レポートの生成（GitHub Actions PR用）
"""

import requests
import json
import re
import time
import os
import hashlib
from bs4 import BeautifulSoup

# ─── 設定 ─────────────────────────────────────────────────────────────────────
GITHUB_API_TREE = "https://api.github.com/repos/nanyo-line/prompt/git/trees/main?recursive=1"
RAW_CONTENT_BASE = "https://raw.githubusercontent.com/nanyo-line/prompt/main"
SLEEP_TIME = 1.0

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

RAW_DATA_PATH = os.path.join(PROJECT_ROOT, "src", "data", "raw_data.json")
CONTENTS_PATH = os.path.join(PROJECT_ROOT, "src", "data", "contents.json")
META_PATH = os.path.join(SCRIPT_DIR, "upstream_meta.json")
REPORT_PATH = os.path.join(SCRIPT_DIR, "sync_report.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Prompt748 Sync Bot)"
}

# GitHub APIで除外するファイル名パターン
SKIP_PATTERNS = ["OLD", "demo", "test", "index", "README"]


def log(msg):
    print(msg, flush=True)


def get_github_headers():
    """GitHub API用ヘッダーを取得（トークンがあれば含める）"""
    token = os.environ.get("GITHUB_TOKEN", "")
    headers = {**HEADERS}
    if token:
        headers["Authorization"] = f"token {token}"
    return headers


def get_upstream_tree():
    """GitHubリポジトリからファイルツリー（SHAハッシュ付き）を取得する"""
    log("上流リポジトリのファイルツリーを取得中...")
    headers = get_github_headers()

    try:
        resp = requests.get(GITHUB_API_TREE, headers=headers, timeout=30)
        if resp.status_code == 403:
            log("GitHub API rate limit。GITHUB_TOKENを設定してください。")
            return None
        if resp.status_code != 200:
            log(f"GitHub API エラー: {resp.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        log(f"GitHub API リクエストエラー: {e}")
        return None

    tree = resp.json().get("tree", [])
    prompt_files = {}

    for item in tree:
        path = item["path"]
        if not path.endswith(".html"):
            continue

        name = path.replace(".html", "")

        # 除外パターン
        if any(skip in name for skip in SKIP_PATTERNS):
            continue

        sha = item.get("sha", "")

        # ID分類
        if re.match(r"^\d+[a-z]?$", name):
            # 数値ID (573b等の特殊ケースも含む)
            prompt_files[name] = {"file": path, "sha": sha, "name": name}
        elif re.match(r"^S\d+$", name):
            prompt_files[name] = {"file": path, "sha": sha, "name": name}
        elif re.match(r"^d\d+$", name):
            prompt_files[name] = {"file": path, "sha": sha, "name": name}

    log(f"  上流プロンプトファイル数: {len(prompt_files)}")
    return prompt_files


def load_upstream_meta():
    """前回の同期メタデータを読み込む"""
    if os.path.exists(META_PATH):
        with open(META_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_upstream_meta(meta):
    """同期メタデータを保存する"""
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def load_data():
    """現在のアプリデータを読み込む"""
    with open(RAW_DATA_PATH, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
    with open(CONTENTS_PATH, "r", encoding="utf-8") as f:
        contents = json.load(f)
    return raw_data, contents


def save_data(raw_data, contents):
    """アプリデータを保存する"""
    with open(RAW_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(raw_data, f, ensure_ascii=False)
    with open(CONTENTS_PATH, "w", encoding="utf-8") as f:
        json.dump(contents, f, ensure_ascii=False, indent=2)


def get_link_id_map(raw_data):
    """link_id → raw_dataインデックスのマッピングを作成"""
    mapping = {}
    for i, item in enumerate(raw_data):
        lid = str(item[2])
        mapping[lid] = i
    return mapping


def upstream_name_to_link_id(name):
    """上流ファイル名からアプリ内のlink_idに変換"""
    # 数値のみ → "G{num}" (770以上) or "{num}" (769以下)
    if re.match(r"^\d+$", name):
        num = int(name)
        if num > 769:
            return f"G{num}"
        return str(num)
    # 573b等の特殊ケース
    if re.match(r"^\d+[a-z]$", name):
        return name
    # S/d prefix はそのまま
    return name


def fetch_prompt_page(file_path):
    """上流HTMLページからタイトルと本文を取得"""
    url = f"{RAW_CONTENT_BASE}/{file_path}"

    for attempt in range(3):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 404:
                return None
            if resp.status_code != 200:
                time.sleep(2 ** attempt)
                continue

            resp.encoding = resp.apparent_encoding or "utf-8"
            html = resp.text
            soup = BeautifulSoup(html, "html.parser")

            # タイトル抽出
            title_tag = soup.find("title")
            title = ""
            if title_tag:
                title = title_tag.get_text().strip()
                title = re.sub(r"^#\S+\s*", "", title)

            # 本文抽出
            candidates = [
                soup.find("div", id="text_copy"),
                soup.find("textarea", id="copy_text"),
                soup.find("div", class_="prompt-text"),
                soup.find("div", class_="box_txt"),
                soup.find("pre"),
                soup.find("code")
            ]

            content = ""
            for candidate in candidates:
                if candidate:
                    content = candidate.get_text().strip()
                    break

            if not content:
                main_div = soup.find("main") or soup.find("div", class_="container") or soup.find("body")
                if main_div:
                    content = main_div.get_text().strip()

            return {"title": title, "content": content}

        except Exception as e:
            log(f"  Error fetching {url}: {e}")
            time.sleep(2 ** attempt)

    return None


def detect_changes(upstream_tree, prev_meta, raw_data):
    """上流と現在のデータを比較して変更を検出する"""

    # 上流の全ファイル名 → link_id マッピング
    upstream_link_ids = {}
    for name, info in upstream_tree.items():
        lid = upstream_name_to_link_id(name)
        upstream_link_ids[lid] = name

    # 現在のG-prefix link_ids（上流から追加されたもの）
    current_g_link_ids = set()
    current_numeric_link_ids = set()
    current_special_link_ids = set()
    for item in raw_data:
        lid = str(item[2])
        if lid.startswith("G"):
            current_g_link_ids.add(lid)
        elif re.match(r"^[Sd]", lid):
            current_special_link_ids.add(lid)
        elif lid not in ("0", ""):
            current_numeric_link_ids.add(lid)

    all_current_link_ids = current_g_link_ids | current_numeric_link_ids | current_special_link_ids

    # ─── 追加検知 ───
    added = []
    for lid, name in upstream_link_ids.items():
        if lid not in all_current_link_ids:
            added.append({"link_id": lid, "name": name, "info": upstream_tree[name]})

    # ─── 削除検知 ───
    # 全てのプロンプトで上流に存在しないものを検出
    deleted = []
    trackable_ids = all_current_link_ids
    for lid in trackable_ids:
        if lid not in upstream_link_ids:
            deleted.append({"link_id": lid})

    # ─── 更新検知（SHA比較） ───
    updated = []
    for lid in all_current_link_ids:
        if lid not in upstream_link_ids:
            continue
        name = upstream_link_ids[lid]
        current_sha = upstream_tree[name]["sha"]
        prev_sha = prev_meta.get(name, {}).get("sha", "")

        if prev_sha and current_sha != prev_sha:
            updated.append({
                "link_id": lid,
                "name": name,
                "info": upstream_tree[name],
            })

    return added, deleted, updated


def apply_additions(added, raw_data, contents):
    """新規プロンプトを追加"""
    if not added:
        return 0

    next_id = max(item[0] for item in raw_data) + 1
    count = 0

    for i, item in enumerate(added):
        file_path = item["info"]["file"]
        link_id = item["link_id"]
        log(f"  追加 [{i+1}/{len(added)}] {file_path} ...", )

        result = fetch_prompt_page(file_path)
        if result is None or not result.get("title"):
            log(f"    SKIP (404 or no content)")
            time.sleep(SLEEP_TIME)
            continue

        title = result["title"]
        body = result.get("content", "")

        # raw_data: [ID, Title, LinkID, C1, C2, C3, Sub, Tag, IsNew]
        entry = [next_id, title, link_id, 0, 0, 0, 0, 0, 1]
        raw_data.append(entry)

        if body:
            contents[str(next_id)] = body

        log(f"    OK (ID={next_id}, '{title[:40]}')")
        next_id += 1
        count += 1
        time.sleep(SLEEP_TIME)

    return count


def apply_deletions(deleted, raw_data, contents):
    """削除されたプロンプトを除去"""
    if not deleted:
        return 0

    # link_idベースで削除対象を特定（インデックスに依存しない）
    delete_link_ids = set(item["link_id"] for item in deleted)
    ids_to_remove = set()
    count = 0

    for item in raw_data:
        lid = str(item[2])
        if lid in delete_link_ids:
            ids_to_remove.add(str(item[0]))
            log(f"  削除: link_id={lid}, title='{item[1]}'")
            count += 1

    # raw_dataからlink_idが一致するものをフィルタ除去
    raw_data[:] = [item for item in raw_data if str(item[2]) not in delete_link_ids]

    # contentsから削除
    for rid in ids_to_remove:
        contents.pop(rid, None)

    return count


def apply_updates(updated, raw_data, contents):
    """更新されたプロンプトの内容を再取得"""
    if not updated:
        return 0

    # 削除後にインデックスがずれるため、link_idでraw_dataを検索する
    link_id_map = get_link_id_map(raw_data)

    count = 0
    for i, item in enumerate(updated):
        file_path = item["info"]["file"]
        link_id = item["link_id"]
        idx = link_id_map.get(link_id)
        log(f"  更新 [{i+1}/{len(updated)}] {file_path} ...", )

        result = fetch_prompt_page(file_path)
        if result is None:
            log(f"    SKIP (fetch failed)")
            time.sleep(SLEEP_TIME)
            continue

        if idx is not None:
            old_title = raw_data[idx][1]
            new_title = result.get("title", old_title)
            rid = str(raw_data[idx][0])

            # タイトル更新
            if new_title and new_title != old_title:
                raw_data[idx][1] = new_title
                log(f"    タイトル更新: '{old_title}' → '{new_title}'")

            # 本文更新
            new_body = result.get("content", "")
            if new_body:
                old_body = contents.get(rid, "")
                if new_body != old_body:
                    contents[rid] = new_body
                    log(f"    本文更新: ID={rid}")

            count += 1
        else:
            log(f"    SKIP (link_id={link_id} が見つかりません)")
        time.sleep(SLEEP_TIME)

    return count


def generate_report(added_count, deleted_count, updated_count, added, deleted, updated):
    """GitHub Actions PR用の変更レポートを生成"""
    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "summary": {
            "added": added_count,
            "deleted": deleted_count,
            "updated": updated_count,
            "total_changes": added_count + deleted_count + updated_count
        },
        "details": {
            "added": [{"link_id": a["link_id"], "file": a["info"]["file"]} for a in added[:50]],
            "deleted": [{"link_id": d["link_id"]} for d in deleted],
            "updated": [{"link_id": u["link_id"], "file": u["info"]["file"]} for u in updated[:50]]
        }
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    return report


def main():
    log("=" * 60)
    log("南陽市DXプロンプトライブラリ - 上流データ完全同期")
    log("=" * 60)

    # ─── データ読み込み ───
    log("\n現在のデータを読み込み中...")
    raw_data, contents = load_data()
    prev_meta = load_upstream_meta()
    log(f"  エントリ数: {len(raw_data)}")
    log(f"  コンテンツ数: {len(contents)}")
    log(f"  前回メタデータ: {len(prev_meta)} files")

    # ─── 上流ツリー取得 ───
    upstream_tree = get_upstream_tree()
    if upstream_tree is None:
        log("上流ツリーの取得に失敗しました。終了します。")
        return

    # ─── 変更検出 ───
    log("\n変更を検出中...")
    added, deleted, updated = detect_changes(upstream_tree, prev_meta, raw_data)
    log(f"  新規: {len(added)} 件")
    log(f"  削除: {len(deleted)} 件")
    log(f"  更新: {len(updated)} 件")

    if not added and not deleted and not updated:
        log("\n変更なし。データは最新です。")
        # メタデータは常に更新（初回同期時のため）
        save_upstream_meta(upstream_tree)
        generate_report(0, 0, 0, [], [], [])
        return

    # ─── 変更適用 ───
    log("\n--- 削除処理 ---")
    deleted_count = apply_deletions(deleted, raw_data, contents)

    log("\n--- 更新処理 ---")
    updated_count = apply_updates(updated, raw_data, contents)

    log("\n--- 追加処理 ---")
    added_count = apply_additions(added, raw_data, contents)

    # ─── データ保存 ───
    log("\nデータを保存中...")
    save_data(raw_data, contents)

    # ─── メタデータ保存 ───
    save_upstream_meta(upstream_tree)

    # ─── レポート生成 ───
    report = generate_report(added_count, deleted_count, updated_count, added, deleted, updated)

    # ─── サマリー ───
    log(f"\n{'=' * 60}")
    log(f"同期完了!")
    log(f"  追加: {added_count} 件")
    log(f"  削除: {deleted_count} 件")
    log(f"  更新: {updated_count} 件")
    log(f"  合計エントリ数: {len(raw_data)}")
    log(f"  合計コンテンツ数: {len(contents)}")
    log(f"  レポート: {REPORT_PATH}")
    log(f"{'=' * 60}")


if __name__ == "__main__":
    main()
