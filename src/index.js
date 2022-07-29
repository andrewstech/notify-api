var express = require('express');
const { Octokit } = require("@octokit/rest");
const fetch = require("node-fetch");
const cors = require('cors');
const rateLimit = require('express-rate-limit')
const robots = require('express-robots-txt')
var fs = require('fs')
var morgan = require('morgan')
var path = require('path')
const JSONdb = require('simple-json-db');
const db = new JSONdb('/home/ubuntu/storage.json');
const finisheddb = new JSONdb('/home/ubuntu/finished.json');
require('dotenv').config()


// start express
var app = express();

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})

// setup the logger
app.use(morgan('combined', {stream: accessLogStream}))


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/test/env', (req, res) => {
  res.send(process.env.test)
})

app.get('/pr/:pr', function(req, res){
    var pr = req.params.pr;
    var is_true = db.has(pr);

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const octokit = new Octokit({
        auth: GITHUB_TOKEN
    })
    if (is_true) {
        res.send('NO')
    } else {
        db.set(pr, 'True');
        fetch('https://raw.githubusercontent.com/is-a-dev/team-docs/main/pr-created.md')
        .then(response => response.text())
        .then(data => {
            // Do something with your data
            console.log(data);
            octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
                owner: 'is-a-dev',
                repo: 'register',
                issue_number: pr,
                body: data
            })
        });
        res.send('Done');
    };

});


app.get('/pr/merged/:pr', function(req, res){
    var pr = req.params.pr;
    var is_true = finisheddb.has(pr);

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const octokit = new Octokit({
        auth: GITHUB_TOKEN
    })
    if (is_true) {
        res.send('NO')
    } else {
        finisheddb.set(pr, 'True');
        fetch('https://raw.githubusercontent.com/is-a-dev/team-docs/main/pr-merged.md')
        .then(response => response.text())
        .then(data => {
            // Do something with your data
            console.log(data);
            octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
                owner: 'is-a-dev',
                repo: 'register',
                issue_number: pr,
                body: data
            })
        });
        res.send('Done');
    };

});



app.use(robots({
  UserAgent: '*',
  Disallow: '/'
}))




app.use(cors({
    origin: ['https://register.is-a.dev', '127.0.0.1', 'register.is-a.dev']
}));


const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 2, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to all requests
app.use(limiter)

if (!module.parent) {
    app.listen(3000);
    console.log('Express started on port 3000');
  }



