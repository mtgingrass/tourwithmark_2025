#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findRawImageFolders(dir) {
  const folders = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (item === 'raw_image') {
          folders.push(fullPath);
        } else {
          traverse(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return folders;
}

function convertToWebp(inputFile, outputFile) {
  try {
    execSync(`cwebp "${inputFile}" -o "${outputFile}"`, { stdio: 'inherit' });
    console.log(`Converted: ${inputFile} -> ${outputFile}`);
  } catch (error) {
    console.error(`Error converting ${inputFile}:`, error.message);
  }
}

function processFolder(rawImageFolder) {
  const parentDir = path.dirname(rawImageFolder);
  const imagesDir = path.join(parentDir, 'images');
  
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  const files = fs.readdirSync(rawImageFolder);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.includes(ext)) {
      const inputPath = path.join(rawImageFolder, file);
      const outputName = path.basename(file, ext) + '.webp';
      const outputPath = path.join(imagesDir, outputName);
      
      convertToWebp(inputPath, outputPath);
    }
  }
}

function main() {
  const rootDir = process.cwd();
  const rawImageFolders = findRawImageFolders(rootDir);
  
  if (rawImageFolders.length === 0) {
    console.log('No raw_image folders found.');
    return;
  }
  
  console.log(`Found ${rawImageFolders.length} raw_image folder(s):`);
  rawImageFolders.forEach(folder => console.log(`  ${folder}`));
  
  for (const folder of rawImageFolders) {
    console.log(`\nProcessing: ${folder}`);
    processFolder(folder);
  }
  
  console.log('\nImage conversion complete!');
}

main();