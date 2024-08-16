const FileSystem = require('fs');
const minifyHTML = require('html-minifier').minify;
const MarkdownConverter = require('showdown').Converter;

// 이전 빌드로 인해 build 폴더가 이미 존재하면 삭제
if (FileSystem.existsSync('./build')) {
  FileSystem.rmSync('./build', { recursive: true });
}

// 결과물을 담기 위한 build 폴더 생성
FileSystem.mkdirSync('./build');

function createIndexHtml() {
  const layout = FileSystem.readFileSync('./layouts/index.html', 'utf-8');

  const items = [];

  for (const tag of FileSystem.readdirSync('./posts')) {
    let item = `<h3>${tag}</h3><ul>`;
    for (const post of FileSystem.readdirSync(`./posts/${tag}`).sort((a, b) => new Date(b.substring(0, 10)) - new Date(a.substring(0, 10)))) {
      item += `<li><pre>${post.substring(0, 10)} <a href="/${tag}/${post.substring(11)}.html">${post.substring(11)}</a></pre></li>`;
    }
    item += '</ul>';
    items.push(item);
  }

  const index = layout.replace('<!-- INDEX -->', items.join(''));

  FileSystem.writeFileSync(
    './build/index.html',
    minifyHTML(index, {
      removeAttributeQuotes: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      sortClassName: true,
      useShortDoctype: true,
      collapseWhitespace: true,
    }),
  );
}

createIndexHtml();

function createPostHtml() {
  const layout = FileSystem.readFileSync('./layouts/post.html', 'utf-8');

  const markdownConverter = new MarkdownConverter({
    noHeaderId: true,
    simplifiedAutoLink: true,
    parseImgDimensions: true,
    tables: true,
  });

  for (const tag of FileSystem.readdirSync('./posts')) {
    FileSystem.mkdirSync(`./build/${tag}`);
    FileSystem.mkdirSync(`./build/${tag}/images`);
    for (const post of FileSystem.readdirSync(`./posts/${tag}`)) {
      const markdown = FileSystem.readFileSync(`./posts/${tag}/${post}/post.md`, 'utf-8');
      const html = markdownConverter.makeHtml(markdown);
      const minifiedHTML = minifyHTML(layout.replace('<!-- TITLE -->', post.substring(11)).replace('<!-- BODY -->', html), {
        removeAttributeQuotes: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortClassName: true,
        useShortDoctype: true,
        collapseWhitespace: true,
      });
      FileSystem.writeFileSync(`./build/${tag}/${post.substring(11)}.html`, minifiedHTML);

      if (FileSystem.existsSync(`./posts/${tag}/${post}/images`)) {
        for (const image of FileSystem.readdirSync(`./posts/${tag}/${post}/images`)) {
          FileSystem.copyFileSync(`./posts/${tag}/${post}/images/${image}`, `./build/${tag}/images/${image}`);
        }
      }
    }
  }
}

createPostHtml();
