# melinda-deduplication-cli

Command line interface for managing deduplication system

Add a record to the datastore. Reads file in aleph sequential format.

Trigger fake change of single record causing it to be fetched from ILS and saved to datastore. This will then start the deduplication process for that record.

Trigger duplicate check for all records in the datastore (without fetch from ILS)

Split previously merged record / Cancel merge of a record

Usage:

  deduplication record get [-f <format>] [-d <date>] <base> <record-id>
  deduplication record history <base> <record-id>
  deduplication record add [-f <alephSequential>] <filename>
  deduplication trigger-change <base> <record-id>
  deduplication check-all-records
  deduplication split <base> <record-id>
