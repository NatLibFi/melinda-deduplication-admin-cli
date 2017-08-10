#!/usr/bin/env node
const params = require('commander');

params
  .version('0.0.1')
  .option('-C, --chdir <path>', 'change the working directory')
  .option('-c, --config <path>', 'set config path. defaults to ./deploy.conf')
  .option('-T, --no-tests', 'ignore test hook')

params
  .command('get <base> <record-id>')
  .description('get a record from datastore')
  .option('-f, --format [format]', 'Which format is used to print the record')
  .option('-d, --date [date]', 'Show record of date')
  .action(function(base, recordId, options) {
    var format = options.format || 'aseq';
    
    console.log('get record %s/%s in format %s', base, recordId, format);
  });

params
  .command('history <base> <record-id>')
  .description('get list of record history')
  .action(function(base, recordId, options) {
    console.log('get history of record %s/%s', base, recordId);
  })

params
  .command('add <filename>')
  .description('execute the given remote cmd')
  .option('-f, --format [format]', 'Format of records in file')
  .action(function(filename, options){
    var format = options.format || 'aseq';
    console.log('reading records from %s as %s', filename, format);
  });

params.parse(process.argv);
