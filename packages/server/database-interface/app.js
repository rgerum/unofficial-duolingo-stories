const express = require('express')
const session = require('express-session')
const compression = require('compression')

const app = express()
app.use(compression())

const port = process.env.PORT || 3001
const path = (process.env.NODE_ENV === 'test') ? '/stories/backend_node_test' : '/stories/backend_node';

// in the test environment allow calls from localhost
if(process.env.NODE_ENV === 'test') {
    app.use(function (req, res, next) {

        var origin = req.headers.origin;
        if(origin && (origin.match(/https:\/\/(.*)duostories\.org$/) || origin.match(/http:\/\/localhost:\d*$/) || origin.match(/http:\/\/.*\.railway.app$/))) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }

        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);

        if ('OPTIONS' === req.method) {
            res.sendStatus(200);
        } else {
            next();
        }
    });
}

app.use(express.json());
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
        '<input type="submit"></form>')
})

const user = require('./routes/user.js')
app.use(path, user);

const course = require('./routes/course.js')
app.use(path, course);

const editor = require('./routes/editor.js')
app.use(path, editor);

const admin = require('./routes/admin.js')
app.use(path, admin);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
