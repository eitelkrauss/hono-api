import { readdir } from 'fs/promises'

export const loadSqlQueries = async folderName => {
    const path = import.meta.dir + '/' + folderName
    console.log("queries folder: ", path)
    const files = await readdir(path)
    const sqlFiles = files.filter(f => f.endsWith('.sql'))
    const queries = {}
    for (const sqlFile of sqlFiles){
        const query = Bun.file(path + '/' + sqlFile)
        queries[sqlFile.replace('.sql', '')] = await query.text()
    }
    return queries
}