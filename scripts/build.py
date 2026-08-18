import os
import json
import re
import unicodedata
from PIL import Image

# 1. LOGIC CHUẨN HOÁ TÊN FILE (Suckless: Xử lý triệt để dấu & khoảng trắng)
def clean_name(name):
    base, ext = os.path.splitext(name)
    # Bỏ dấu tiếng Việt
    base = unicodedata.normalize('NFKD', base).encode('ASCII', 'ignore').decode('utf-8')
    # Thay thế ký tự không hợp lệ thành '-', gộp các '-' liền nhau và đưa về chữ thường
    base = re.sub(r'[^a-zA-Z0-9_.-]', '-', base)
    base = re.sub(r'-+', '-', base).strip('-').lower()
    return base + ext.lower()

# 2. LOGIC ĐỔI TÊN FILE VẬT LÝ
def normalize_files(path):
    if not os.path.exists(path): return
    if os.path.isdir(path):
        for entry in os.scandir(path):
            normalize_files(entry.path)
        return

    # Chỉ đổi tên khi phát hiện file chưa chuẩn
    dir_name = os.path.dirname(path)
    old_name = os.path.basename(path)
    new_name = clean_name(old_name)

    if new_name != old_name:
        os.rename(path, os.path.join(dir_name, new_name))

# 3. LOGIC TỐI ƯU ẢNH (Giữ nguyên gốc của bạn)
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

# 4. LOGIC BUILD DATA (Cập nhật Regex và đồng bộ tên file)
def build_data():
    if not os.path.exists('data.json'): return

    with open('data.json', 'r', encoding='utf-8') as f:
        content = f.read()

    # Callback cập nhật đường dẫn JSON: Chuẩn hoá tên -> Đổi đuôi thành .webp
    def update_path(match):
        prefix = match.group(1)   # VD: "./assets/"
        old_name = match.group(2) # VD: "Ảnh sản phẩm 3.JPG"
        new_name = clean_name(old_name)

        if new_name.endswith(('.jpg', '.jpeg', '.png')):
            new_name = os.path.splitext(new_name)[0] + '.webp'

        return f'{prefix}{new_name}'

    # Regex mới: [^"']+ khớp TOÀN BỘ tên file bao gồm khoảng trắng
    content = re.sub(r'([./]*assets/)([^"\']+)', update_path, content, flags=re.IGNORECASE)

    # Ghi lại data.json
    with open('data.json', 'w', encoding='utf-8') as f:
        f.write(content)

    # Chuẩn hoá "/assets/" thành "./assets/"
    content = re.sub(r'"/assets/', '"./assets/', content)

    # Đóng gói data.js
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(f"const portfolioData = {content};\n\nwindow.portfolioData = portfolioData;\n")


if __name__ == "__main__":
    # Luồng chạy 3 bước tuần tự (Pipeline Pattern)
    normalize_files('assets') # B1: Chuẩn hoá toàn bộ file vật lý sang chuẩn safe-web
    optimize('assets')        # B2: Convert qua WEBP & Resize trên nền file đã chuẩn hoá
    build_data()              # B3: Đồng bộ toàn bộ tên mới và đuôi WEBP vào JSON/JS
