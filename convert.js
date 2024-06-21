const FileSystem = require('fs');
const MarkdownConverter = require('showdown').Converter;
const minifyHTML = require('html-minifier').minify;

// 이전 빌드로 인해 build 폴더가 이미 존재하면 삭제
if (FileSystem.existsSync('./build')) {
  FileSystem.rmSync('./build', { recursive: true });
}

// 결과물을 담기 위한 build 폴더 생성
FileSystem.mkdirSync('./build');

// 모든 Layout 파일을 읽어오기
const indexLayout = FileSystem.readFileSync('./layouts/index.html', 'utf-8');
const postLayout = FileSystem.readFileSync('./layouts/post.html', 'utf-8');

// 모든 Markdown 파일을 읽어와 HTML로 변환
const markdownConverter = new MarkdownConverter({
  noHeaderId: true,
  simplifiedAutoLink: true,
  parseImgDimensions: true,
  tables: true,
});

for (const filename of FileSystem.readdirSync('./posts')) {
  const markdown = FileSystem.readFileSync(`./posts/${filename}`, 'utf-8');
  const html = markdownConverter.makeHtml(markdown);
  const minifiedHTML = minifyHTML(postLayout.replace('<!-- TITLE -->', filename.replace('.md', '').substring(11)).replace('<!-- BODY -->', html), {
    removeAttributeQuotes: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
    collapseWhitespace: true,
  });

  FileSystem.writeFileSync(`./build/${filename.replace('.md', '.html')}`, minifiedHTML);
}

// 홈페이지의 index.html 생성
const postList = FileSystem.readdirSync('./posts')
  .sort((a, b) => new Date(b.substring(0, 10)) - new Date(a.substring(0, 10)))
  .map((filename) => `<li><a href="./${filename.replace('.md', '.html')}">${filename.replace('.md', '')}</a></li>`);

const minifiedIndexHTML = minifyHTML(indexLayout.replace('<!-- BODY -->', postList.join('')), {
  removeAttributeQuotes: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  sortClassName: true,
  useShortDoctype: true,
  collapseWhitespace: true,
});

FileSystem.writeFileSync('./build/index.html', minifiedIndexHTML);
