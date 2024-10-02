var express = require('express')
  , routes = require('./routes/home')
  , home = require('./routes/home')
  , user = require('./routes/user')
  , search = require('./routes/search')
  , http = require('http')
  , path = require('path');


 
  const fs = require("fs");
  var nodemailer = require('nodemailer'); 
  const crypto = require('crypto');
  
  const multer = require('multer');

//var methodOverride = require('method-override');


const session = require('express-session');
/*
const redis = require('redis');
const connectRedis = require('connect-redis');
*/

var app = express();

var mysql = require('mysql');
var bodyParser = require("body-parser");
const { profile } = require('console');
const { render } = require('ejs');
const { response } = require('express');


var dbSelection = "HEROKU";
var dbSelection = "DO";
var dbSelection = "a2";
var dbSelection = "LOCAL";
var dbSelection = "RENDER";
var dbSelection = "AIVEN";

if(dbSelection=="AIVEN"){
  var connection = mysql.createConnection({
    host     : 'hevoke-hevoke.l.aivencloud.com',
    user     : 'avnadmin',
    password : 'AVNS_Vxy6c4Fiu85tvR_FX35',
    database : 'defaultdb',
    port: 27720,
    ssl : true
  });
}

if(dbSelection=="RENDER"){
  var connection = mysql.createConnection({
    host     : 'dpg-cru0u91u0jms73c1f0r0-a',
    user     : 'hevoke_admin',
    password : '',
    database : 'hevoke_database'
  });
}

if(dbSelection=="LOCAL"){
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'musicwebsitenode'
  });
}

if(dbSelection=="HEROKU"){
  var connection = mysql.createConnection({
    host     : 'eu-cdbr-west-03.cleardb.net',
    user     : 'bff364faf7f742',
    password : '',
    database : 'heroku_03d73d9693723ab'
  });
}

if(dbSelection=="DO"){
  var connection = mysql.createConnection({
    host     : 'musicwebsite-do-user-9064989-0.b.db.ondigitalocean.com',
    user     : 'doadmin',
    password : '',
    database : 'defaultdb',
    port: 25060
  });
}

if(dbSelection=="a2"){
  var connection = mysql.createConnection({
    host     : 'hevoke.com',
    user     : 'hevokeco_hevokeadmin',
    password : '12345',
    database : 'hevokeco_hevokedb',
    port: 3306
  });
}


connection.connect(function(err) {
  if (err) {
    return console.error('error db: ' + err.message);
  }
  console.log('\x1b[34m%s\x1b[0m', `OK BRO - CONNECTED TO DB (${dbSelection}).`);
});




connection.timeout = 0;

global.db = connection;

setInterval(function () {
  db.query('SELECT 1');
}, 180000);
 
// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/*
var app = connect();
app.use(connect.cookieParser());
app.use(connect.cookieSession({ secret: 'tobo!', cookie: { maxAge: 60 * 60 * 1000 }}));
*/
/*
app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 1 * 24 * 60 * 60 * 1000 }
}))
*/

/*
const redis = require('redis');
const session = require('express-session');
let RedisStore = require('connect-redis')(session);
let redisClient = redis.createClient();
*/
/*
app.use(
  session({
    secret: ['veryimportantsecret','notsoimportantsecret','highlyprobablysecret'], 
     name: "secretname", 
     saveUninitialized: true,
     cookie: {
      httpOnly: true,
      secure: true,
      sameSite: true,
      maxAge: 600000 // Time is in miliseconds
  },
    store: new RedisStore({ client: redisClient, ttl: 86400}),   
    resave: false
  })
)
*/

var cookieSession = require('cookie-session');


app.set('trust proxy', 1) // trust first proxy

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

/*
const RedisStore = connectRedis(session)//Configure redis client
const redisClient = redis.createClient({
    host: 'localhost',
    port: 8080
})
redisClient.on('error', function (err) {
    console.log('Could not establish a connection with redis. ' + err);
});
redisClient.on('connect', function (err) {
    console.log('Connected to redis successfully');
});//Configure session middleware
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // if true only transmit cookie over https
        httpOnly: false, // if true prevent client side JS from reading the cookie 
        maxAge: 1000 * 60 * 10 // session max age in miliseconds
    }
}))
*/

function check_logged(ele){ return ele != undefined; }

app.get('/favicon.ico', (req, res) => {
  res.sendFile(__dirname + "/public/images/favicon.ico");
});



/*
l26/   <--landing
l26/signup
l26/login
l26/home
l26/profile/username
l26/myconnections/
l26/myconnections/likes-received
l26/myconnections/chat
l26/pm/edit/country
l26/pm/edit/country   <- response
l26/search
l26/search-result?
l26/newradar
l26/newsletter-sub
l26/genre/pop
l26/subgenre/poprock
l26/reset-password
*/


app.get('/', home.home);
app.get('/getstarted', home.landing);

/*---REGISTRATION---*/
app.get('/signup', user.signup);
app.post('/signup', user.signup)
app.get('/account/verify', user.verify);

/*---ACCESS/SESSION---*/
app.get('/login', user.login);
app.post('/login', user.login);
app.get('/logout', user.logout);

/*---GENERAL CONTENT---*/
app.get('/home', home.home);
app.get('/search', search.search);
app.get('/search-result', search.searchResult);
app.get('/users/:type_section', home.showAllProfiles);
app.get('/section/:macro_category', home.generalMacroSection);

app.get('/genres', search.showAllGenres);
app.get('/genre/:type_genre', search.showGenre);
app.get('/subgenre/:type_subgenre', search.showSubgenre);

app.get('/feed', search.feed);

/*---CONNECTIONS---*/
app.get('/myconnections', search.connections);
app.get('/myconnections/radars/', search.radarsReport);
app.get('/myconnections/radar-signals/:radar_id', search.radarSignals);
app.get('/myconnections/signals-collab-received', search.signalsCollaborationReceived);
app.get('/myconnections/signals-collab-sent', search.signalsCollaborationSent);
app.get('/myconnections/like-received', search.likeReceived);
app.get('/myconnections/like-sent', search.likeSent);
app.get('/myconnections/followers', search.followers);
app.get('/myconnections/following', search.following);
app.get('/chat', user.chat);
app.post('/chat', user.chatOpenedWithUser);

app.get('/fyp', search.allUsersFYP);
app.get('/fypradar', search.allUsersFYPRadar);


/*---PROFILE PUBLIC---*/
app.get('/profile/:user_name', user.showProfile);


/*---PROFILE MANAGEMENT---*/
app.get('/pm', user.manageProfile);
app.get('/pm/edit/:attribute', user.getEditAttributeProfile);
app.post('/pm/edit/:attribute', user.postEditAttributeProfile);
app.get('/pm/edit-s/links', user.profileAddLinks);
app.post('/pm/edit-s/links', user.profileAddLinks);
app.get('/pm/edit-s/image', user.getEditImage);
app.post("/upload-profile-picture", user.postEditImage);
app.post("/remove-profile-picture", user.postRemoveImage);

app.get('/account/set-new-email', user.setNewEmail);
app.post('/account/set-new-email', user.setNewEmail); 
app.get('/account/update-email', user.updateNewEmail);

app.get('/new-radar', user.getNewRadar);
app.post('/new-radar', user.postNewRadar);

/*GENERAL SECONDARY*/
app.get('/account/request-reset-password', user.requestResetPassword);
app.post('/account/request-reset-password', user.requestResetPassword);

app.get('/account/reset-password', user.resetPassword);
app.post('/account/reset-password', user.resetPassword);


/*---AJAX ROUTES---*/
app.post('/signupCheckUsername', user.signupCheckUsername);
app.post('/signupCheckEmail', user.signupCheckEmail);
app.post('/ajaxDeleteLink',user.ajaxDeleteLink);

app.post('/action-button-like', user.buttonAjaxLike);
app.post('/action-button-follow', user.buttonAjaxFollow);
app.post('/action-button-collaboration', user.buttonAjaxCollaboration);

app.post('/show-more-results', search.ajaxShowMoreResults);

app.post('/deleteRadar', user.deleteRadar);

app.post('/sendMessage', user.ajaxSendMessage);
app.post('/checkNewMessages', user.ajaxCheckNewMessagesChat);



/*---NEWSLETTER---*/
app.get('/newsletter', home.getNewsletter);
app.post('/newsletter', home.postNewsletter);
app.get('/newsletter/verify', home.verifyNewsletter);
app.get('/unsubscribed-newsletter', home.getUnsubscribeNewsletter);
app.post('/unsubscribed-newsletter', home.postUnsubscribeNewsletter);
app.get('/unsubscribed-newsletter/verify', home.verifyUnsubscribeNewsletter);


/*---ANALYTICS / TRACKING USAGE DATA---*/
app.get('/hevolytics', search.listUsers);
app.get('/logs', search.activityLogs);
app.post('/track-click-link',user.ajaxTrackClickLink);


/*---LEGAL---*/
app.get("/terms", function (req, res) { res.render("docs/terms.ejs"); });
app.get("/privacy", function (req, res) { res.render("docs/privacy.ejs"); });


/*---OTHER SHIT---*/
app.get('/cards', search.allUsers);
app.get("/email-template", function (req, res) { res.render("email-template.ejs"); });
app.get('/spotifyapis', home.spotifyapis);
app.get('/reel', home.reel);



var https = require('https');

//Node.js Function to save image from External URL.
function saveImageToDisk(url, localPath) {
  var fullUrl = url;
  var file = fs.createWriteStream(localPath);
  var request = https.get(url, function(response) {
    response.pipe(file);
  });
}


app.post("/upload-image-url",function (req, res) {
  var urls = req.body.urls;
  var ids = req.body.ids;

  for(var i = 0; i < urls.length; i++){
    var url = urls[i];
    var id = ids[i];
    let path = 'public/uploads/'+id+'';
    let image_path = 'public/uploads/'+id+'/profile.jpg';
    if (!fs.existsSync(path)){
      fs.mkdirSync(path);
  }
    saveImageToDisk(url, image_path);
}
  res.render('spotifyapis.ejs');
});







//Middleware
let port = process.env.PORT||8080
app.listen(port, () => {
    console.log('\x1b[34m%s\x1b[0m', `OK BRO - APP IS RUNNING (PORT ${port})  -------------------------------------------------------------------------------------------------------`);
});

app.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("Node NOT Exiting...");
});
