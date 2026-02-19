#!/usr/bin/env python3
"""
南陽市DXプロンプトライブラリ - 上流データ同期スクリプト

nanyo-line/prompt GitHubリポジトリから新規プロンプトを取得し、
raw_data.json と contents.json を更新する。
"""

import requests
import json
import re
import time
import os
from bs4 import BeautifulSoup

# ─── 設定 ─────────────────────────────────────────────────────────────────────
GITHUB_API_TREE = "https://api.github.com/repos/nanyo-line/prompt/git/trees/main?recursive=1"
RAW_CONTENT_BASE = "https://raw.githubusercontent.com/nanyo-line/prompt/main"
SLEEP_TIME = 1.0

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

RAW_DATA_PATH = os.path.join(PROJECT_ROOT, "src", "data", "raw_data.json")
CONTENTS_PATH = os.path.join(PROJECT_ROOT, "src", "data", "contents.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Prompt748 Sync Bot)"
}


def get_upstream_prompt_files():
    """GitHubリポジトリから全プロンプトHTMLファイル一覧を取得する"""
    print("上流リポジトリのファイル一覧を取得中...")

    # GitHub API でツリー情報を取得
    token = os.environ.get("GITHUB_TOKEN", "")
    headers = {**HEADERS}
    if token:
        headers["Authorization"] = f"token {token}"

    try:
        resp = requests.get(GITHUB_API_TREE, headers=headers, timeout=30)

        if resp.status_code == 403:
            print("GitHub API rate limit. GITHUB_TOKEN を設定してください。")
            print("フォールバック: 既知の範囲をスキャンします...")
            return scan_known_range()

        if resp.status_code != 200:
            print(f"GitHub API エラー: {resp.status_code}")
            return scan_known_range()
    except requests.exceptions.RequestException as e:
        print(f"GitHub API リクエストエラー: {e}")
        print("フォールバック: 既知の範囲をスキャンします...")
        return scan_known_range()

    tree = resp.json().get("tree", [])
    prompt_files = {}

    for item in tree:
        path = item["path"]
        if not path.endswith(".html"):
            continue

        name = path.replace(".html", "")

        # skip OLD/demo/test files
        if "OLD" in name or "demo" in name or "test" in name:
            continue

        # Categorize by prefix
        if re.match(r"^\d+$", name):
            num = int(name)
            prompt_files[num] = {"type": "numeric", "file": path, "num": num}
        elif re.match(r"^S\d+$", name):
            prompt_files[f"S{name[1:]}"] = {"type": "S", "file": path, "id": name}
        elif re.match(r"^d\d+$", name):
            prompt_files[f"d{name[1:]}"] = {"type": "d", "file": path, "id": name}

    print(f"  上流プロンプトファイル数: {len(prompt_files)}")
    return prompt_files


def scan_known_range():
    """API制限時のフォールバック: 既知範囲をHTTPでスキャン"""
    prompt_files = {}
    print("既知の範囲 (1-1019, S001-S019, d001-d004) をスキャン中...")

    # Numeric range
    for num in range(1, 1020):
        name = str(num).zfill(3) if num < 100 else str(num)
        prompt_files[num] = {"type": "numeric", "file": f"{name}.html", "num": num}

    # S-prefix
    for i in range(1, 20):
        sid = f"S{str(i).zfill(3)}"
        prompt_files[sid] = {"type": "S", "file": f"{sid}.html", "id": sid}

    # d-prefix
    for i in range(1, 5):
        did = f"d{str(i).zfill(3)}"
        prompt_files[did] = {"type": "d", "file": f"{did}.html", "id": did}

    return prompt_files


def get_existing_link_ids(raw_data):
    """現在のデータから既存のlink_idセットを取得"""
    link_ids = set()
    for item in raw_data:
        link_ids.add(str(item[2]))
    return link_ids


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
                # "#750 読者の..." / "#S001 ..." / "#DEMO001 ..." → タイトルのみ
                title = re.sub(r"^#\S+\s*", "", title)

            # 本文抽出 (scraper/main.py と同じロジック)
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
            print(f"  Error fetching {url}: {e}")
            time.sleep(2 ** attempt)

    return None


def find_new_prompts(upstream_files, raw_data):
    """上流にあって現在のデータにないプロンプトを特定"""
    existing_link_ids = get_existing_link_ids(raw_data)

    new_prompts = []

    for key, info in upstream_files.items():
        if info["type"] == "numeric":
            num = info["num"]
            # 既存の数値ID or G-prefix IDとして存在するか?
            if str(num) in existing_link_ids or f"G{num}" in existing_link_ids:
                continue
            new_prompts.append(info)
        elif info["type"] in ("S", "d"):
            # S/d prefix は新しいタイプ
            if info["id"] not in existing_link_ids:
                new_prompts.append(info)

    return new_prompts


def assign_next_id(raw_data):
    """次の利用可能なIDを取得"""
    max_id = max(item[0] for item in raw_data)
    return max_id + 1


def main():
    print("=" * 60)
    print("南陽市DXプロンプトライブラリ - 上流データ同期")
    print("=" * 60)

    # 現在のデータを読み込む
    print(f"\n現在のデータを読み込み中...")
    with open(RAW_DATA_PATH, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
    with open(CONTENTS_PATH, "r", encoding="utf-8") as f:
        contents = json.load(f)

    print(f"  現在のエントリ数: {len(raw_data)}")
    print(f"  現在のコンテンツ数: {len(contents)}")

    # 上流ファイル一覧を取得
    upstream_files = get_upstream_prompt_files()

    # 新規プロンプトを特定
    new_prompts = find_new_prompts(upstream_files, raw_data)
    print(f"\n新規プロンプト数: {len(new_prompts)}")

    if not new_prompts:
        print("新しいプロンプトはありません。データは最新です。")
        return

    # 新規プロンプトのソート (数値順)
    new_prompts.sort(key=lambda x: x.get("num", 0))

    # 新規プロンプトを取得して追加
    next_id = assign_next_id(raw_data)
    added = 0
    errors = 0

    print(f"\n新規プロンプトを取得中...")
    for i, info in enumerate(new_prompts):
        file_path = info["file"]
        print(f"  [{i+1}/{len(new_prompts)}] {file_path} ...", end=" ", flush=True)

        result = fetch_prompt_page(file_path)

        if result is None or not result.get("title"):
            print("SKIP (404 or no content)")
            errors += 1
            time.sleep(SLEEP_TIME)
            continue

        title = result["title"]
        body = result.get("content", "")

        # link_id を決定
        if info["type"] == "numeric":
            link_id = f"G{info['num']}"
        else:
            link_id = info["id"]

        # raw_data エントリを追加
        # [ID, Title, LinkID, C1=0(その他), C2=0, C3=0, Sub=0, Tag=0, IsNew=1]
        entry = [next_id, title, link_id, 0, 0, 0, 0, 0, 1]
        raw_data.append(entry)

        # contents エントリを追加
        if body:
            contents[str(next_id)] = body

        print(f"OK (ID={next_id}, '{title[:30]}...')")
        next_id += 1
        added += 1
        time.sleep(SLEEP_TIME)

    # 結果を保存
    print(f"\nデータを保存中...")
    with open(RAW_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(raw_data, f, ensure_ascii=False)
    with open(CONTENTS_PATH, "w", encoding="utf-8") as f:
        json.dump(contents, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 60}")
    print(f"同期完了!")
    print(f"  追加: {added} 件")
    print(f"  エラー/スキップ: {errors} 件")
    print(f"  合計エントリ数: {len(raw_data)}")
    print(f"  合計コンテンツ数: {len(contents)}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
