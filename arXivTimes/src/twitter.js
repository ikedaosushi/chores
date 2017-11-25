'use strict';

const Twitter = require('twitter')
  , path = require('path')
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

const TWCLIENT = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

const CHATWORK_POST_ENDPOINT = `https://api.chatwork.com/v2/rooms/${ROOM_ID}/messages`
  , CHATWORK_UNREAD_ENDPOINT = `https://api.chatwork.com/v2/rooms/${ROOM_ID}/messages/unread`

const SCREEN_NAMES = [
  'hillbig',
  'ymatsuo',
  'hamadakoichi'
]

const extractLatestTweets = tweets => {
  const now = new Date()
    , oneHourAgo = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours() - 1,
        now.getMinutes()
      )
    ;
  const latestTweets =  _.filter(tweets, element=>{
    return oneHourAgo < new Date(element['created_at'])
  });

  return latestTweets;
};

const formatChatworkStyle = (tweets, screenName)=>{
  const formattedText = _.map(tweets, element => {
    const body = element['text'];
    const id = element['id_str'];
    const messageBody = `[info][title]${screenName} on Twitter[/title]${body}\r\nhttps://twitter.com/hillbig/status/${id} [/info]`;
    return messageBody;
  }).join("");
  return formattedText;
}

const searchLatestTweets = screenName => {
  const params = {
    screen_name: screenName
  }
  return new Promise(resolve => {
    TWCLIENT.get('statuses/user_timeline', params)
      .then(tweets => {
        const latestTweets = extractLatestTweets(tweets);
        resolve(latestTweets);
      });
  })

}

const NotifyToChatwork = screenName => {
  return new Promise(resolve => {
    (async () => {
      const tweets = await searchLatestTweets(screenName);
      const messageBody = formatChatworkStyle(tweets, screenName);
      let options, response;
      if(!messageBody) return;
      options = {
        method: 'POST',
        uri: CHATWORK_POST_ENDPOINT,
        form: {
          body: messageBody
        },
        headers: {
          'User-Agent': 'serverless-bot',
          'X-ChatWorkToken': CHATWORK_TOKEN
        },
        json: true
      };
      response = await rp(options);
      const messageId = response['message_id'];
      resolve(messageId);
    })();
  });
};

const markUnRead = messageId => {
  (async () => {  
    // Wait 10 seconds because it needs some seconds until chatwork reflect post result 
    await sleep.sleep(10);

    const options = {
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
  })();
}

module.exports.execute = (event, context, callback) => {
  let promises = [];
  let promise;
  SCREEN_NAMES.forEach(screenName => {
    promise = NotifyToChatwork(screenName);
    promises.push(promise);
  });
  Promise.all(promises)
    .then((messageIds) => {
      if (!_.isEmpty(messageIds)) {
        console.log(messageIds);
        markUnRead(_.min(messageIds));
      }

      const response = {
        statusCode: 200,
        body: JSON.stringify({
          message: 'success🍺',
          input: event,
        }),
      };
      callback(null, response);
    });
}

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
