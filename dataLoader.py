'''
    @Author: Ly Nguyen & Nathan Lucyk
    @Date: 2.4.2014
'''

import sys
import csv
from collections import defaultdict
import json 
import argparse
import getpass
from boto.s3.key import Key
from boto.dynamodb2.table import Table
from boto import s3
from boto import dynamodb2

# Constants
SEQUENCER_TABLE_NAME = 'Sequencer'
USER_TABLE_NAME = 'User'
PAPER_TABLE_NAME = 'Paper'
ABSTRACT_BUCKET_NAME = 'sagebionetworks-abstracts'
PRESENTATION_NUM_EXCEL_FIELD = 'PresentationNumber'
LASTNAME_EXCEL_FIELD = 'LastName'
FIRSTNAME_EXCEL_FIELD = 'FirstName'
# These are defined by the credentials csv downloaded from amazon
SECRET_KEY_EXCEL_FIELD = 'Secret Access Key'
ACCESS_KEY_EXCEL_FIELD = 'Access Key Id'
# AWS resources
s3Conn
dynamoConn
sequencerTable
usersTable
papersTable

# AWS connections -- fill this in
def connectToAWS(authCSVFileName):
    csvfile = open(authCSVFileName, 'rU') 
    reader = csv.DictReader(csvfile, fieldnames) 
    reader.next() #skip the header names 

    try:
        # Get S3 and dynamo connection
        s3Conn = s3.connect_to_region('us-west-2', aws_access_key_id='', aws_secret_access_key='')
        dynamoConn = dynamodb2.connect_to_region('us-west-2', aws_access_key_id='', aws_secret_access_key='')
        # Use connections to load tables
        sequencerTable = Table(SEQUENCER_TABLE_NAME, connection=dynamoConn)
        usersTable = Table(USER_TABLE_NAME, connection=dynamoConn)
        papersTable = Table(PAPER_TABLE_NAME, connection=dynamoConn)
    except Exception, e:
        print e
        sys.exit(1)

def getSequence():
    sequenceItem = None
    try:
      sequenceItem = dynamoConn.update_item(SEQUENCER_TABLE_NAME, 
                                    {"Id":{"N":"1"}}, 
                                    attribute_updates={"Sequence":{"Action":"ADD", "Value":{"N":"1"}}}, 
                                    expected=None, 
                                    return_values="UPDATED_NEW", 
                                    return_consumed_capacity=None, 
                                    return_item_collection_metrics=None)
    except Exception, e:
        print e
    return sequencerItem

def addUsers(csvFileName):
    # set up csv read
    csvFile = open(csvFileName, 'rU')
    authorData = csv.DictReader(csvFile)

    # read each csv row to insert into dynamo Paper table
    for row in authorData:
        sequencerItem = getSequence()
        id = "User" + sequencerItem['Attributes']['Sequence']['N']
        row['PresentationNumber'] = int(row['PresentationNumber'])
        attributesList = ['Id'] + row.keys()
        valuesList = [id] + row.values()
        newItem = dict(map(None, attributesList, valuesList))
        del newItem['']
        try:
            usersTable.put_item(data=newItem)
        except Exception, e:
            print e

    # close csv file
    csvFile.close()

def addAbstracts(csvFileName):
    # set up csv read and s3 upload
    abstractsBucket = s3Conn.get_bucket(ABSTRACT_BUCKET_NAME)
    csvFile = open(csvFileName, 'rU') 
    fieldNames = csvFile.readline().split(',') 
    reader = csv.DictReader(csvFile, fieldNames) 
    abstractKey = Key(abstractsBucket)

    # read each csv row
    for row in reader:
        # convert rows into json format, upload to s3
        rowJSON = json.dumps(row, skipkeys=False, ensure_ascii=False, sort_keys=True)
        sequencerItem = getSequence()
        abstractKey.key = 'Abstract' + sequencerItem['Attributes']['Sequence']['N'] + '.json'
        abstractKey.set_metadata("Content-Type", 'application/json')
        abstractKey.set_contents_from_string(rowJSON)
        abstractKey.make_public()
        abstractUrlLink = abstractKey.generate_url(0, query_auth=False, force_http=True)

        # save attribute values to insert in dynamo Paper table
        presentationNumber = row[PRESENTATION_NUM_EXCEL_FIELD]
        firstName = row[FIRSTNAME_EXCEL_FIELD]
        lastName = row[LASTNAME_EXCEL_FIELD]

        # query User table for the presenter to link new Paper item to it
        userQueryResults = usersTable.query(FirstName__eq=firstName, LastName__eq=lastName, index='FirstName-LastName-index')
        listUserQueryResults = list(userQueryResults)
        userId = ''
        if len(listUserQueryResults) == 1:
            userId = str(listUserQueryResults[0]['Id'])

        # Insert new dynamo Paper item
        sequencerItem = getSequence()
        dynamoPaperId = 'Paper' + sequencerItem['Attributes']['Sequence']['N']
        attributesList = ['Id', 'Link', 'PresentationNumber', 'UserId']
        valuesList = [dynamoPaperId, abstractUrlLink, int(presentationNumber), userId]
        newItem = dict(map(None, attributesList, valuesList))
        del newItem['']
        try:
            papersTable.put_item(data=newItem)
        except Exception, e:
            print e

    # close csv file
    csvFile.close()


def main(argv=sys.argv):
    parser = argparse.ArgumentParser(description='Process optional download flags')

    AUTH_HELP_TEXT = "path to credential csv file from Amazon. This will not be stored. CSV fieldnames must be " \
                        + SECRET_KEY_EXCEL_FIELD + " and " + ACCESS_KEY_EXCEL_FIELD
    parser.add_argument('--users', dest='usersAuth', help=AUTH_HELP_TEXT, required=True)
    parser.add_argument('--users', dest='usersPath', help='path to users csv file', default=argparse.SUPPRESS)
    parser.add_argument('--abstracts', dest='abstractsPath', help='path to abstracts csv file', default=argparse.SUPPRESS)
    options = parser.parse_args(argv[1:])

    connectToAWS(options.usersAuth)

    # if hasattr(options, 'usersPath'):
    #     addUsers(options.usersPath)
    
    # if hasattr(options, 'abstractsPath'):
    #     addAbstracts(options.abstractsPath)
        

if __name__ == "__main__":
    sys.exit(main())
