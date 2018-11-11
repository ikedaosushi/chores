import os, json, logging
from datetime import datetime, timedelta

import requests, boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

SLACK_ENDPOINT = os.environ.get("SLACK_ENDPOINT")

def execute(e=None, c=None):
    logger.info('Checking invoice...')
    # Prepare to get metrics
    # client = boto3.Session(profile_name='sls').client('cloudwatch', region_name="us-east-1")
    client = boto3.Session().client('cloudwatch', region_name="us-east-1")
    service_names = ['AmazonEC2', 'AmazonRoute53', 'AmazonS3', 'AWSLambda', 'All']
    seconds_in_1day = 86400
    fields = []
    today = datetime.today()
    yesterday = today - timedelta(days=1)

    for service_name in service_names:
        # Setup dimensions
        dimensions = [{'Name': 'Currency', 'Value': 'USD'}]
        if service_name != "All":
            dimensions.append({'Name': 'ServiceName', 'Value': service_name})

        # Get metrics
        res = client.get_metric_statistics(
            Namespace='AWS/Billing', MetricName='EstimatedCharges', Dimensions=dimensions, StartTime=yesterday, EndTime=today, Period=seconds_in_1day, Statistics=['Average'])

        # Continue if response wouldn't have data
        if len(res['Datapoints']) == 0:
            continue

        # Append result to fields list
        invoice = res["Datapoints"][0].get('Average', '')
        field = {"title": service_name, "value": f"{invoice:.2f} USD"}
        fields.append(field)

    # Prepare to send messeage
    url = SLACK_ENDPOINT
    payload = {"text": "Your invoice", "username": "Invoice Notificater", "icon_emoji": ":moneybag:", "attachments": [{"fields": fields}]}
    logger.info(fields)

    # Send message
    requests.post(url, data=json.dumps(payload))

    response = {"statusCode": 200, "body": "success"}

    return response
