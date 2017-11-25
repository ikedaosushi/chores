'use strict';

const path = require('path')
    , rp = require('request-promise-native')
    , _ = require('lodash')
    , sleep = require('sleep')
;

// setup environmental var
const envPath = path.join(process.cwd(), '.env');
require('dotenv').config(envPath);

const CHATWORK_TOKEN = process.env.CHATWORK_TOKEN
    // , ROOM_ID = process.env.ROOM_ID
    , ROOM_ID = process.env.TEST_ROOM_ID
    ;

const GITHUB_ENDPOINT = 'https://api.github.com/repos/arXivTimes/arXivTimes/issues'
    , CHATWORK_POST_ENDPOINT = `https://api.chatwork.com/v2/rooms/${ROOM_ID}/messages`
    , CHATWORK_UNREAD_ENDPOINT = `https://api.chatwork.com/v2/rooms/${ROOM_ID}/messages/unread`

function formatText(article){
    const template = _.template('[info][title]<%= title %>[/title]<%= wrap %>\r\n<%= url %>[/info]')
        , title = article['title']
        , url = article['html_url']
        , wrap = article['body']
        .match(/## 一言[\s\S]*### 論文/)[0]
        .replace('## 一言でいうと\r\n', '')
        .replace(/^\r\n/g, '')
        .replace('\r\n\r\n### 論文', '')
        , formattedText = template({
            'title': title,
            'wrap': wrap,
            'url': url
        })
    ;
    return formattedText;
}

module.exports.execute = (event, context, callback) => {
    const now = new Date()
        , oneHourAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 2, now.getMinutes())
    ;
    let options, response; 
    (async () => {
        options = {
            method: 'GET',
            uri: GITHUB_ENDPOINT,
            json: true,
            headers: {
                'User-Agent': 'serverless-bot'
            }
        };
        let articles = await rp(options);
        const newArticles = _.filter(articles, (article, _) => {
            const date = Date.parse(article['created_at']);
            return oneHourAgo < date
        });
        const messageBody = newArticles.map((article, _)=>{
            return formatText(article);
        }).join("");

        if(!messageBody){
            return;
        };

        options = {
            method: 'POST', 
            uri: CHATWORK_POST_ENDPOINT,
            form: {
                body:  messageBody
            },
            headers: {
                'User-Agent': 'serverless-bot',
                'X-ChatWorkToken': CHATWORK_TOKEN
            },
            json: true
        };
        response = await rp(options);
        const messageId = response['message_id'];

        // Wait 10 seconds because it needs some seconds until chatwork reflect post result 
        await sleep.sleep(10);

        options = {
            method: 'PUT',
            uri: CHATWORK_UNREAD_ENDPOINT,
            form: {
                message_id: messageId
            },
            headers: {
                'User-Agent': 'serverless-bot',
                'X-ChatWorkToken': CHATWORK_TOKEN
            },
            json: true
        };
        response = await rp(options);
        response = {
            statusCode: 200,
            body: 'Sucess🍺',
        };
        callback(null, response);

    })();
}

