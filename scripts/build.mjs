import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await cp('manifest.json', 'dist/manifest.json');
await cp('src/popup/popup.html', 'dist/popup.html');
await cp('src/popup/popup.css', 'dist/popup.css');

console.log('基础静态文件已同步到 dist/。');
console.log('提示：本项目已提交可直接加载的 dist/*.js，可直接在 Chrome 中加载 dist 目录。');
