# Kills all items in a bucket
# Recycled code from dataLoader

from boto.s3.key import Key
from boto import s3
import sys
import csv
import argparse

def main(argv=sys.argv):
  SECRET_KEY_EXCEL_FIELD = 'Secret Access Key'
  ACCESS_KEY_EXCEL_FIELD = 'Access Key Id'

  parser = argparse.ArgumentParser(description='Process optional download flags')
  AUTH_HELP_TEXT = "path to credential csv file from Amazon. This will not be stored. CSV fieldnames must be \"" \
                        + SECRET_KEY_EXCEL_FIELD + "\" for secret key and \"" + ACCESS_KEY_EXCEL_FIELD +"\" for access key"
  parser.add_argument('--auth', dest='usersAuth', help=AUTH_HELP_TEXT, required=True)
  parser.add_argument('--buck', dest='bucketPath', help='Bucket name to clear',  required=True)
  # Parse stuff for authentication
  options = parser.parse_args(argv[1:])
  csvfile = open(options.usersAuth, 'rU') 
  reader = csv.DictReader(csvfile) 
  authLine = reader.next()
  accessKey = authLine[ACCESS_KEY_EXCEL_FIELD]
  secretKey = authLine[SECRET_KEY_EXCEL_FIELD]
  bucketName =  options.bucketPath

  s3Conn = s3.connect_to_region('us-west-2', aws_access_key_id=accessKey, aws_secret_access_key=secretKey)
  abstractsBucket = s3Conn.get_bucket(bucketName)
  
  #Delete all keys
  abstractsBucket.delete_keys(abstractsBucket.list())

if __name__ == "__main__":
    sys.exit(main())