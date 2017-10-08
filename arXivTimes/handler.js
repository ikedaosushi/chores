'use strict';
var request = require('superagent')
  , _ = require('lodash')
  , c_token = '03de1d3a24aeb0392fcba36381804d0b'
  , room_id = '64248330'
  , chatwork_tmplt = _.template('[info][title]<%= title %>[/title]<%= wrap %>\r\n<%= url %>[/info]')
  ;

module.exports.arxivtimes = (event, context, callback) => {
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
