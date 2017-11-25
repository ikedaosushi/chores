'use strict';

const path = require('path')
  , request = require('superagent')
  , _ = require('lodash')
  , sleep = require('sleep')
  ;

// setup environmental var 
const envPath = path.join(process.cwd(), '.env');
require('dotenv').config(envPath);
const CHATWORK_TOKEN = process.env.CHATWORK_TOKEN
  , ROOM_ID = process.env.ROOM_ID
  ;

const GITHUB_ENDPOINT = 'https://api.github.com/repos/arXivTimes/arXivTimes/issues'
  , CHATWORK_POST_ENDPOINT = `https://api.chatwork.com/v2/rooms/${ROOM_ID}/messages`
  , CHATWORK_UNREAD_ENDPOINT = `https://api.chatwork.com/v2/rooms/${ROOM_ID}/messages/unread`  
  ;

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

module.exports.test = (event, context, callback) => {
  const now = new Date()
    , oneHourAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, now.getHours() - 1, now.getMinutes())
    ;
  (async () => {
    try {
      const response = await request.get(GITHUB_ENDPOINT);
      const articles = JSON.parse(response.text);
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
      const responseCw = await request
        .post(CHATWORK_POST_ENDPOINT)
        .field('body', messageBody)
        .set('X-ChatWorkToken', CHATWORK_TOKEN)
        ;
      const message_id = responseCw.body.message_id;
      await sleep.sleep(10);
      await request
        .put(CHATWORK_UNREAD_ENDPOINT)
        .send({message_id: message_id})
        .set('X-ChatWorkToken', CHATWORK_TOKEN)
        ;
    } catch (error) {
      console.log(error);
    }
    
  })();

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'It\'s test',
      input: event,
    }),
  };

  callback(null, response);
}

module.exports.execute = (event, context, callback) => {
  var now = new Date();
  var one_hour_ago = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 1, now.getMinutes());
  request
    .get('https://api.github.com/repos/arXivTimes/arXivTimes/issues')
    .end(function(err, res){
        var response_json = JSON.parse(res.text);
        var message = _.filter(response_json, function(ele, idx){
            var ele_date = Date.parse(ele['created_at']);
            return one_hour_ago < ele_date
        }).map(function(ele, idx){
            var title = ele['title']
              , url = ele['html_url']
              , wrap = ele['body'].match(/## 一言[\s\S]*### 論文/)[0]
                .replace('## 一言でいうと\r\n', '')
                .replace(/^\r\n/g, '')
                .replace('\r\n\r\n### 論文', '');
            return chatwork_tmplt({
                'title': title,
                'wrap': wrap,
                'url': url
            });
        }).join("");
        if(!message){
          return
        };
        var url = 'https://api.chatwork.com/v2/rooms/'+room_id+'/messages';
        request
            .post(url)
            .field('body', message)
            .set('X-ChatWorkToken', c_token)
            .end(function(err, res){
                //console.log(res);
            });
  });
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'its dummy response',
      input: event,
    }),
  };

  callback(null, response);

};
