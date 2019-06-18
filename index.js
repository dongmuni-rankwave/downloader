const readline = require('readline');
const url = require('url');
const fs = require('fs');
const http = require('http');
const https = require('https');

const rl = readline.createInterface({
    input: process.stdin
});

const SAVE_PATH = '../';

rl.on('line', line => {
    let parsed = url.parse(line);
    if ( parsed.protocol !== 'http:' && parsed.protocol != 'https:' ) {
        console.log(`NOT URL: ${line}`);
        return;
    }
    let tokens = parsed.pathname.split(/[\/\\]/).map(token => token.trim()).filter(token => token !== '');
    let file = tokens.length > 0 ? tokens[tokens.length-1] : '';
    file = SAVE_PATH + (file ? file : (parsed.hostname + '.html'));

    if ( fs.existsSync(file) ) {
        console.log(`FILE EXISTS: ${file} (${line})`);
        return;
    }

    console.log(`START: ${file} (${line})`);

    let ua = parsed.protocol === 'https:' ? https : http;

    let ws = null;
    let req = ua.get(line, res => {
        ws = fs.createWriteStream(file);
        res.pipe(ws);
        res.on('end', () => {
            console.log(`END:   ${file} (${line})`);
        });
        res.on('error', error => {
            console.error(error);
            ws.close();
        });
    });

    req.on('error', error => {
        console.error(error);
        if ( ws ) {
            ws.close();
            ws = null;
        }
    });
});