from datetime import date, timedelta
import boto3

AK = 'AKIAJXDVPKKRSQAK344Q'
SK = 'RgmBfwaryJOl7dGr7WTw5nZmmtfQoakPGcAIxxG3'

CLI = boto3.Session(
    aws_access_key_id=AK,
    aws_secret_access_key=SK,
    region_name='us-east-1'
).client('cloudwatch')

SERVICE_NAMES = [
    'AmazonEC2',
    'AmazonRDS',
    'AmazonRoute53',
    'AmazonS3',
    'AmazonSNS',
    'AWSDataTransfer',
    'AWSLambda',
    'AWSQueueService'
]

def notify(e, c):
    yesterday = (date.today() - timedelta(1)).strftime('%Y/%m/%d')


def get_invoice(service_name, target_date):

    dimensions = [
        {'Name': 'ServiceName', 'Value': service_name},
        {'Name': 'Currency', 'Value': 'USD'}
    ]
    params = {
        "Namespace":'AWS/Billing',
        "MetricName": 'EstimatedCharges',
        "Period": 86400,
        "StartTime": "{} 00:00:00".format(target_date),
        "EndTime": "{} 23:59:59".format(target_date),
        "Statistics": ['Average'],
        "Dimensions": dimensions
    }
    print(params)

    data = CLI.get_metric_statistics(**params)

    return data

def test():
    yesterday = (date.today() - timedelta(1)).strftime('%Y/%m/%d')
    data = get_invoice('AmazonEC2', yesterday)
    return data