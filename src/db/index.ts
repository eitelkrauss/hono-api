import * as mysql from 'mysql2/promise'

export interface DBClient {
    mysql: typeof mysql;
    getConnection(): Promise<mysql.Connection>
}

export const dbClient = async () => {
    let pool = null


    const closePool = async () => {
        try {
            await pool.close()
            pool = null
        } catch (error) {
            pool = null
            console.error("closePool Err => ", error)
        }
    }

    const getConnection = async (): Promise<mysql.Connection> => {
        try {
            if (pool) {
                return pool
            }
            pool = await mysql.createConnection({
                host: 'localhost',
                user: 'node',
                password: 'pass',
                port: 3300,
                database: 'prueba',
                connectTimeout: 500,
                namedPlaceholders: true
              })
            pool.on('error', async err => {
                console.error("Connection Err => ", err)
                await closePool()
            })
            return pool
        } catch (error) {
            console.error("getConnection Err => ", error)
            pool = null
        }
    }

    return {
        mysql,
        getConnection,
    } as DBClient
}