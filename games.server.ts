import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'fast-csv'

export async function getResults() {
  return new Promise((resolve, reject)=>{
    const output = []

    fs.createReadStream(path.resolve(__dirname, 'results.csv'))
        .pipe(csv.parse({ headers: true }))
        .on('error', error => { console.error(error); reject(error) })
        .on('data', row => output.push(row))
        .on('end', (rowCount: number) => { console.log(`Parsed ${rowCount} rows`)
          Promise.resolve(output)
        });
  })
} 
