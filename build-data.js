const fs = require('fs');
const yaml = require('js-yaml');

try {
  // 1. Đọc nội dung file yaml
  const fileContents = fs.readFileSync('./data.yaml', 'utf8');

  // 2. Chuyển YAML thành dạng Object
  const data = yaml.load(fileContents);

  // 3. Chuyển Object thành dạng JSON string
  const jsonString = JSON.stringify(data, null, 2);

  // 4. Bọc lại bằng biến Javascript y như cấu trúc cũ của bạn
  const output = `const portfolioData = ${jsonString};\n\nwindow.portfolioData = portfolioData;\n`;

  // 5. Ghi đè vào file data.js (file JS mà file HTML của bạn đang <script src="...">)
  fs.writeFileSync('./data.js', output, 'utf8');

  console.log('✅ Đã convert thành công data.yaml sang data.js!');
} catch (e) {
  console.error('❌ Lỗi khi convert file:', e);
  process.exit(1);
}
