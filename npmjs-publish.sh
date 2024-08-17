mkdir temp

cp ./package.json ./temp/package.json
cp ./index.js ./temp/index.js
cp ./README.md ./temp/README.md
cp ./LICENSE ./temp/LICENSE

npm publish ./temp

rm -rf temp