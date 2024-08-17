mkdir temp

cp ./package.json ./temp/package.json
cp ./README.md ./temp/README.md
cp ./index.js ./temp/index.js

npm publish ./temp

rm -rf temp