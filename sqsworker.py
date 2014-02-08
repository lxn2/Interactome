'''
	@Author: Nathan Lucyk
	@Date: 1.26.2014

	This program polls our AWS SQS for messages, processes them, and deletes them from the SQS.

	A two threaded service was chosen for a variety reasons:
		In python, only one thread can execute python code at a time.
		No benefit of multiple processing threads (ASyncMessage) was found during testing (multiple threads performed marginally worse)
		The worker thread (ASyncMessage) was left open due to the anticipated behavior of messages trickling in, not having bursts of messages. 

	This program uses SNS to fanout an alert of crashes.
'''
import threading
import boto.sqs
import boto.sns
import time
import logging
import Queue
from boto.sqs.message import Message

logging.basicConfig(filename='sqsworker.log', level=logging.INFO, format='%(asctime)s -- %(levelname)s: %(message)s')

'''
	A synchronous way of handling messages from the queue passed in.
'''
class ASyncMessage(threading.Thread):
	def __init__(self, queue, deletionQ, deletionConnection):
		'''
			queue: the queue that stores the messages
			deletionQ: the SQS queue to delete the message from (This should be the same SQS that the message in the other queue came from)
			deletionConnection: connection to SQS
				Note: both deletionQ and connection should be unique per thread
		'''
		threading.Thread.__init__(self)
		self.queue = queue
		self.delQ = deletionQ
		self.deletionConnection = deletionConnection
	# Process the messages from the queue
	def run(self):
		while(True):
			try:
				msg = self.queue.get(True) #blocks if queue is empty
				# Msg processing goes here
				self.deletionConnection.delete_message(self.delQ, msg)
			except Exception, e:
				logging.error(e)
			

def main():
	QUEUE_NAME = "Interactome-1"
	REGION = "us-west-2"
	# Max messages is used to casue the Queue object to throw a full exception.
	# The value will probably need to be tweaked depending on the systems using sqsworker.
	MAX_MESSAGES = 50
	messageQueue = Queue.Queue(MAX_MESSAGES)

	# Setup polling connection
	conn = boto.sqs.connect_to_region(REGION)
	sqsQueue = conn.get_queue(QUEUE_NAME)
	if (sqsQueue == None):
		logging.error("failed to connect to polling queue")
		return
	logging.info("Polling connection made.")

	# It's important that every thread has its own connection
	deletingConection = boto.sqs.connect_to_region(REGION)
	delSQSQueue = deletingConection.get_queue(QUEUE_NAME)
	messageProcThread = ASyncMessage(messageQueue, delSQSQueue, deletingConection)
	messageProcThread.setDaemon(True) #Daemons die abruptly if mainthread ends
	messageProcThread.start()
	
	while (True):
		try:
			receivedMsgs = sqsQueue.get_messages(10)
			for message in receivedMsgs:
				messageQueue.put(message)
		except Exception, e:
			logging.error(e)
			# Sends a msg to SNS to inform everyone subscribed about the crash
			snsErr = boto.sns.connect_to_region(REGION, aws_access_key_id = ACCESS_KEY, aws_secret_access_key = SECRET_KEY)
			snsErr.publish("arn:aws:sns:us-west-2:005837367462:error_report", "sqsworker.py has crashed. See logs.")
			return


if __name__ == '__main__':
    main()
    logging.info("sqsworker stopped.")
