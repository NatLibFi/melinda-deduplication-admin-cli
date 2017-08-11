#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const params = require('commander');
const _ = require('lodash');
const fetch = require('node-fetch');
const MarcRecord = require('marc-record-js');
const marc_record_converters = require('marc-record-converters');
const Serializers = require('marc-record-serializers');
const debug = require('debug')('cli');

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
  .command('add <base> <filename>')
  .description('execute the given remote cmd')
  .option('-f, --format [format]', 'Format of records in file. Default is aseq')
  .action(function(base, filename, options){
    var format = options.format || 'aseq';
    if (format !== 'aseq') {
      const availableFormats = 'aseq';
      console.error(`Invalid record format: '${format}'. Available formats are: ${availableFormats}`);
      process.exit(1);
    }
    
    console.log('adding records from %s as %s into %s', filename, format, base);

    const fileStream = fs.createReadStream(filename);
    const reader = new Serializers.AlephSequential.Reader(fileStream);

    const queue = createQueue();

    reader.on('data', async function(record) {
      fileStream.pause();

      queue.add(record);
      process.nextTick(queue.handleQueuedTasks);
      queue.onEmpty(() => fileStream.resume());
    });

    reader.on('end', function() {
      console.log('Done.');
    });

    reader.on('error', function(error) {
      console.error(error);
    });

    function createQueue() {
      let tasks = [];
      let isRunning = false;
      let onEmptyCallback;
      
      const handleQueuedTasks = async () => {
        if (isRunning) return;
        isRunning = true;
        for (const record of tasks) {
          try {
            await triggerRecordSave(record);
          } catch(error) {
            console.log(error.message);
            console.log(record.toString());
          }
        }
        tasks = [];
        isRunning = false;
        
        if (onEmptyCallback) {
          onEmptyCallback.call();
        }
      };
      const add = (task) => tasks.push(task);
      const onEmpty = (fn) => onEmptyCallback = fn;

      return {
        add,
        handleQueuedTasks,
        onEmpty
      };
    }
    
    async function triggerRecordSave(record) {
  
      const recordId = _.get(record.fields.find(field => field.tag === '001'), 'value');
      if (recordId === undefined) {
        throw new Error('Cannot add records without 001 field.');
      }
      const url = `${DEDUPLICATION_API}/record/add/${base}/${recordId}`;
      
      const response = await fetch(url, {
        method: 'POST', 
        body: JSON.stringify(record),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200) {
        console.log(`Saved record ${base}/${recordId}`);
        debug(`Saved record ${base}/${recordId}`);
      } else {
        console.error(`Error: ${response.statusText}`);
        const body = await response.text();
        console.log(body);
        process.exit(1);
      }
      
    }

  });

params.parse(process.argv);
