import { DBClient } from "..";
import { loadSqlQueries } from "../utils";

const queries = await loadSqlQueries('Users') as any
console.log("sql queries: ", queries)

export default (db: DBClient) => {

    const getUserByLogin = async (login: string) => {
        const conn = await db.getConnection()
        const query = queries.getUserByLogin
        const values = { login }
        const [result] = await conn.execute(query, values);
        return result[0]
    }
    
    const getUserByIdNumber = async (idNumber: string) => {
        const conn = await db.getConnection()
        const query = queries.getUserByIdNumber
        const values = { idNumber }
        const [result] = await conn.execute(query, values)
        return result[0]
    }
    
    const getAllUsers = async () => {
        const conn = await db.getConnection()
        const query = queries.getAllUsers
        const [results] = await conn.execute(query)
        return results as Array<any>
    }
    
    const registerID4User = async (login, idNumber: string) => {
        const conn = await db.getConnection()
        const query = queries.registerID4User
        const values = { login, idNumber}
        const [results] = await conn.execute(query, values)
        return results[0]
    }
    
    const updateUserBio = async (login: string, newBio: string) => {
        const conn = await db.getConnection()
        const query = queries.updateUserBio
        const values = { login, newBio }
        const [results] = await conn.execute(query, values)
        return results[0]
    }

    return {
        getUserByLogin,
        getUserByIdNumber,
        getAllUsers,
        registerID4User,
        updateUserBio
    }
}

