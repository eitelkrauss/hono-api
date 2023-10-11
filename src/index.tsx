import { Hono } from 'hono'
import { html } from 'hono/html'
import { etag } from 'hono/etag'
import api from './api';
import { DBClient, dbClient } from './db'
import { serveStatic } from 'hono/bun'


export const SECRET = 'my$ecret'

const app = new Hono({ port: 3001 })

const db: DBClient = await dbClient()

app.use('*', async (c, next) => {
    c.set('db', db)
    c.set('secret', SECRET)
    await next()
})

app.route('/api', api)

app.get('/injection-form', (c) => c.html(
    <form action="/db-test" method="post">
        <label for="login">Login</label>
        <input type="text" name="login" />
        <button type="submit">submit</button>
    </form>
))

app.use('/hello', etag())

app.get('/hello', (c) => c.html(<p style="font-size: 5rem; font-weight: 600; font-family: system-ui;">hello 🐸</p>))


app.use('/*', etag())
app.use('/*', serveStatic({ root: './src/static' }))




export default app

// app.get('/', async (c) => {
//     const authCookie = await getSignedCookie(c, SECRET, 'test_auth_cookie').catch(e => console.error(e))
//     console.log("cookie: ", authCookie)
//     if (!authCookie) return c.redirect('/login')
//     return c.html(<h1>home</h1>)
// })

// app.get('/login', (c) => c.html(
//     <form action="/api/auth" method="post">
//         <input type="text" name="login" placeholder="login" />
//         <button type="submit">submit</button>
//     </form>
// ))

// app.get('/api/html/users', async (c) => {
//     const db = c.get('db')
//     const users = await db.users.findMany();
//     return c.html(<ul>{users.map(({ email, country }) => <li>{email} from {country}</li>)}</ul>)
// })
