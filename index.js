#!/usr/bin/env node
const PATH = require('path');
const FILE_SYSTEM = require('fs');
const HTML_MINIFIER = require('html-minifier').minify;
const MARKDOWN_CONVERTER = require('showdown').Converter;

const WORKING_DIRECTORY = process.cwd();

function rm(path) {
  if (FILE_SYSTEM.existsSync(PATH.join(WORKING_DIRECTORY, path))) {
    FILE_SYSTEM.rmSync(PATH.join(WORKING_DIRECTORY, path), { recursive: true });
  }
}

function mkdir(path, options) {
  if (FILE_SYSTEM.existsSync(PATH.join(WORKING_DIRECTORY, path))) {
    if (options?.force) {
      rm(path);
    } else {
      return;
    }
  }
  FILE_SYSTEM.mkdirSync(PATH.join(WORKING_DIRECTORY, path));
}

function ls(path) {
  if (!FILE_SYSTEM.existsSync(PATH.join(WORKING_DIRECTORY, path))) {
    return [];
  }
  return FILE_SYSTEM.readdirSync(PATH.join(WORKING_DIRECTORY, path));
}

function cat(path) {
  return FILE_SYSTEM.readFileSync(PATH.join(WORKING_DIRECTORY, path), 'utf-8');
}

function cp(source, destination) {
  FILE_SYSTEM.copyFileSync(PATH.join(WORKING_DIRECTORY, source), PATH.join(WORKING_DIRECTORY, destination));
}

function write(path, content) {
  FILE_SYSTEM.writeFileSync(PATH.join(WORKING_DIRECTORY, path), content);
}

function convertMarkdownToHTML(markdown) {
  const markdownConverter = new MARKDOWN_CONVERTER({
    noHeaderId: true,
    simplifiedAutoLink: true,
    parseImgDimensions: true,
    tables: true,
  });

  return markdownConverter.makeHtml(markdown);
}

function minifyHTML(html) {
  return HTML_MINIFIER(html, {
    removeAttributeQuotes: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
    collapseWhitespace: true,
  });
}

// -------------------------------------------- //

rm('build');
mkdir('build');

const tags = ls('posts');
const posts = ls('posts')
  .map((tag) =>
    ls(`posts/${tag}`).map((post) => ({
      tag,
      post,
      createdAt: new Date(post.substring(0, 10)),
      markdown: cat(`posts/${tag}/${post}/post.md`),
    })),
  )
  .flat();

// Index
const indexLayout = cat('layouts/index.html');
const indexHtml = indexLayout.replace(
  '<!-- INDEX -->',
  tags
    .map((tag) => {
      let item = `<h3>${tag}</h3><ul>`;
      for (const post of posts.filter((post) => post.tag === tag).sort((a, b) => b.createdAt - a.createdAt)) {
        item += `<li><pre>${post.createdAt.toISOString().substring(0, 10)} <a href="/${tag}/${post.post.substring(11)}.html">${post.post.substring(11)}</a></pre></li>`;
      }
      item += '</ul>';
      return item;
    })
    .join(''),
);
write('build/index.html', minifyHTML(indexHtml));

// Posts
const postLayout = cat('layouts/post.html');
for (const post of posts.sort((a, b) => b.createdAt - a.createdAt)) {
  mkdir(`build/${post.tag}`);
  mkdir(`build/${post.tag}/images`);

  const html = convertMarkdownToHTML(post.markdown);
  const minifiedHTML = minifyHTML(postLayout.replace('<!-- TITLE -->', post.post.substring(11)).replace('<!-- BODY -->', html));
  write(`build/${post.tag}/${post.post.substring(11)}.html`, minifiedHTML);

  for (const image of ls(`./posts/${post.tag}/${post.post}/images`)) {
    cp(`./posts/${post.tag}/${post.post}/images/${image}`, `./build/${post.tag}/images/${image}`);
  }
}

// Assets
for (const asset of ls('assets')) {
  cp(`assets/${asset}`, `build/${asset}`);
}

// -------------------------------------------- //

console.log('Done!');
