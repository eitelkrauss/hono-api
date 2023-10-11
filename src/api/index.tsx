import { Hono } from 'hono'
import { deleteCookie, getCookie, getSignedCookie, setCookie, setSignedCookie } from 'hono/cookie'
import { SECRET } from '..'
import { HTTPException } from 'hono/http-exception'
import Users from '../db/Users'
import { DBClient } from '../db'
import { etag } from 'hono/etag'

const api = new Hono()


// Authentication

api.post('/auth', async (c) => {
    const data = await c.req.json()
    const db = c.get('db')
    // get user by email (body.login)
    const user = await Users(db as DBClient).getUserByLogin(data.login)
    console.log(user)
    if (!user) {
        throw new HTTPException(401, { message: 'No tiene autorización' })
    } else {
        setCookie(c, 'auth_cookie_proxy', data.login, {
            path: '/',
            secure: false,
            // domain: 'localhost',
            domain: '192.168.116.64',
            httpOnly: false,
            maxAge: 600,
            expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
            sameSite: 'Strict',
        })
        await setSignedCookie(c, 'test_auth_cookie', data.login.split('.')[0], c.get('secret') as string, {
            path: '/',
            secure: false,
            // domain: 'localhost',
            domain: '192.168.116.64',
            httpOnly: true,
            maxAge: 600,
            expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
            sameSite: 'Strict',
        })
        return c.text('ok')
    }
})

api.post('/logout', (c) => {
    deleteCookie(c, 'test_auth_cookie', {
        path: '/',
        secure: false,
        domain: '192.168.116.64',
        // domain: 'localhost'
    })
    deleteCookie(c, 'auth_cookie_proxy', {
        path: '/',
        secure: false,
        domain: '192.168.116.64',
        // domain: 'localhost'
    })
    // return c.text('ok')
    return c.redirect('/')
})


api.get('/verify', async (c, next) => {
    await verifyUser(c)
    return c.text('ok')
})




// Users

api.use('/users/*', etag())

// api.use('/users/*', async (c, next) => {
//     await verifyUserMiddleware(c)
//     await next()
// })

api.get('/users', async (c) => {
    const db = c.get('db')
    const results = await Users(db as DBClient).getAllUsers()
    return c.html(<ul>{results.map(({ email, country, bio }) => <li class="text-xs m-2">{email} from {country} bio: {bio}</li>)}</ul>)
    // return c.json(results)
})

api.get('/users/me', async (c) => {
    const [login, userData] = await getUserByCookie(c)
    c.res.headers.append('cache-control', 'private, max-age=10')
    return c.json(userData)
})

api.put('/users/me', async (c) => {
    const [login, userData] = await getUserByCookie(c)
    const body = await c.req.json()
    const db = c.get('db') as any
    try {
        const result = await Users(db as DBClient).updateUserBio(login, body.bio)
        console.log(result)
        return c.json(userData)
    } catch (error) {
        console.error("update bio err: ", error)
    }
})




// Authentication with ID4Face

api.post('/id4face', async (c) => {
    const body = await c.req.json()
    const isLogin = c.req.query('login')
    console.log("id4face webhook => ", body)
    if(body.status === 'UNVERIFIED') throw new HTTPException(401, {message: body.status})
    const res = await fetch(`https://id4face.eclipsoft.dev/api/events/${body.requestId}`, { headers: { Authorization: `Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJlY2xpcHNvZnQiLCJhdXRoIjoiUk9MRV9BRE1JTixST0xFX1VTRVIiLCJleHAiOjE2OTQ4MDgyMDd9.CA6C1CbWu_N_Qukpam7KhoaME_PrOXG88gMosZtYMH64q34QkDKp_fh8zbe8CSXi1koaS7mrEd0g7Pwk5u7toA`}})
    if(!res.ok) {
        throw new HTTPException(401, { message: 'No tiene autorización' })
    } else {
        const db = c.get('db') as any
        const data = await res.json() as any
        if(!isLogin){
            // await db.insert(users).values({ email: `${data.identification}@id4face.com`, id_number: data.identification, bio : 'empty bio', country: 'EC'});
            console.log("id4face signup by id(user): ", data.identification)
        } else {
            const user = Users(db).getUserByIdNumber(data.identification)
            if(!user) throw new HTTPException(401, { message: 'No auth' })
            console.log("id4face login by user => ", user)
        }

        setCookie(c, 'auth_cookie_proxy', `${data.identification}@id4face.com`, {
            path: '/',
            secure: false,
            // domain: 'localhost',
            domain: '192.168.116.64',
            httpOnly: false,
            maxAge: 600,
            expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
            sameSite: 'Strict',
        })
        await setSignedCookie(c, 'test_auth_cookie', `${data.identification}@id4face`, c.get('secret') as string, {
            path: '/',
            secure: false,
            // domain: 'localhost',
            domain: '192.168.116.64',
            httpOnly: true,
            maxAge: 600,
            expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
            sameSite: 'Strict',
        })
        return c.text('ok')
    }
})

export default api


const verifyUser = async (requestContext) => {
    const authCookie = await getSignedCookie(requestContext, SECRET, 'test_auth_cookie').catch(e => console.error(e))
    if (!authCookie) throw new HTTPException(401, { message: 'No tiene autorización' })
}

const verifyUserMiddleware = async (c) => {
    const authCookie = await getSignedCookie(c, SECRET, 'test_auth_cookie').catch(e => console.error(e))
    if (!authCookie) throw new HTTPException(401, { message: 'No tiene autorización' })
}

const getUserByCookie = async (requestContext) => {
    const login = getCookie(requestContext, 'auth_cookie_proxy')
    const db = requestContext.get('db') as DBClient
    const user = await Users(db).getUserByLogin(login)
    return [login, user]
}