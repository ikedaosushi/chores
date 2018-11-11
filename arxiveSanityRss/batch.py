import json
import re
import os
import time

from requests_html import HTMLSession
import boto3
dynamodb = boto3.resource('dynamodb')


def fetch(event, context):
    print('start')
    endpoint = 'http://www.arxiv-sanity.com/toptwtr?timefilter=day'
    session = HTMLSession()
    r = session.get(endpoint)
    script = r.html.find('script')[-1].text
    script = re.sub('.*var papers = ', '', script)
    json_ = re.sub('(?<=]);.+', '', script)
    data = json.loads(json_)
    print('loaded to dict')

    timestamp = int(time.time() * 1000)
    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

    print('adding to Dynamodb')

    for d in data:
        d['id'] = d['pid']
        d = {k: v for k, v in d.items() if v}
        # d['created_at'] = timestamp # TODO
        d['updated_at'] = timestamp
        table.put_item(Item=d)
    
    print('added')

    return {
        "statusCode": 200,
        "body": json.dumps({'added_item_size': len(data)})
    }
