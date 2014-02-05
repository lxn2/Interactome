'''
    @Author: Ly Nguyen & Nathan Lucyk
    @Date: 2.4.2014

    Ideas for extension:
        add logging
        remove globals by a class or something

'''

import sys
import csv
import json 
import argparse
import time
from boto.s3.key import Key
from boto.dynamodb2.table import Table
from boto import s3
from boto import dynamodb2

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


''' 
    Parses the csv file for ACCESS_KEY_EXCEL_FIELD and SECRET_KEY_EXCEL_FIELD.
    It will then use those credentials to connect to s3, dynamo, and all tables.
    This does not check if the keys have enough authority to add to these resources (this may be a good addition in the future).
'''
def connectToAWS(authCSVFileName):
    REGION = 'us-west-2'
    # These resources are used throughout the application.
    global s3Conn
    global dynamoConn
    global sequencerTable
    global usersTable
    global papersTable
    # Practically every line could throw an exception so we use one try
    try:
    # Opens the credentials and then uses the first line. Using DictReader may be overkill
        csvfile = open(authCSVFileName, 'rU') 
        reader = csv.DictReader(csvfile) 
        authLine = reader.next()
        accessKey = authLine[ACCESS_KEY_EXCEL_FIELD]
        secretKey = authLine[SECRET_KEY_EXCEL_FIELD]
        # Get S3 and dynamo connection
        s3Conn = s3.connect_to_region(REGION, aws_access_key_id=accessKey, aws_secret_access_key=secretKey)
        dynamoConn = dynamodb2.connect_to_region(REGION, aws_access_key_id=accessKey, aws_secret_access_key=secretKey)
        # Use connections to load tables
        sequencerTable = Table(SEQUENCER_TABLE_NAME, connection=dynamoConn)
        usersTable = Table(USER_TABLE_NAME, connection=dynamoConn)
        papersTable = Table(PAPER_TABLE_NAME, connection=dynamoConn)
    except Exception, e:
        print(e)
        sys.exit(1)

'''
    Grabs the sequence from the sequence table. If it fails, it will return None.
        Note: This has not been tested, it is possible that it may retry automatically, never throwing an exception. 
'''
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
        print(e)
    return sequenceItem

'''
    Parses the csv file and adds the users found within to the users table. 
        Warning: This does not check for dupe users.
'''
def addUsers(csvFileName):
    # set up csv read
    csvFile = open(csvFileName, 'rU')
    authorData = csv.DictReader(csvFile)
    endTime = 0.0
    sequenceEnd = 0.0
    # read each csv row to insert into dynamo Paper table
    for row in authorData:
        seqStart = time.clock()
        sequencerItem = getSequence()
        sequenceEnd += time.clock() - seqStart
        if (sequencerItem == None):
            print("error with sequencerItem. Pres Num of item: " , row[PRESENTATION_NUM_EXCEL_FIELD])
            continue
        id = "User" + sequencerItem['Attributes']['Sequence']['N']
        row[PRESENTATION_NUM_EXCEL_FIELD] = int(row[PRESENTATION_NUM_EXCEL_FIELD])
        attributesList = ['Id'] + row.keys()
        valuesList = [id] + row.values()
        newItem = dict(map(None, attributesList, valuesList))
        # Delete blank header
        if '' in newItem:
            del newItem['']
        try:
            start = time.clock()
            usersTable.put_item(data=newItem)
            endTime += time.clock() - start
        except Exception, e:
            print(e)
    print("users table took: ", endTime)
    print("sequence table took: ", sequenceEnd)
    # close csv file
    csvFile.close()

'''
    Parses the csv file for abstracts. It will query to find if the author is already a user. If so, puts the user id with the abstract
    The abstract will be dumped into S3 in json format. The URL will be stored in the papers table.
'''
def addAbstracts(csvFileName):
    # set up csv read and s3 upload
    abstractsBucket = s3Conn.get_bucket(ABSTRACT_BUCKET_NAME)
    csvFile = open(csvFileName, 'rU') 
    fieldNames = csvFile.readline().split(',') 
    reader = csv.DictReader(csvFile, fieldNames) 
    abstractKey = Key(abstractsBucket)
    endTime = 0.0
    sequenceEnd = 0.0
    queryEnd = 0.0
    s3End = 0.0
    # read each csv row
    for row in reader:
        # convert rows into json format, upload to s3
        rowJSON = json.dumps(row, skipkeys=False, ensure_ascii=False, sort_keys=True)
        seqStart = time.clock()
        sequencerItem = getSequence()
        sequenceEnd += time.clock() - seqStart
        if (sequencerItem == None):
            print("error with sequencerItem. Pres Num of item: ", row[PRESENTATION_NUM_EXCEL_FIELD])
            continue
        s3Start = time.clock()
        abstractKey.key = 'Abstract' + sequencerItem['Attributes']['Sequence']['N'] + '.json'
        abstractKey.set_metadata("Content-Type", 'application/json')
        abstractKey.set_contents_from_string(rowJSON)
        abstractKey.make_public()
        abstractUrlLink = abstractKey.generate_url(0, query_auth=False, force_http=True)
        s3End += time.clock() - s3Start
        # save attribute values to insert in dynamo Paper table
        presentationNumber = row[PRESENTATION_NUM_EXCEL_FIELD]
        firstName = row[FIRSTNAME_EXCEL_FIELD]
        lastName = row[LASTNAME_EXCEL_FIELD]

        # query User table for the presenter to link new Paper item to it
        startQuery = time.clock()
        userQueryResults = usersTable.query(FirstName__eq=firstName, LastName__eq=lastName, index='FirstName-LastName-index')
        listUserQueryResults = list(userQueryResults)
        userId = ''
        if len(listUserQueryResults) == 1:
            userId = str(listUserQueryResults[0]['Id'])
        queryEnd += time.clock() - startQuery
        # Insert new dynamo Paper item
        sequencerItem = getSequence()
        dynamoPaperId = 'Paper' + sequencerItem['Attributes']['Sequence']['N']
        attributesList = ['Id', 'Link', 'PresentationNumber', 'UserId']
        valuesList = [dynamoPaperId, abstractUrlLink, int(presentationNumber), userId]
        newItem = dict(map(None, attributesList, valuesList))
        # Delete blank header
        if '' in newItem:
            del newItem['']
        try:
            start = time.clock()
            papersTable.put_item(data=newItem)
            endTime += time.clock() - start
        except Exception, e:
            print(e)
    print("papers table took: ", endTime)
    print("query table took: ", queryEnd)
    print("sequence table took: ", sequenceEnd)
    print("s3 dump took: ",s3End)
    # close csv file
    csvFile.close()


def main(argv=sys.argv):
    parser = argparse.ArgumentParser(description='Process optional download flags')

    AUTH_HELP_TEXT = "path to credential csv file from Amazon. This will not be stored. CSV fieldnames must be \"" \
                        + SECRET_KEY_EXCEL_FIELD + "\" for secret key and \"" + ACCESS_KEY_EXCEL_FIELD +"\" for access key"
    parser.add_argument('--auth', dest='usersAuth', help=AUTH_HELP_TEXT, required=True)
    parser.add_argument('--users', dest='usersPath', help='path to users csv file', default=argparse.SUPPRESS)
    parser.add_argument('--abstracts', dest='abstractsPath', help='path to abstracts csv file', default=argparse.SUPPRESS)
    options = parser.parse_args(argv[1:])

    connectToAWS(options.usersAuth)

    if hasattr(options, 'usersPath'):
        startUsers = time.clock()
        print("adding users")
        addUsers(options.usersPath)
        endUsers = time.clock() - startUsers
        print("total time for adding users: ", endUsers)
    
    if hasattr(options, 'abstractsPath'):
        startAbstracts = time.clock()
        print "------ adding abstracts ------"
        addAbstracts(options.abstractsPath)
        endAbstracts = time.clock() - startAbstracts
        print("total time for adding abstracts: ", endAbstracts)
        

if __name__ == "__main__":
    sys.exit(main())
