
import boto3
from botocore.exceptions import NoCredentialsError

def upload_file(file, bucket_name, object_name=None):
    """Upload a file to an S3 bucket

    :param file: File to upload
    :param bucket_name: Bucket to upload to
    :param object_name: S3 object name. If not specified, filename is used
    :return: URL of the uploaded file, or None if upload fails
    """
    if object_name is None:
        object_name = file.filename

    s3_client = boto3.client('s3')
    try:
        s3_client.upload_fileobj(
            file,
            bucket_name,
            object_name,
            ExtraArgs={'ACL': 'public-read', 'ContentType': file.content_type}
        )
        url = f"https://{bucket_name}.s3.amazonaws.com/{object_name}"
        return url
    except NoCredentialsError:
        print("Credentials not available")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None
