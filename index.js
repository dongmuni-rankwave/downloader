const readline = require('readline');
const url = require('url');
const fs = require('fs');
const http = require('http');
const https = require('https');
const split = require('split');
const path = require('path');

var SAVE_PATH = './download';

function showUsage() {
    console.log(`node ${process.argv[1]} [options]`);
    console.log('    -d <dir> : download directory');
    console.log('');
}

function parseArgs() {
    let argv = process.argv;
    for (let i = 2; i < argv.length;) {
        let arg = argv[i++];
        switch (arg) {
            case '-h':
                showUsage();
                process.exit(0);
            case '-d':
                if (i < argv.length) {
                    arg = argv[i++];
                    SAVE_PATH = arg;
                } else {
                    showUsage();
                    console.error('-d <dir> argument is missing. (default: ./download)');
                    process.exit(-1);
                }
                break;
            default:
                showUsage();
                console.error('Unknown argument: ', arg);
                process.exit(-1);
        }
    }
}

function initDir() {
    if (!fs.existsSync(SAVE_PATH)) {
        fs.mkdirSync(SAVE_PATH, { recursive: true });
    }
}

function processLine(line) {
    let parsed = url.parse(line);
    if (parsed.protocol !== 'http:' && parsed.protocol != 'https:') {
        console.log(`NOT URL: ${line}`);
        return;
    }
    let tokens = parsed.pathname.split(/[\/\\]/).map(token => token.trim()).filter(token => token !== '');
    let file = tokens.length > 0 ? tokens[tokens.length - 1] : '';
    file = file ? file : (parsed.hostname + '.html');
    file = path.join(SAVE_PATH, file);

    if (fs.existsSync(file)) {
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
            console.log(`END: ${file} (${line})`);
        });
        res.on('error', error => {
            console.error(`RES-ERR: ${file} (${line})`);
            console.error(error);
            ws.close();
        });
    });

    req.on('error', error => {
        console.error(`REQ-ERR: ${file} (${line})`);
        console.error(error);
        if (ws) {
            ws.close();
            ws = null;
        }
    });
}

parseArgs();

initDir();

process.stdin.pipe(split()).on('data', processLine)