const https = require('https');
const fs = require('fs');
const path = require('path');

// Book covers to download
const bookCovers = [
  { url: 'https://images-na.ssl-images-amazon.com/images/I/81XwUkicJ5L.jpg', filename: 'righteous-mind.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71NBtCxq8CL.jpg', filename: 'night.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/91EBG9Pi2OL.jpg', filename: 'fantasyland.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71aFQ7O2GOL.jpg', filename: 'abundance.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/91C5wVhNvjL.jpg', filename: 'color-of-law.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71hBRBJd0YL.jpg', filename: 'lets-get-real.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/51e7cHBwbsL.jpg', filename: 'policy-making.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/81S0AB3qZ8L.jpg', filename: 'jesus-john-wayne.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71Fqo3AnYFL.jpg', filename: 'peoples-history.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/81XGzHX2YWL.jpg', filename: 'on-tyranny.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71BVdJwFJxL.jpg', filename: 'pink-triangle.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71QqnHGSy8L.jpg', filename: 'they-thought-free.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71t2WRqF4aL.jpg', filename: 'limits-of-power.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71xGQP6hwoL.jpg', filename: 'easy-spanish.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/81fEcMKXJjL.jpg', filename: 'four-thousand-weeks.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71vK0WVQ4rL.jpg', filename: 'how-to-win-friends.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71AOMYlUzQL.jpg', filename: 'master-senate.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71fCCvvKMLL.jpg', filename: 'means-ascent.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71a5HQ8fKTL.jpg', filename: 'passage-power.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71r9CXkjsVL.jpg', filename: 'path-to-power.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/81s6DUyQCZL.jpg', filename: 'mans-search-meaning.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71f2R9pZZGL.jpg', filename: 'sapiens.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71+DsiqmJML.jpg', filename: 'dreyers-english.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71DJlQoRs3L.jpg', filename: 'lean-enterprise.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/91UKm+QqpEL.jpg', filename: 'remarkably-bright.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71JUJ6pGoIL.jpg', filename: 'animal-farm.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/81E+imjWnCL.jpg', filename: 'how-we-learn.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/81R1qZ9eQFL.jpg', filename: 'walk-in-woods.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71A+qdT2IGL.jpg', filename: 'salt-history.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71hIDw1DFkL.jpg', filename: 'dataclysm.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/81DJY8x9jHL.jpg', filename: 'phoenix-project.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71mN3c0k9kL.jpg', filename: 'reason-i-jump.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71z-9KzfnGL.jpg', filename: 'who-moved-cheese.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71qDf4CmplL.jpg', filename: 'bogleheads-guide.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/710Yl5TtGXL.jpg', filename: 'surprising-meetings.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/81gTRv2HXrL.jpg', filename: 'cant-hurt-me.jpg' },
  { url: 'https://images-na.ssl-images-amazon.com/images/I/71f8U5Uv3EL.jpg', filename: 'demon-haunted.jpg' }
];

// Create book_images directory if it doesn't exist
const dir = path.join(__dirname, 'book_images');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// Download function
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(dir, filename));
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(path.join(dir, filename), () => {}); // Delete file on error
      console.error(`✗ Error downloading ${filename}:`, err.message);
      reject(err);
    });
  });
}

// Download all covers
async function downloadAllCovers() {
  console.log('Starting book cover downloads...\n');
  
  for (const cover of bookCovers) {
    try {
      await downloadImage(cover.url, cover.filename);
    } catch (err) {
      console.error(`Failed to download ${cover.filename}`);
    }
  }
  
  console.log('\nDownload complete!');
}

downloadAllCovers();