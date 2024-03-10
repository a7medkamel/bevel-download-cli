import { program } from 'commander';

program
  .requiredOption('--org <org>')
  .option('-g, --generate <type>', 'generate the specified type of data')
  .option('-d, --download')
  ;

program.parse();

const options = program.opts();

import 'dotenv/config'
import { download } from './fetch/download.js';

async function main() {
  const org = options.org;
  
  if (options.download) {
    console.log(`downloading data for org: ${org}`);
    await download(org);
  }
}

main();