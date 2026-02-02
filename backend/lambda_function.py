import json
import boto3
import os
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('MusicToysDB')

def lambda_handler(event, context):
    # Get the origin from the request
    headers_in = event.get('headers', {})
    origin = headers_in.get('origin') or headers_in.get('Origin')
    
    # Define allowed origins
    # For a public educational tool, we might want to allow all origins or specific ones.
    # Allowing * for now to support various local/classroom environments.
    allow_origin = '*'
    
    # If specific restriction is needed later:
    # allowed_origins = [ ... ]
    # if origin in allowed_origins: allow_origin = origin
    
    # CORS headers
    headers = {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    # Determine HTTP method
    method = event.get('requestContext', {}).get('http', {}).get('method')
    if not method:
        method = event.get('httpMethod') # Fallback

    # Handle OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'OK'})
        }

    # Handle GET request (Fetch history)
    if method == 'GET':
        try:
            params = event.get('queryStringParameters', {}) or {}
            admin_key = params.get('adminKey')
            
            # Use environment variable for secret, fallback for local test
            secret = os.environ.get('ADMIN_KEY', 'admin_secret_123')

            # Admin Scan logic
            if admin_key == secret:
                try:
                    # Scan all items
                    # Note: scan is expensive, use cautiously. 
                    # For production, consider pagination.
                    response = table.scan()
                    items = response.get('Items', [])
                    
                    # Convert types
                    for item in items:
                        for k, v in item.items():
                            if isinstance(v, Decimal):
                                item[k] = float(v) if v % 1 else int(v)
                                
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps(items)
                    }
                except Exception as e:
                    print(f"Scan error: {e}")
                    return {
                        'statusCode': 500,
                        'headers': headers,
                        'body': json.dumps({'message': 'Scan failed', 'error': str(e)})
                    }

            # Normal User Query logic
            user_id = params.get('userId')
            query_type = params.get('type')

            # Leaderboard Query
            if query_type == 'leaderboard':
                game_id = params.get('gameId')
                if not game_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'message': 'Missing gameId parameter for leaderboard'})
                    }
                
                try:
                    # Query GSI: LeaderboardIndex (PK: gameId, SK: score)
                    response = table.query(
                        IndexName='LeaderboardIndex',
                        KeyConditionExpression=Key('gameId').eq(game_id),
                        ScanIndexForward=False, # Descending order (High score first)
                        Limit=10
                    )
                    items = response.get('Items', [])
                    
                    # Convert Decimal
                    for item in items:
                        for k, v in item.items():
                            if isinstance(v, Decimal):
                                item[k] = float(v) if v % 1 else int(v)
                                
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps(items)
                    }
                except Exception as e:
                    print(f"Leaderboard query error: {e}")
                    return {
                        'statusCode': 500,
                        'headers': headers,
                        'body': json.dumps({'message': 'Leaderboard query failed', 'error': str(e)})
                    }
            
            # User History Query
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'message': 'Missing userId or adminKey parameter'})
                }

            # Query by userId (PK), sorted by Timestamp (SK)
            response = table.query(
                KeyConditionExpression=Key('userId').eq(user_id)
            )
            items = response.get('Items', [])

            # Convert Decimal to float/int for JSON serialization
            for item in items:
                for k, v in item.items():
                    if isinstance(v, Decimal):
                        item[k] = float(v) if v % 1 else int(v)

            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(items)
            }
        except Exception as e:
            print(e)
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'message': 'Internal Server Error', 'error': str(e)})
            }

    # Handle POST request (Save result)
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            
            if not body.get('userId') or not body.get('timestamp'):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'message': 'Missing required fields: userId, timestamp'})
                }

            item = {
                'userId': body.get('userId'), # PK (Browser ID)
                'timestamp': body.get('timestamp'), # SK
                'gameId': body.get('gameId', '001_chord_quiz'), # GSI PK (Default to 001 for backward compatibility)
                'name': body.get('name', 'Unknown'), 
                'level': body.get('level'),
                'score': body.get('score', 0), # GSI SK
                'total': body.get('total'),
                'rate': body.get('rate'),
                'settings': body.get('settings', {})
            }
            
            # Float to Decimal for DynamoDB
            for k, v in item.items():
                if isinstance(v, float):
                    item[k] = Decimal(str(v))

            table.put_item(Item=item)

            # Enforce 100 records limit per user
            try:
                # Query timestamps only, oldest first
                response = table.query(
                    KeyConditionExpression=Key('userId').eq(item['userId']),
                    ProjectionExpression='#ts',
                    ExpressionAttributeNames={'#ts': 'timestamp'}
                )
                items = response.get('Items', [])
                
                if len(items) > 100:
                    # Delete oldest items
                    to_delete = items[:len(items) - 100]
                    with table.batch_writer() as batch:
                        for d in to_delete:
                            batch.delete_item(Key={'userId': item['userId'], 'timestamp': d['timestamp']})
            except Exception as e:
                print(f"Error enforcing limit: {e}")
                # Don't fail the request if cleanup fails

            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Success'})
            }

        except Exception as e:
            print(e)
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'message': 'Internal Server Error', 'error': str(e)})
            }

    return {
        'statusCode': 400,
        'headers': headers,
        'body': json.dumps({'message': 'Unsupported method'})
    }
