import boto3
import io
import os
from PIL import Image

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
            region_name=os.environ.get('AWS_REGION', 'ap-south-1')
        )
        self.bucket_name = os.environ.get('AWS_S3_BUCKET')
        self.region = os.environ.get('AWS_REGION', 'ap-south-1')

    def upload_logo(self, file_obj, company_id):
        """
        Resizes and uploads a company logo to S3 in multiple sizes. 
        Returns a dictionary of S3 URLs.
        """
        sizes = {
            'small': (50, 50),
            'default': (100, 100),
            'medium': (200, 200),
            'large': (512, 512),
            'original': None, 
        }
        
        urls = {}
        image = Image.open(file_obj)
        image = image.convert("RGBA")

        for size_name, dimensions in sizes.items():
            img_copy = image.copy()
            
            if dimensions:
                img_copy.thumbnail(dimensions, Image.Resampling.LANCZOS)
            
            buffer = io.BytesIO()
            img_copy.save(buffer, format="PNG")
            buffer.seek(0)
            
            s3_path = f"logos/{company_id}/{size_name}_logo.png"
            
            self.s3_client.upload_fileobj(
                buffer,
                self.bucket_name,
                s3_path,
                ExtraArgs={'ContentType': 'image/png'}
            )
            
            # Correctly construct the URL using the configured region
            url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{s3_path}"
            urls[size_name] = url

        return urls