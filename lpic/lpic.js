const client = require('cheerio-httpcli')
    , CW = require('simple-cw-node')
    , cw_client = CW()
    , ROOM_ID = 66049348
    , DAY_MILLISECOND = 86400000
    , START_DATE = '2017-02-26'
    , NUMBER = Math.floor(( new Date() - new Date(START_DATE) ) / DAY_MILLISECOND);
cw_client.init({ token: '03de1d3a24aeb0392fcba36381804d0b' });


module.exports.notify = (event, context, callback) => {
    client.fetch("http://www.lpi.or.jp/ex/201/")
    .then((result)=>{
        $ = result.$;
        target_url = $('#main > ul > li > span > a')[NUMBER].attribs['href'];
        client.fetch(target_url)
        .then((result)=>{
            var $ = result.$;
            var text = $('.exercise').html().replace(/<br>/g, '\r\n').replace(/<.+>/g, '');
            var message = '[info][title](*)(*)今日のLPIC(*)(*)[/title]\r\n' + text + '解答はこちら\r\n' + $.documentInfo()['url'] + '[/info]';
            cw_client.post('rooms/'+ROOM_ID+'/messages', {
                body: message,
            }, function (err, res) {
                console.log('posted');
            });
        });
    });

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'maybe success!',
        input: event,
      }),
    };

    callback(null, response);
};

