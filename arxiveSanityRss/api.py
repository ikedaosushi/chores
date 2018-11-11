import json
import os
import decimal

import boto3
dynamodb = boto3.resource('dynamodb')

# This is a workaround for: http://bugs.python.org/issue16535
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return int(obj)
        return super(DecimalEncoder, self).default(obj)


def list(event, context):
    # print(event)
    # body = json.loads(event['body'])

    # limit = body.get('limit', 10)
    # print('limit: ', limit)

    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

    result = table.scan(Limit=10) # TODO

    response = {
        "statusCode": 200,
        "body": json.dumps(result['Items'], cls=DecimalEncoder)
    }

    return response
