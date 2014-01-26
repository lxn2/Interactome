'''
@Author: Nathan Lucyk
@Date: 1.26.2014

'''
import threading
import boto.sqs
import time
import sys
import logging
from Queue import Queue
from boto.sqs.message import Message

class ASyncMessage(threading.Thread):
	def __init__(self, queue, deletionQ, deletionConnection):
		threading.Thread.__init__(self)
		self.queue = queue
		self.delQ = deletionQ
		self.deletionConnection = deletionConnection
	#Process the messages from the queue
	def run(self):
		while(True):
			try:
				msg = self.queue.get(True) #blocks if queue is empty
				self.deletionConnection.delete_message(self.delQ, msg)
			except Exception, e:
				logging.error(e)
			


#connection used for message deletion
deletingConection = boto.sqs.connect_to_region("us-west-2", aws_access_key_id='AKIAJULVYOWLDWYEL45Q', aws_secret_access_key='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')
delSQSQueue = deletingConection.get_queue("Interactome-1")
#Shared, thread-safe, queue for the messages polled
messageQueue = Queue()

def main():
	conn = boto.sqs.connect_to_region("us-west-2", aws_access_key_id='AKIAJULVYOWLDWYEL45Q', aws_secret_access_key='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')
	print ("connected")
	sqsQueue = conn.get_queue("Interactome-1")

	if (sqsQueue== None):
		print("failed to connect")
		return

	
	count = getTotal = readsMade = peak = 0
	start = time.clock()
	messageProcThread = ASyncMessage(messageQueue, delSQSQueue, deletingConection)
	messageProcThread.setDaemon(True) #Daemons die if mainthread ends
	messageProcThread.start()
	while (count < 250):
		try:
			getStart = time.clock()
			rs = sqsQueue.get_messages(10)
			getTotal += (time.clock() - getStart)
			readsMade += 1
			messagesGot = len(rs)
			if(peak < messagesGot):
				peak = messagesGot
			count += messagesGot
			for message in rs:
				messageQueue.put(message)
		except Exception, e:
			print("ERROR: ", e)
			break
	elapsed = (time.clock() - start)
	print("the time it took to end: ", (elapsed - getTotal) )
	print("readsMade: ", readsMade, " peak: ", peak)
	print(getTotal)


if __name__ == '__main__':
    main()





	# Use this to place a large amount of messages
	# for i in range(1,1000):
	# 	msgName = 'mass example' + str(i)
	# 	m = Message()
	# 	m.set_body(msgName)
	# 	try:
	# 		status = q.write(m)
	# 	except Exception, e:
	# 		print("e: ", e)
	# 	else:
	# 		if(status == False):
	# 			print("status failed")