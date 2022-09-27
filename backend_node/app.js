const express = require('express')
const session = require('express-session')

const app = express()
const port = 3001
const path = '/stories/backend_node'

//app.use(express.json());
app.use(express.urlencoded({ extended: false }))

let RedisStore = require("connect-redis")(session)
const redisConfig = require("./config/redis.config.js");
const redis = require('redis');
const redisClient = redis.createClient(redisConfig);
redisClient.connect().catch(console.error)


app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
        //secure: false, // if true only transmit cookie over https
        //httpOnly: false, // if true prevent client side JS from reading the cookie
        //maxAge: 1000 * 60 * 10 // session max age in miliseconds
    }
}))

app.get(path+'/', function (req, res) {
    res.send('<form action="/stories/backend_node/login" method="post">' +
        'Username: <input name="username"><br>' +
        'Password: <input name="password" type="password"><br>' +
        '<input type="submit" text="Login"></form>')
})

const user = require('./user.js')
app.use(path, user);

const course = require('./course.js')
app.use(path, course);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
