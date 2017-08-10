#!/usr/bin/env node
const params = require('commander');
const _ = require('lodash');
const fetch = require('node-fetch');

const DEDUPLICATION_API = _.get(process.env, 'DEDUPLICATION_API', 'http://localhost:3001');


params
  .version('0.0.1')
  .command('record', 'Handle records in datastore');

params
  .command('trigger-change <base> <record-id>')
  .description('Trigger fake change of single record causing deduplication process for that record')
  .action(async function(base, recordId, options) {
    console.log('Triggering change of record %s/%s', base, recordId);

    const response = await fetch(`${DEDUPLICATION_API}/trigger-change/${base}/${recordId}`, {method: 'POST'});
    if (response.status !== 200) {
      console.error(`Error: ${response.statusText}`);
      const body = await response.text();
      console.log(body);
      process.exit(1);
    } else {
      console.log(response.statusText);
    }
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
