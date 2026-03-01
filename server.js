const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css'
};

const server = http.createServer((req, res) => {
    // Handle saving accuracy scores
    if (req.method === 'POST' && req.url === '/save-accuracy') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const accuracyMap = JSON.parse(body);
                updateWordsFile(accuracyMap);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Serve static files
    let filePath = req.url === '/' ? '/game.html' : req.url;
    filePath = path.join(__dirname, filePath);

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

function updateWordsFile(accuracyMap) {
    const wordsPath = path.join(__dirname, 'words.js');
    let content = fs.readFileSync(wordsPath, 'utf8');

    // Update each accuracy value in the file
    for (const [french, accuracy] of Object.entries(accuracyMap)) {
        // Escape special regex characters in the french word
        const escaped = french.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(
            `(french:\\s*"${escaped}"[^}]*accuracy:\\s*)([\\d.]+)`,
            'g'
        );
        content = content.replace(regex, `$1${accuracy.toFixed(1)}`);
    }

    fs.writeFileSync(wordsPath, content, 'utf8');
    console.log('Updated words.js with new accuracy scores');
}

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Open this URL in your browser to play the game');
});
