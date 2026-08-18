import os
import sys
import json
import re
from PIL import Image

# 1. Logic tối ưu ảnh của bạn
def optimize(path):
    if not os.path.exists(path): return
    if os.path.isdir(path):
        for entry in os.scandir(path):
            optimize(entry.path)
        return

    ext = os.path.splitext(path)[1].lower()
    if ext not in ('.jpg', '.jpeg', '.png', '.webp'): return

    try:
        with Image.open(path) as img:
            if img.mode in ("RGBA", "P"): img = img.convert("RGB")
            if img.width > 1920:
                h = int(img.height * (1920 / img.width))
                img = img.resize((1920, h), Image.Resampling.LANCZOS)

            new_path = os.path.splitext(path)[0] + ".webp"
            img.save(new_path, "WEBP", quality=80, optimize=True)

        if ext != '.webp': os.remove(path)
    except Exception as e:
        print(f"Lỗi khi xử lý {path}: {e}")

# 2. Logic build data (Chuyển link ảnh thành .webp và bọc thành file data.js)
def build_data():
    if not os.path.exists('data.json'): return

    with open('data.json', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Chuyển tất cả link ảnh jpg/png thành .webp (Bao gồm cả /assets hay ./assets)
    content = re.sub(r'([./]*assets/[^"\'\s]+)\.(jpg|jpeg|png)', r'\1.webp', content, flags=re.IGNORECASE)

    # Ghi lại data.json (để CMS nhận diện đúng ảnh webp trong lần edit sau)
    with open('data.json', 'w', encoding='utf-8') as f:
        f.write(content)

    # 2. CHUẨN HOÁ: Ép tất cả "/assets/" thành "./assets/" để không bị lỗi 404 trên Github Pages
    content = re.sub(r'"/assets/', '"./assets/', content)

    # Đóng gói thành data.js cho Frontend sử dụng
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(f"const portfolioData = {content};\n\nwindow.portfolioData = portfolioData;\n")

if __name__ == "__main__":
    optimize('assets')
    build_data()
