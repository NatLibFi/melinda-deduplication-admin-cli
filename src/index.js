#!/usr/bin/env node
const params = require('commander');

params
  .version('0.0.1')
  .command('record', 'Handle records in datastore');

params
  .command('trigger-change <base> <record-id>')
  .description('Trigger fake change of single record causing deduplication process for that record')
  .action(function(base, recordId, options) {  
    console.log('Triggering change of record %s/%s', base, recordId);
  });

params
  .command('check-all-records')
  .description('Trigger duplicate check for all records in the datastore (without fetch from ILS)')
  .action(function() {  
    console.log('Triggering change of all records in datastore');
  });

params
  .command('split <base> <record-id>')
  .description('Split previously merged record / Cancel merge of a record')
  .action(function(base, recordId, options) {  
    console.log('Splitting merged record %s/%s', base, recordId);
  });

params.parse(process.argv);
