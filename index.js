const express = require('express');
const app = express();
// const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const session = require('express-session')

mongoose.connect('mongodb://127.0.0.1:27017/auth-demo')
    .then(() => {
        console.log('DB Connection open!!');
    })

app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));
app.set('views', __dirname + '/views');    // this is an another way to point views folder other than path.join.
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'You have been trolled',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}))

const isLoggedIn = (req, res, next) => {
    const { user_id } = req.session;
    if (!user_id) {
        return res.redirect('/login')
    }
    return next();
}

app.get('/signup', (req, res) => {
    res.render('signUp');
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const excistingUser = await User.find({ username: username })
    if (excistingUser.length) {
        return res.send('User with this username is already registered!!')
    }
    if (!password) {
        return res.send('Empty Password')
    }
    const salt = await bcrypt.genSalt(12);
    const passwordhash = await bcrypt.hash(password, salt);

    const newUser = await User.create({ username: username, password: passwordhash });
    res.redirect('/login');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send('Username or Password can not be empty');
    }
    const user = await User.findOne({ username: username });
    if (!user) {
        return res.send('User does not exist');
    }
    const isValidUser = await bcrypt.compare(password, user.password)
    if (!isValidUser) {
        return res.send('Invalid Username or Password');
    }

    req.session.user_id = user._id;
    res.redirect('/secret');
})


app.get('/secret', isLoggedIn, (req, res) => {
    res.send('This is a secret. You need to login first to access this secret!!!!')
})

app.get('/logout', (req, res) => {
    if (req.session.user_id) {
        req.session.destroy()
        return res.redirect('/login');
    }
    res.send('You are not logged in!!!')
})


app.listen(3000, () => {
    console.log('Express server started at port 3000')
})