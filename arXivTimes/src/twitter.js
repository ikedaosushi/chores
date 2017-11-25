'use strict';
let Twitter = require('twitter')
  , request = require('superagent')
  , _ = require('lodash')
  , c_token = '03de1d3a24aeb0392fcba36381804d0b'
  , room_id = '64248330'
  , chatwork_tmplt = _.template('[info][title]<%= title %>[/title]<%= wrap %>\r\n<%= url %>[/info]')
  , client = new Twitter({
      consumer_key: 'ir2DksYpe9hmzPJnLqKBGxQCe',
      consumer_secret: 'm39ne6P8JgLGQRMy74jIvMTtdh3L6yftrkDd5LzTOSkAZT8Cxp',
      access_token_key: '136669186-vj2ii7uIqcFdy5FTm7KMIibQWdMlcwNBZgGBXTCF',
      access_token_secret: 'E5O4U0xe5UhNpQhcs3ah2teCJ31AfJjyJGf29vjkfNuFh'
    })
  ;

function extractLatestTweets(tweets){
  let now = new Date()
    , oneHourAgo = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours() - 1,
        now.getMinutes()
      )
    ;
  return _.filter(tweets, function(e, i){
    return oneHourAgo < new Date(e['created_at'])
  }).map(function(e, i){
    return chatwork_tmplt({
        title: 'hillbig on Twitter',
        wrap : e['text'],
        url  : 'https://twitter.com/hillbig/status/' + e['id_str']
    });
  }).join("");
};

module.exports.hillbig = (event, context, callback) => {
  let params = {screen_name: 'hillbig'};
  client.get('statuses/user_timeline', params)
    .then(function(tweets) {
      let tweetFormatted = extractLatestTweets(tweets)
        , url = 'https://api.chatwork.com/v2/rooms/'+room_id+'/messages'
        ;
      request
        .post(url)
        .field('body', tweetFormatted)
        .set('X-ChatWorkToken', c_token)
        .end(function(err, res){
          console.log(res);
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
