
import requests
from bs4 import BeautifulSoup
import json
import time
from tqdm import tqdm
import os

# ─── 設定 ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
INPUT_FILE = os.path.join(PROJECT_ROOT, "src", "data", "raw_data.json")
OUTPUT_FILE = os.path.join(PROJECT_ROOT, "src", "data", "contents.json")
SLEEP_TIME = 1.5

def get_url(link_id):
    s_id = str(link_id)
    if s_id.startswith("G"):
        return f"https://nanyo-line.github.io/prompt/{s_id[1:]}.html"
    elif s_id == "573b":
        return "https://nanyo-city.jpn.org/download_prompt/download.php?download=573b"
    else:
        return f"https://nanyo-city.jpn.org/download_prompt/download.php?download={s_id}"

def fetch_prompt_content(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        response.encoding = response.apparent_encoding
        
        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, "html.parser")
        
        # 本文抽出ロジック（優先順位順）
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

        return content

    except Exception as e:
        print(f"Exception at {url}: {e}")
        return None

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        all_data = json.load(f)

    results = []
    # 既存の進行状況があれば読み込む（再開用）
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            results = json.load(f)
    
    processed_ids = {item["id"] for item in results if not item.get("error")}
    
    print(f"スクレイピングを開始します... (残りの件数: {len(all_data) - len(processed_ids)})")
    
    for item in tqdm(all_data):
        item_id = item[0]
        if item_id in processed_ids:
            continue

        title = item[1]
        link_id = item[2]
        target_url = get_url(link_id)
        
        body_text = fetch_prompt_content(target_url)
        
        if body_text:
            results.append({
                "id": item_id,
                "title": title,
                "link_id": link_id,
                "url": target_url,
                "prompt_body": body_text
            })
        else:
            results.append({
                "id": item_id,
                "title": title,
                "link_id": link_id,
                "error": True
            })
            
        time.sleep(SLEEP_TIME)
        
        if len(results) % 10 == 0:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
        
    print(f"\n完了しました。データは {OUTPUT_FILE} に保存されました。")

if __name__ == "__main__":
    main()
