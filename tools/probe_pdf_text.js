#!/usr/bin/env node
const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function main() {
  for (const file of process.argv.slice(2)) {
    const parser = new PDFParse({ data: fs.readFileSync(file) });
    const data = await parser.getText();
    await parser.destroy();
    const text = data.text.replace(/\s+/g, ' ').trim();
    console.log(`\n=== ${file} ===`);
    console.log(`pages=${data.total} chars=${data.text.length}`);
    console.log(text.slice(0, 1400));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
