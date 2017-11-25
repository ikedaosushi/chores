'use strict';

const aws = require('aws-sdk')
    , url = require('url')
    , https = require('https')
    , cloudwatch = new aws.CloudWatch({region: 'us-east-1', endpoint: 'http://monitoring.us-east-1.amazonaws.com'});

const hookUrl = 'https://hooks.slack.com/services/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'
    , slackChannel = 'private-aws';

const postMessage = (message, callback)=> {
    var body = JSON.stringify(message);
    var options = url.parse(hookUrl);
    options.method = 'POST';
    options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    };

    var postReq = https.request(options, function(res) {
        var chunks = [];
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            return chunks.push(chunk);
        });
        res.on('end', function() {
            var body = chunks.join('');
            if (callback) {
                callback({
                    body: body,
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage
                });
            }
        });
        return res;
    });

    postReq.write(body);
    postReq.end();
};

module.exports.notify = function(event, context) {
    console.log('Start checking cloudwatch billing info.');

    var startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // get yesterday.

    var params = {
        MetricName: 'EstimatedCharges',
        Namespace: 'AWS/Billing',
        Period: 86400, /* 1 day */
        StartTime: startDate,
        EndTime: new Date(),
        Statistics: ['Maximum'],
        Dimensions: [
            {
                Name: 'Currency',
                Value: 'USD'
            }
        ]
    };
    cloudwatch.getMetricStatistics(params, function(err, data) {
        if (err) {
            console.error(err, err.stack);
            context.fail("Failed to get billing metrics." + err + err.stack);
        } else {
            console.log(data);
            var datapoints = data['Datapoints'];
            if (datapoints.length < 1) {
                console.error("There is no billing info.");
                context.fail("There is no billing info.");
            }

            var latestData = datapoints[datapoints.length - 1];
            console.log(latestData);

            var dateString = [startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()].join("/");
            var statusColor = "good";
            if (latestData['Maximum'] > 0) statusColor = "danger";

            var slackMessage = {
                channel: slackChannel,
                attachments: [
                    {
                        color:statusColor,
                        text:dateString + "'s billing is " + latestData['Maximum'] + "$"
                    }
                ]
            };

            postMessage(slackMessage, function(response) {
                if (response.statusCode < 400) {
                    console.info('Message posted successfully');
                    context.succeed();
                } else if (response.statusCode < 500) {
                    console.error("Error posting message to Slack API: " + response.statusCode + " - " + response.statusMessage);
                    context.succeed();
                } else {
                    // Let Lambda retry
                    context.fail("Server error when processing message: " + response.statusCode + " - " + response.statusMessage);
                }
            });
        }
    });
};
