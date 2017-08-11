#!/usr/bin/env node
/* eslint-disable no-console */

const params = require('commander');
const _ = require('lodash');
const fetch = require('node-fetch');
const MarcRecord = require('marc-record-js');
const marc_record_converters = require('marc-record-converters');

const CONVERTERS = {
  'aseq': marc_record_converters.alephSequential.to,
  'xml': marc_record_converters.marc21slimXML.to,
  'iso2709': marc_record_converters.iso2709.to
};

const DEDUPLICATION_API = _.get(process.env, 'DEDUPLICATION_API', 'http://localhost:3001');

params
  .version('0.0.1');

params
  .command('get <base> <record-id>')
  .description('get a record from datastore')
  .option('-f, --format [format]', 'Which format is used to print the record')
  .option('-d, --date [date]', 'Show record of date')
  .action(async function(base, recordId, options) {
 
    const format = options.format;
    const date = options.date;
    if (format && CONVERTERS[format] === undefined) {
      const availableFormats = Object.keys(CONVERTERS).join(', ');
      console.error(`Invalid record format: '${format}'. Available formats are: ${availableFormats}`);
      process.exit(1);
    }

    const baseUrl = `${DEDUPLICATION_API}/record/read/${base}/${recordId}`;
    const url = date ? `${baseUrl}/version/${date}` : baseUrl;

    const response = await fetch(url, {method: 'POST'});
    if (response.status === 200) {      
      const body = await response.json();
      const record = new MarcRecord(body);
      const recordString = format ? CONVERTERS[format].call(CONVERTERS[format], record) : record.toString();
      console.log(recordString);
      
    } else {
      console.error(`Error: ${response.statusText}`);
      const body = await response.text();
      console.log(body);
      process.exit(1);
    }
  });

params
  .command('history <base> <record-id>')
  .description('get list of record history')
  .action(async function(base, recordId) {
    
    const response = await fetch(`${DEDUPLICATION_API}/record/history/${base}/${recordId}`, {method: 'POST'});
    if (response.status === 200) {      
      const history = await response.json();
      const historyStr = history.map(item => `- ${item.timestamp} - ${new Date(item.timestamp)}`).join('\n');
      
      console.log(`History for ${base}/${recordId}:\n${historyStr}`);
    } else {
      console.error(`Error: ${response.statusText}`);
      const body = await response.text();
      console.log(body);
      process.exit(1);
    }
  });

params
  .command('add <filename>')
  .description('execute the given remote cmd')
  .option('-f, --format [format]', 'Format of records in file')
  .action(function(filename, options){
    var format = options.format || 'aseq';
    console.log('reading records from %s as %s', filename, format);
  });

params.parse(process.argv);
