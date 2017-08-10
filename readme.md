# melinda-deduplication-cli

This package contains a command line interface for managing deduplication system

Add a record to the datastore. Reads file in aleph sequential format.

Trigger fake change of single record causing it to be fetched from ILS and saved to datastore. This will then start the deduplication process for that record.

Trigger duplicate check for all records in the datastore (without fetch from ILS)

Split previously merged record / Cancel merge of a record

