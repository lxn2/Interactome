#!/Library/Frameworks/Python.framework/Versions/Current/bin/python

import sys
import csv
from collections import defaultdict
import json 
import argparse
import getpass
from boto.s3.key import Key
from boto.dynamodb2.table import Table
import boto.s3 as s3
import boto.dynamodb2 as dynamodb2

# Constants
sequencerTableName = 'Sequencer'
userTableName = 'User'
paperTableName = 'Paper'
abstractsBucketName = 'sagebionetworks-abstracts'
presentationNumberXLHdr = 'PresentationNumber'
lastNameXLHdr = 'LastName'
firstNameXLHdr = 'FirstName'


# AWS connections -- fill this in

try:
    s3Conn = s3.connect_to_region('us-west-2', aws_access_key_id='', aws_secret_access_key='')
except Exception, e:
    print e
    sys.exit(1)

try:
    dynamoConn = dynamodb2.connect_to_region('us-west-2', aws_access_key_id='', aws_secret_access_key='')
except Exception, e:
    print e
    sys.exit(1)

# Dynamo tables
sequencerTable = Table(sequencerTableName, connection=dynamoConn)
usersTable = Table(userTableName, connection=dynamoConn)
papersTable = Table(paperTableName, connection=dynamoConn)

def getSequence():
    return dynamoConn.update_item(sequencerTableName, {"Id":{"N":"1"}}, attribute_updates={"Sequence":{"Action":"ADD", "Value":{"N":"1"}}}, expected=None, return_values="UPDATED_NEW", return_consumed_capacity=None, return_item_collection_metrics=None)

def addUsers(csvFileName):
    # set up csv read
    csvFile = open(csvFileName, 'rU')
    authorData = csv.DictReader(csvFile)
    sequencerItem = None

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
    abstractsBucket = s3Conn.get_bucket(abstractsBucketName)
    csvFile = open(csvFileName, 'rU') 
    fieldNames = csvFile.readline().split(',') 
    reader = csv.DictReader(csvFile, fieldNames) 
    abstractKey = Key(abstractsBucket)
    sequencerItem = None

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
        presentationNumber = row[presentationNumberXLHdr]
        firstName = row[firstNameXLHdr]
        lastName = row[lastNameXLHdr]

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
    parser.add_argument('--users', dest='usersPath', help='path to users csv file', default=argparse.SUPPRESS)
    parser.add_argument('--abstracts', dest='abstractsPath', help='path to abstracts csv file', default=argparse.SUPPRESS)
    options = parser.parse_args(argv[1:])

    if hasattr(options, 'usersPath'):
        addUsers(options.usersPath)
    
    if hasattr(options, 'abstractsPath'):
        addAbstracts(options.abstractsPath)
        

if __name__ == "__main__":
    sys.exit(main())
