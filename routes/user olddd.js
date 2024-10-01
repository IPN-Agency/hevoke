const { EPROTONOSUPPORT } = require('constants');
var mysql = require('mysql');

function check_logged(ele){ return ele != undefined; }

 const queryWrapper = (statement) => {
      return new Promise((resolve, reject) => {
          db.query(statement, (err, result) => {
              if(err){ return reject(err); }
              resolve(result);
          });
      });
};
    
/*-------------------------------------------------------------------- GET POST /LOGIN -----------------------------------------------*/
exports.login = function(req, res){
    var heroku = false;
    if(req.method == "GET"){
      res.render('login.ejs', {message: ""}); return;
    }    
 
    if(req.method == "POST"){
         var post  = req.body;
         var inputEmail = post.email;
         var inputPassword = post.password;

         var bcrypt = require('bcrypt');

         var sql = "SELECT user_id, user_name, artist_name, artist_type, country, user_level, active, password FROM UserArtist WHERE email = ? LIMIT 1";
         var inserts = [inputEmail];
         sql = mysql.format(sql, inserts);
         
         db.query(sql, function(err, result){      
            if(result.length){
                     const databaseHashedPassword = result[0].password;

                     bcrypt.compare(inputPassword, databaseHashedPassword, function(err, isMatch) {
                           if (err) {  throw err }
                           if (!isMatch) {
                                 res.render('login.ejs', {status: "KO", message: "Incorrect password."});
                           }
                           if (isMatch) {
                                 if(result[0].active == 0){
                                    res.render('login.ejs', {status: "KO", message: "Email has not been verified yet."});
                                 }

                                 if(result[0].active == 1){
                                    delete result[0].password; //elimino la password da object utente loggato per non aver la password nella sessione
                                    req.session.userLogged = result[0];
                                    req.session.userLoggedId = result[0].user_id; var user_id = result[0].user_id; console.log(result[0].user_id);

                                    var sql = "UPDATE UserArtist SET last_login=CURDATE() WHERE email = ?";
                                    if(heroku){ var sql = "UPDATE UserArtist SET active='1' WHERE email = ?"; } // scambio con una query inutile, solo perchè heroku ha mysql server versione diversa che non supporta il curdate()
                                    
                                    var inserts = [inputEmail];
                                    sql = mysql.format(sql, inserts);
                                    db.query(sql, function(err, result){ 
                                          const {  v4: uuidv4  } = require('uuid');
                                          uuid = uuidv4(); req.session.sessionId = uuid;
                                          var timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                                          console.log(timestamp);
                                          var sql = "INSERT INTO TrackingSession(session_id, user_id, type, time_login) VALUES ('"+uuid+"', '"+user_id+"', 'login', '"+timestamp+"')";
                                          db.query(sql, function(err, result){  
                                             console.log(sql);
                                             res.redirect('/home');
                                          });
                                      
                                    });
                                 }
                           }
                     });

            }
            else{
                  res.render('login.ejs',{status: "KO", message: "There's no account with this email."});
            }
                     
         });
    }
         
 };


/*---------------------------------------------------------------------- GET POST /SIGNUP --------------------------------------------*/
 exports.signup = function(req, res){
    var status = "KO";
    var typeError = "";

    if(req.method == "GET"){
      res.render('signup');
    }

    if(req.method == "POST"){
       var post  = req.body;
       var email = post.email;
       var password = post.password;
       var username = post.username;
       // per sicurezza in username strippo gli spazi e converto tutto lowercase
       username = username.replace(/\s+/g,'').toLowerCase(); 
     
       //creo token codice verifica per conferma email
       const crypto = require('crypto');
       var handlebars = require('handlebars');
       var path = require('path');
       var bcrypt = require('bcrypt');
       const {  v4: uuidv4  } = require('uuid');

       //hasho la password
       bcrypt.hash(password, 10, function(err, hash){
            if(err){
               console.log(err);
            }
            else{
               var hashed_password = hash;
               var uuid = uuidv4();
               const verif_code = crypto.randomBytes(16).toString("hex"); console.log("The random data is: "+ verif_code); 
            
               var sql = "INSERT INTO UserArtist (user_id, user_name, artist_name, email, password, verif_code) VALUES ?"; console.log(sql);
               var values = [[uuid, username, username, email, hashed_password, verif_code]];
               var query = db.query(sql, [values], function(err, result) {
                           if(err){
                              res.render('signup.ejs', {status:"KO", typeError: "insert"});
                              return;
                           }
                           
                           var link = "http://hevoke.com/account/verify?code="+verif_code;

                           var nodemailer = require('nodemailer');

                           /*
                           const transporter = nodemailer.createTransport({
                                 name: 'smtp.dreamhost.com', // <= Add this
                                 host: 'smtp.dreamhost.com',
                                 secure: false,
                                 port: 25,
                                 auth: {
                                    user: 'hola@perumaquinariasmt.com',
                                    pass: 'pmmt2020'
                                 }
                           });
                           */
                           const transporter = nodemailer.createTransport({
                              host: "mail.hevoke.com",
                              port: 465,
                              secure: true,
                              auth: {
                                 user: "no-reply@hevoke.com",
                                 pass: "infoHevoke2021"
                              },
                              tls: {
                                 rejectUnauthorized:false
                             }
                           });
                        
                           var htmlString='<html>';
                           htmlString += '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">';
                           htmlString += '<head>';
                           htmlString += '<meta http-equiv="Content-type" content="text/html; charset=utf-8" />';
                           htmlString += '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />';
                           htmlString += '<meta http-equiv="X-UA-Compatible" content="IE=edge" />';
                           htmlString += '<meta name="format-detection" content="date=no" />';
                           htmlString += '<meta name="format-detection" content="address=no" />';
                           htmlString += '<meta name="format-detection" content="telephone=no" />';
                           htmlString += '<meta name="x-apple-disable-message-reformatting" />';
                           htmlString += '<title>Email</title>';
                           htmlString += '<link rel="preconnect" href="https://fonts.gstatic.com"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Kanit:ital,wght@0,800;0,900;1,800&display=swap" rel="stylesheet"> <script src="https://kit.fontawesome.com/ce061fb4d7.js" crossorigin="anonymous"></script>';
                           htmlString += '<style type="text/css" media="screen">';
                           htmlString += '[style*="Roboto"] { font-family: Arial, sans-serif; }';
                           htmlString += 'body { min-width:100% !important; width:100%!important; line-height: 1.5; -webkit-text-size-adjust:none; color: #303030; }';
                           htmlString += 'img { -ms-interpolation-mode: bicubic; /* Allow smoother rendering of resized image in Internet Explorer */ }';
                           htmlString += '</style>';
                           htmlString += '</head>';
                           htmlString += '<body>';
                           htmlString += '<div style="background-color: #212121; font-family: \'DM Sans\', sans-serif; color: #ffffff; text-align: center; padding: 35px 0;">';
                           htmlString += '<div style="max-width: 900px; margin: 0 auto; background-color: #121212; padding: 35px; text-align: center;">';
                           /*htmlString += '<div style="line-height:30px; margin-top: 0px;"><img style="display:inline-block; line-height:0px;" src="https://webdevtrick.com/wp-content/uploads/logo-fb-1.png" width="60" height="60" alt="logo"></div>';*/
                           htmlString += '<div style="color:#ffffff; font-family: \'Kanit\', sans-serif; letter-spacing: -1px; font-weight: 800; font-size: 19px; margin-top: 5px;">HEVOKE</div>';
                           htmlString += '<div style="font-size: 43px; line-height: 30px; letter-spacing: -1px; margin-top: 35px; font-weight: 500;">Welcome on Hevoke!</div>';     
                           htmlString += '<div style="font-size: 20px; line-height: 30px; margin-top: 10px;">To activate your account use the button below:</div>';     
                           htmlString += '<a style="background-color: #585858; border: 0px solid #707070; color: #fff; font-size: 17px; text-decoration: none; padding: 0.8rem 2.2rem; margin-top: 20px; display: inline-block; width: auto; border-radius: 1px;" href='+link+'>Confirm</a>';
                           htmlString += '<div style="color:#E8E8E8; font-size: 14px; line-height: 15px; margin-top: 20px;">or copy and paste this url:</div>';   
                           htmlString += '<div style="color:#808080; font-size: 14px; line-height: 15px; margin-top: 5px; white-space: wrap">'+link+'</div>';     
                           htmlString += '<div style="color:#E8E8E8; font-size: 15px; margin-top: 35px; border-top: 1px solid #696969; padding: 15px 0; border-bottom: 1px solid #696969;">';
                           /*htmlString += '<a>Instagram</a> <a>Youtube</a>';*/
                           htmlString += '<div style="display: inline-flex; gap: 27px; font-size: 27px"><i class="fab fa-facebook"></i> <i class="fab fa-youtube"></i> <i class="fab fa-instagram"></i></div>';
                           htmlString += '</div>';
                           htmlString += '<div style="color:#707070; font-size: 13px; margin-top: 30px;">Hai ricevuto questo messaggio perchè il tuo indirizzo email è stato indicato durante una registrazione su l26.com.<br>Se non hai fatto questa richiesta puoi segnalarcelo a info@l26.com.</div>';   
                           htmlString += '<div style="color:#5C5C5C; font-size: 12px; margin-top: 15px;">hevoke.com</div>';
                           htmlString += '</div>';
                           htmlString += '</div>';
                           htmlString += '</body>';
                           htmlString += '</html>';
                           
                           var mailOptions = {
                              from: 'Hevoke <no-reply@hevoke.com>',
                              to: email,
                              subject: 'Welcome on Hevoke, confirm your registration',
                              html: htmlString
                           };

                           transporter.sendMail(mailOptions, function(error, info){
                              if (error) {
                                 console.log(error);
                                 res.render('signup.ejs',{status:"KO", typeError: "mailer"});
                                 return;
                              } else {
                                 console.log('Email sent to ' + email + ' :' + info.response);
                                 status = "OK";
                                 res.render('signup.ejs',{status: "OK", email});
                              }
                           }); 
       
               });

            }
       });

    }
    
};


/*-------------------------------------------------------------- GET POST /REQUEST-RESET-PASSWORD ---------------------------------------*/
 exports.requestResetPassword = function(req, res){
   var status = ""; var message = "";

   if(req.method == "GET"){
      res.render('request-reset-password', {status, message});
   }

   if(req.method == "POST"){
      var post = req.body;
      var email = post.email;
     
      //creo token codice verifica per conferma email
      const crypto = require('crypto');
      const verif_code = crypto.randomBytes(16).toString("hex");
      
      var sql = "SELECT email FROM UserArtist WHERE email= '" + email + "' LIMIT 1";

      var query = db.query(sql, function(err, result) {
         if(result.length == 0){
            status = "ko"; message = "Non è stato trovato un account con questo indirizzo email.";
            console.log(message);
            res.render('request-reset-password', {status, message});

         }
         else{  // se c'è un account con quell'indirizzo email
         var date = new Date();
         date.setHours(date.getHours() + 2);

         var timestamp = date.getUTCFullYear() + '-' +
         ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
         ('00' + date.getUTCDate()).slice(-2) + ' ' + 
         ('00' + date.getUTCHours()).slice(-2) + ':' + 
         ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
         ('00' + date.getUTCSeconds()).slice(-2);

         console.log(timestamp);
         var timestamp_expiration = timestamp;
            var sql = "INSERT INTO TokenResetPassword (email, token, exp_date) VALUES ('" + email + "', '" + verif_code + "', '"+timestamp_expiration+"')";
            console.log("C'è un account con questa email");
            var query = db.query(sql, function(err, result) {
               if(err){
                  status = "ko";
                  console.log(sql)
               }
               else{
                  console.log(sql);

                  message = "Token created. ";
            
                  var link = "http://hevoke.com/account/reset-password?code="+verif_code;
         
                  var nodemailer = require('nodemailer');
         
                  /*
                  const transporter = nodemailer.createTransport({
                  name: 'smtp.dreamhost.com', // <= Add this
                  host: 'smtp.dreamhost.com',
                  secure: true,
                  port: 465,
                  auth: {
                        user: 'hola@perumaquinariasmt.com',
                        pass: 'pmmt2020'
                  }
                  });
                  */
/*
                  const transporter = nodemailer.createTransport({
                  host: "smtp.mailtrap.io",
                  port: 2525,
                  auth: {
                     user: "9d8d23a1f6fed5",
                     pass: "f0905363879baf"
                  }
                  });
*/
                  const transporter = nodemailer.createTransport({
                     host: "mail.hevoke.com",
                     port: 465,
                     secure: true,
                     auth: {
                        user: "no-reply@hevoke.com",
                        pass: "infoHevoke2021"
                     },
                     tls: {
                        rejectUnauthorized:false
                     }
                  });
                  /*
                  transporter.verify(function(error, success) {
                     if (error) {
                       console.log(error);
                     } else {
                       console.log("Server is ready to take our messages");
                     }
                  });*/

                  var htmlString='<html>';
                           htmlString += '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">';
                           htmlString += '<head>';
                           htmlString += '<meta http-equiv="Content-type" content="text/html; charset=utf-8" />';
                           htmlString += '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />';
                           htmlString += '<meta http-equiv="X-UA-Compatible" content="IE=edge" />';
                           htmlString += '<meta name="format-detection" content="date=no" />';
                           htmlString += '<meta name="format-detection" content="address=no" />';
                           htmlString += '<meta name="format-detection" content="telephone=no" />';
                           htmlString += '<meta name="x-apple-disable-message-reformatting" />';
                           htmlString += '<title>Email</title>';
                           htmlString += '<link rel="preconnect" href="https://fonts.gstatic.com"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Kanit:ital,wght@0,800;0,900;1,800&display=swap" rel="stylesheet"> <script src="https://kit.fontawesome.com/ce061fb4d7.js" crossorigin="anonymous"></script>';
                           htmlString += '<style type="text/css" media="screen">';
                           htmlString += '[style*="Roboto"] { font-family: Arial, sans-serif; }';
                           htmlString += 'body { min-width:100% !important; width:100%!important; line-height: 1.5; -webkit-text-size-adjust:none; color: #303030; }';
                           htmlString += 'img { -ms-interpolation-mode: bicubic; /* Allow smoother rendering of resized image in Internet Explorer */ }';
                           htmlString += '</style>';
                           htmlString += '</head>';
                           htmlString += '<body>';
                           htmlString += '<div style="background-color: #212121; font-family: \'DM Sans\', sans-serif; color: #ffffff; text-align: center; padding: 35px 0;">';
                           htmlString += '<div style="max-width: 900px; margin: 0 auto; background-color: #121212; padding: 35px; text-align: center;">';
                           /*htmlString += '<div style="line-height:30px; margin-top: 0px;"><img style="display:inline-block; line-height:0px;" src="https://webdevtrick.com/wp-content/uploads/logo-fb-1.png" width="60" height="60" alt="logo"></div>';*/
                           htmlString += '<div style="color:#ffffff; font-family: \'Kanit\', sans-serif; letter-spacing: -1px; font-weight: 800; font-size: 19px; margin-top: 5px;">HEVOKE</div>';
                           htmlString += '<div style="font-size: 36px; line-height: 30px; letter-spacing: -1px; margin-top: 35px; font-weight: 500;">Reset your password</div>';     
                           htmlString += '<div style="font-size: 19px; line-height: 30px; margin-top: 10px;">If you need to reset your password, click the button below:</div>';     
                           htmlString += '<a style="background-color: #585858; border: 0px solid #707070; color: #fff; font-size: 17px; text-decoration: none; padding: 0.8rem 2.2rem; margin-top: 20px; display: inline-block; width: auto; border-radius: 1px;" href='+link+'>Reset Password</a>';
                           htmlString += '<div style="color:#E8E8E8; font-size: 14px; line-height: 15px; margin-top: 20px;">or copy and paste this url:</div>';   
                           htmlString += '<div style="color:#808080; font-size: 14px; line-height: 15px; margin-top: 5px; white-space: wrap">'+link+'</div>';     
                           htmlString += '<div style="color:#E8E8E8; font-size: 15px; margin-top: 35px; border-top: 1px solid #696969; padding: 15px 0; border-bottom: 1px solid #696969;">';
                           /*htmlString += '<a>Instagram</a> <a>Youtube</a>';*/
                           htmlString += '<div style="display: inline-flex; gap: 27px; font-size: 27px"><i class="fab fa-facebook"></i> <i class="fab fa-youtube"></i> <i class="fab fa-instagram"></i></div>';
                           htmlString += '</div>';
                           htmlString += '<div style="color:#787878; font-size: 13px; margin-top: 30px;">Hai ricevuto questo messaggio perchè il tuo indirizzo email è stato indicato durante una registrazione su l26.com.<br>Se non hai fatto questa richiesta puoi segnalarcelo a info@l26.com.</div>';   
                           htmlString += '<div style="color:#5C5C5C; font-size: 12px; margin-top: 15px;">hevoke.com</div>';
                           htmlString += '</div>';
                           htmlString += '</div>';
                           htmlString += '</body>';
                           htmlString += '</html>';
         
                  var mailOptions = {
                  from: 'Hevoke <no-reply@hevoke.com>',
                  to: email,
                  subject: 'Your password reset link',
                  html: htmlString
                  };
         
                  transporter.sendMail(mailOptions, function(error, info){
                     if (error) {
                        console.log(error);
                     } else {
                        console.log('Email sent to ' + email + ' :' + info.response);
                        status = "ok";
                        message = message + "We sent a link. Check your email.";
                        res.render('request-reset-password.ejs', {status, message});
                     }
                  }); 

               }

            });

         }

      });

   } 
};




/*-------------------------------------------------------------------- GET POST /RESET-PASSWORD -------------------------------------------*/
exports.resetPassword = function(req, res){
   var message = "";

   if(req.method == "POST"){ //IF REQ POST
      var password = req.body.password;
      var passwordconfirm = req.body.passwordconfirm;
      var token = req.body.token;
      if(passwordconfirm != password){
         res.render('reset-password.ejs', {from: "post", status: false, message: "Password and confirm password fields don't match."});
      }

      var sql = "SELECT email FROM ResetPassword WHERE token='"+token+"' LIMIT 1;";          
      db.query(sql, function(err, results){ 
         if(results.length == 1){
            var email = results[0].email;
            var bcrypt = require('bcrypt');

            //hasho la password
            bcrypt.hash(password, 10, function(err, hash){
                  if(err){ console.log(err); }

                  var sql = "UPDATE UserArtist SET password='"+hash+"' WHERE email='"+email+"';";          
                  db.query(sql, function(err, results){  
                     if(err){
                        message = "A problem occurred."; console.log(message);
                        res.render('reset-password.ejs', {from: "post", status: false, message: message});
                     }
                     else{
                        message = "Your password has been updated."; console.log(message);
                        res.render('reset-password.ejs', {from: "post", status: true, message});
            
                     }
                  });
            
            });

         } 
         else{
                  message = "A problem occurred."; console.log(message);
                  res.render('reset-password.ejs',{from: "post", status: false, message});
         }

      });  
   }
     
   else{ //IF REQ GET
      var url_code = req.query.code;

      var sql = "SELECT * FROM TokenResetPassword WHERE token='"+url_code+"'LIMIT 1;";          
      db.query(sql, function(err, results){  

            if(results.length == 1){
               message = "You can now set a new password.";
               console.log(message);
               res.render('reset-password.ejs', {from: "get", status: true, message});
            }
            else{
               message = "This token is not valid or expired. Please, request a new link for password reset.";
               console.log(message);
               res.render('reset-password.ejs', {from: "get", status: false, message});
            }
      });
   }
};




/*------------------------------------------------------------------- GET POST /REQUEST-RESET-PASSWORD -------------------------------------*/
exports.setNewEmail = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect('/login'); return; }
   var status = ''; var message = '';

   if(logged && req.method == "GET"){
      var userLogged = req.session.userLogged;
      res.render('set-new-email', {userLogged, message});
   }

   if(logged && req.method == "POST"){
         var post = req.body;
         var email_new = post.email;
         var userLogged = req.session.userLogged;
         var userLoggedId = req.session.userLoggedId;
            
         //creo token codice verifica per conferma email
         const crypto = require('crypto');
         const token = crypto.randomBytes(16).toString("hex");
      
         var date = new Date();
         date.setHours(date.getHours() + 2);

         var timestamp = date.getUTCFullYear() + '-' +
         ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
         ('00' + date.getUTCDate()).slice(-2) + ' ' + 
         ('00' + date.getUTCHours()).slice(-2) + ':' + 
         ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
         ('00' + date.getUTCSeconds()).slice(-2);

         console.log(timestamp);
         var timestamp_expiration = timestamp;
         var sql = "INSERT INTO ChangeEmail (user_id, email_new, token, exp_date) VALUES ('" + userLoggedId + "', '" + email_new + "', '" + token + "', '"+timestamp_expiration+"')";
         console.log("post"+sql);
         var query = db.query(sql, function(err, result) {
               if(err){
                  status = "ko";
               }
               else{
                  console.log(sql);

                  message = "Il token è stato creato. ";
            
                  var link = "http://hevoke.com/account/update-email?token="+token;
         
                  var nodemailer = require('nodemailer');
         
                  const transporter = nodemailer.createTransport({
                  name: 'smtp.dreamhost.com', // <= Add this
                  host: 'smtp.dreamhost.com',
                  secure: false,
                  port: 25,
                  auth: {
                        user: 'hola@perumaquinariasmt.com',
                        pass: 'pmmt2020'
                  }
                  });

                  var htmlString='<html>';
                  htmlString += '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">';
                  htmlString += '<head>';
                  htmlString += '<meta http-equiv="Content-type" content="text/html; charset=utf-8" />';
                  htmlString += '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />';
                  htmlString += '<meta http-equiv="X-UA-Compatible" content="IE=edge" />';
                  htmlString += '<meta name="format-detection" content="date=no" />';
                  htmlString += '<meta name="format-detection" content="address=no" />';
                  htmlString += '<meta name="format-detection" content="telephone=no" />';
                  htmlString += '<meta name="x-apple-disable-message-reformatting" />';
                  htmlString += '<title>Email</title>';
                  htmlString += '<link href="https://fonts.googleapis.com/css?family=Roboto:400,500" rel="stylesheet" type="text/css" />';
                  htmlString += '<style type="text/css" media="screen">';
                  htmlString += '[style*="Roboto"] { font-family: "Roboto", Arial, sans-serif !important }';
                  htmlString += 'body { min-width:100% !important; width:100%!important; line-height: 1.5; -webkit-text-size-adjust:none; color: grey; }';
                  htmlString += 'img { -ms-interpolation-mode: bicubic; /* Allow smoother rendering of resized image in Internet Explorer */ }';
                  htmlString += '</style>';
                  htmlString += '</head>';
                  htmlString += '<body>';
                  htmlString += '<div style="color:#ffffff; letter-spacing: -1px; font-weight: bold; font-size: 19px; margin-top: 5px;">HEVOKE</div>';
                  htmlString += '<div style="color:#707070; font-size: 29px; line-height:30px; margin-top: 20px;">Confirm email change</div>';     
                  htmlString += '<div style="color:#707070;font-size: 20px; line-height:30px; margin-top: 15px;">Se hai richiesto tu il ripristino della tua password, puoi sceglierne una nuova cliccando il pulsante sotto:</div>';     
                  htmlString += '<a style="background-color: #758fff; color: #fff; font-size: 17px; text-decoration: none; padding: 0.8rem 2.3rem; margin-top: 20px; display: inline-block; width: auto; font-weight: bold; border-radius: 35px; " href='+link+'>Ripristina</a>';
                  htmlString += '<div style="color:#707070; font-size: 15px; line-height: 15px; margin-top: 20px;">oppure copia e incolla il seguente indirizzo: '+link+'</div>';     
                  htmlString += '<div style="color:#9e9e9e; font-size: 12px; line-height: 15px; margin-top: 30px;">Hai ricevuto questo messaggio perchè il tuo indirizzo email è stato indicato durante una registrazione su l26.com, se non hai fatto questa richiesta puoi segnalarcelo a info@l26.com.</div>';
                  htmlString += '<div style="color:#9e9e9e; font-size: 12px; margin-top: 15px; ">l26.com</div>';
                  htmlString += '</body>';
                  htmlString += '</html>';
         
                  var mailOptions = {
                  from: 'j and rick',
                  to: email_new,
                  subject: 'L26, confirm your new email address',
                  html: htmlString
                  };
         
                  transporter.sendMail(mailOptions, function(error, info){
                     if (error) {
                        console.log(error);
                     } else {
                        console.log('Email sent to ' + email_new + ' :' + info.response);
                        status = "ok";
                        message = message + "Email for verification has been sent.";
                        res.render('set-new-email.ejs', {userLogged, status, message});
                     }
                  }); 

               }

         });

   } 
};


/*----------------------------------------------------------------------- UPDATE EMAIL  ----------------------------------------------*/

exports.updateNewEmail = function(req, res){
   var message = "";
   
   if(req.method == "GET"){
      var url_code = req.query.token;

      var sql = "SELECT * FROM ChangeEmail WHERE token='"+url_code+"'LIMIT 1;";          
      db.query(sql, function(err, results){  

            if(results.length == 1){
               message = "Token is valid. We'll try to update the email.";
               var new_email = results[0].email_new;
               var sql = "UPDATE UserArtist SET email='"+new_email+"' WHERE user_id='"+results[0].user_id+"';";          
               db.query(sql, function(err, results){  
                  if(err){
                     message = "C'è stato un problema."; console.log(message);
                     res.render('update-email.ejs', {status: false, message});
                  }
                  else{
                     message = "Your email has been set to: " + new_email; console.log(message);
                     res.render('update-email.ejs', {status: true, message});
         
                  }
               });
            }
            else{
               message = "Il token non è valido. Prova ad effettuare una nuova richiesta."; console.log(message);
               res.render('update-email.ejs',{status: false, message});
            }

      });
   }
};



 /*----------------------------------------------------------------------- GET LOGOUT ----------------------------------------------*/
 exports.logout = function(req,res){
   var timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
   console.log(timestamp);
   var sql = "UPDATE TrackingSession SET time_logout='"+timestamp+"' WHERE session_id='"+req.session.sessionId+"'";
   db.query(sql, function(err, result){ 
      req.session = null,
      res.redirect("/login");
     /* req.session.destroy(function(err) {
         if(err){
            res.redirect('/');
         }
         res.redirect("/login");
      })*/
   });

 };


 /*----------------------------------------------------------------------- GET /MANAGE-PROFILE  ----------------------------------*/
 exports.manageProfile = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login"); return; }
   
   var userLoggedId = req.session.userLoggedId;
   var isEmptyCategories = false; var isEmptyGenres = false; var isEmptyLinks = false;

   var p1 = queryWrapper("SELECT * FROM UserArtist WHERE user_id='"+userLoggedId+"' LIMIT 1");
   var p2 = queryWrapper("SELECT * FROM UserCategory WHERE user_id='"+userLoggedId+"'");
   var p3 = queryWrapper("SELECT * FROM UserGenres WHERE user_id='"+userLoggedId+"'");
   var p4 = queryWrapper("SELECT * FROM UserLinks WHERE user_id='"+userLoggedId+"'");

   Promise.all([ p1, p2, p3, p4 ])
   .then(([result_fulluserlogged, result_categories, result_genres, result_links]) => {
         if(result_categories.length == 0){ isEmptyCategories = true;}
         if(result_genres.length == 0){ isEmptyGenres = true;}
         if(result_links.length == 0){ isEmptyLinks = true;}
         res.render('manage-profile.ejs', {logged, userLogged: result_fulluserlogged[0], isEmptyCategories, isEmptyGenres, isEmptyLinks});
         
   })
   .catch(err => { res.redirect('/home'); })
};



//-----------------------------------------------------------------------------------GET /EDIT-PROFILE-------------------------------------------------------
exports.getEditAttributeProfile = function (req, res) {
   var logged = check_logged(req.session.userLoggedId);
   var attribute = req.params.attribute;
   if(!logged || attribute == null){ res.redirect("/login"); return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;

   if(attribute == "categories"){
         var sql = "SELECT category_id FROM UserCategory WHERE user_id='"+userLoggedId+"' ORDER BY category_order";
         db.query(sql, function(err, userLoggedCategories){      
            if(!err){ res.render("edit-profile.ejs", {logged, userLogged, attribute, userLoggedCategories}); }
         });
   }
   if(attribute == "genres"){
          var sql = "SELECT cod_subgenre FROM UserGenres WHERE user_id='"+userLoggedId+"'";
          db.query(sql, function(err, userLoggedGenres){      
             if(!err){ res.render("edit-profile.ejs", {logged, userLogged, attribute, userLoggedGenres}); }
          });
    }
    if(attribute == "artist_name"){
          var sql = "SELECT last_edit_artist_name, created, artist_name,user_name FROM UserArtist WHERE user_id='"+userLoggedId+"'";
          db.query(sql, function(err, result){      
             if(!err){
                res.render("edit-profile.ejs", {logged, userLogged, attribute, lastEditArtistName: result[0].last_edit_artist_name, created:result[0].created, artistName:result[0].artist_name, userName:result[0].user_name});
             }
          });
    }
    if(attribute=="user_name"){
          var sql = "SELECT last_edit_user_name,user_name FROM UserArtist WHERE user_id='"+userLoggedId+"'";
          db.query(sql, function(err, result){      
             if(!err){
                res.render("edit-profile.ejs", {logged, userLogged, attribute, lastEditUserName: result[0].last_edit_user_name, userName:result[0].user_name});
             }
          });
    }
   if(attribute!="categories" && attribute!="genres" && attribute!="artist_name" && attribute!="user_name"){
      res.render("edit-profile.ejs", {logged, userLogged, attribute});
   }
};




function getMacroFromCategory(category){
   if(category=="video director" || category=="videographer"){  artist_macro = "V"; }
   else if(category=="dancer"){ artist_macro = "D"; }
   else{ artist_macro = "M"; }
   return artist_macro;
}

// date in YYYY-MM-DD format
function getCurrentDateForQuery(){ 
   let date_ob = new Date();
   let date = ("0" + date_ob.getDate()).slice(-2); // adjust 0 before single digit date
   let month = ("0" + (date_ob.getMonth() + 1)).slice(-2); // current month 
   let year = date_ob.getFullYear(); // current year
   let currentDate = year + "-" + month + "-" + date; // date in YYYY-MM-DD format
   return currentDate;
}

/*----------------------------------------------------------------- POST /EDIT-PROFILE -----------------------------------------------------*/
exports.postEditAttributeProfile = function (req, res) {
   var logged = check_logged(req.session.userLoggedId);
   var attribute = req.params.attribute;
   if(!logged || attribute == null){ res.redirect("/login"); return; }
   var userLoggedId = req.session.userLoggedId;
   var userLogged = req.session.userLogged;
   var post = req.body;
   var status = ""; var message = "";

  /*------------------------------------------------- PROVIENE DA MODIFICA DI GENERI ------------------------------------------*/
  if(attribute == "genres"){ 
            //elimina generi attuali associati
            var sql = "DELETE FROM UserGenres WHERE user_id='"+userLoggedId+"'";    
            db.query(sql, (err, rows) => { if(err) throw err; console.log('Number of rows deleted = ' + rows.affectedRows); });
            
            // SE HA SELEZIONATO PIU DI UN GENERE (post.genre è un array)
            if(post.genre instanceof Array){ 
                  let promises = [];
                  var genres_checked = post.genre;
                  
                  for(var i = 0; i < genres_checked.length; i++){
                     var cod_subgenre = genres_checked[i]; console.log(cod_subgenre);
                     promises.push(queryWrapper("INSERT INTO UserGenres VALUES ('"+userLoggedId+"', '"+cod_subgenre+"')")); console.log(promises[i]);
                  }
                  Promise.all(promises).then((results) => {
                     status = "OK"; console.log("tutti gli insert generi eseguiti con successo");
                     res.render('edit-profile-response.ejs', {logged, userLogged, status, message});
                  })
                  .catch((error) => { console.log("errore"); })
            }

            // SE HA SELEZIONATO UN SOLO GENERE (post.genre è una stringa singola, non serve il for)
            if(post.genre instanceof String || typeof post.genre === 'string'){
                  var sql = "INSERT INTO UserGenres VALUES ('"+userLoggedId+"', '"+post.genre+"')";                           
                  db.query(sql, function(err, results){      
                        status = "OK";
                        res.render('edit-profile-response.ejs',{logged, userLogged, status, message});
                  });
            }
  }


  /*---------------------------------------------- PROVIENE DA MODIFICA DI CATEGORIE -----------------------------------*/
   if(attribute == "categories"){  
            //elimina categorie attuali associate
            var sql = "DELETE FROM UserCategory WHERE user_id='"+userLoggedId+"'";    
            db.query(sql, (err, rows) => { if(err) throw err; console.log('Number of rows deleted = ' + rows.affectedRows); });
         
            // SE HA SELEZIONATO PIU DI UNA CATEGORIA (post.category è un array)
            if(post.category instanceof Array){ 
                  var promises = [];
                  var categories_checked = post.category;
                  var main_category_selected = "";

                  promises.push(queryWrapper("SELECT artist_macro, artist_type FROM UserArtist WHERE user_id='"+userLoggedId+"' LIMIT 1"));

                  for(var i = 0; i < categories_checked.length; i++){
                     var category = categories_checked[i]; console.log(category);
                     var orderValue = 0;
                     var order_category = "order-"+category;
                     if(order_category in post){
                        console.log(order_category + " " +post[order_category])
                        orderValue = post[order_category];
                        if(orderValue == 1){
                           main_category_selected = category;
                        }
                     }
                     promises.push(queryWrapper("INSERT INTO UserCategory VALUES ('"+userLoggedId+"', '"+category+"', "+orderValue+")")); console.log(promises[i]);
                  }

                  Promise.all(promises).then((results) => {
                     console.log("promises 1" + results)
                     console.log("fsgs:" + results[0][0]);
                     var userLoggedCurrentType = results[0][0].artist_type;
                     
                     if(userLoggedCurrentType != main_category_selected){
                           console.log("User is changing main artist type and macro");
                           var new_artist_macro = getMacroFromCategory(main_category_selected);
                           promises = [];
                           promises.push(queryWrapper("UPDATE UserArtist SET artist_macro='"+new_artist_macro+"', artist_type='"+main_category_selected+"' WHERE user_id ='"+userLoggedId+"'"));
                           promises.push(queryWrapper("UPDATE SignalCollaboration SET radar_id = NULL WHERE id_sender='"+userLoggedId+"'"));
                           req.session.userLogged.artist_type = main_category_selected;

                           Promise.all(promises).then((results) => {
                              status = "OK"; console.log("tutti gli insert categorie eseguiti con successo");
                              res.render('edit-profile-response.ejs', {logged, userLogged, status, message});
                           })
                           .catch((error) => { console.log("errore"); })
                     }
                     else{
                        status = "OK"; console.log("tutti gli insert categorie eseguiti con successo");
                        res.render('edit-profile-response.ejs', {logged, userLogged, status, message});
                     }
                    
                  })
                  .catch((error) => { console.log("errore"); })

            }

            // SE HA SELEZIONATO UNA SOLA CATEGORIA (post.category è una stringa)
            if(post.category instanceof String || typeof post.category === 'string'){
                  var category = post.category;
                  var sql = "SELECT artist_macro, artist_type FROM UserArtist WHERE user_id='"+userLoggedId+"' LIMIT 1";                           
                  db.query(sql, function(err, result){  
                        var userLoggedCurrentType = result[0].artist_type;
                        let promises = [];
                        promises.push(queryWrapper("INSERT INTO UserCategory VALUES ('"+userLoggedId+"', '"+category+"', 1)"));
                        if(userLoggedCurrentType != category){
                              console.log("user is changing main artist type and macro");
                              var new_artist_macro = getMacroFromCategory(category);
                              promises.push(queryWrapper("UPDATE UserArtist SET artist_macro='"+new_artist_macro+"', artist_type='"+category+"' WHERE user_id ='"+userLoggedId+"'"));
                              promises.push(queryWrapper("UPDATE SignalCollaboration SET radar_id = NULL WHERE id_sender='"+userLoggedId+"'"));
                           }
                        Promise.all(promises).then((results) => {
                           status = "OK"; console.log("tutti gli insert categorie eseguiti con successo");
                           req.session.userLogged.artist_type = category;
                           res.render('edit-profile-response.ejs', {logged, userLogged, status, message});

                        })
                        .catch((error) => { console.log("errore"); })
                  });
               
            }
            // SE NON HA SELEZIONATO NESSUNA CATEGORIA
            if(post.category == null || post.category == undefined || !post.category){
                  var sql = "UPDATE UserArtist SET artist_macro=null, artist_type='-' WHERE user_id ='"+userLoggedId+"'";
                  db.query(sql, function(err, result){
                        if(err){ status = "KO";}
                        if(result.affectedRows == 1){ status = "OK";}
                        res.render('edit-profile-response.ejs', {logged, userLogged, status, message});
                  });   
            }
   }


  /*----------------------------------------------PROVIENE DA MODIFICA ATTRIBUTI SEMPLICI ---------------------------------*/
  if(attribute=="artist_name" || attribute=="user_name" || attribute=="country" || attribute=="city" || attribute=="date_b" ||  attribute=="gender" || attribute=="bio" || attribute == "user_level"){  
      var input = post.input;
      if(attribute=="artist_name" && input != undefined){
            let currentDate = getCurrentDateForQuery();
            var sql = "UPDATE UserArtist SET "+attribute+"='"+input+"', last_edit_artist_name='"+currentDate+"' WHERE user_id='"+userLoggedId+"'";  
      }
      if(attribute=="user_name" && input != undefined){
            let currentDate = getCurrentDateForQuery();
            var sql = "UPDATE UserArtist SET "+attribute+"='"+input+"', last_edit_user_name='"+currentDate+"' WHERE user_id='"+userLoggedId+"'";
      }
      if(attribute=="date_b" ||  attribute=="gender" || attribute=="city"){
         if(attribute=="city"){ input = input.charAt(0).toUpperCase() + input.slice(1); }
         var sql = "UPDATE UserArtist SET "+attribute+"='"+input+"' WHERE user_id='"+userLoggedId+"'";   
      }
      if(attribute=="country" || attribute == "user_level"){
         var sql = "UPDATE UserArtist SET "+attribute+"='"+input+"' WHERE user_id='"+userLoggedId+"'";   
         if(input=="" || input=="-"){
            var sql = "UPDATE UserArtist SET "+attribute+"=null WHERE user_id='"+userLoggedId+"'";  
         }
      }
      if(attribute=="bio"){
         var sql = "UPDATE UserProfile SET "+attribute+"='"+input+"' WHERE user_id='"+userLoggedId+"'";   
      }
      
      console.log(sql);
      db.query(sql, function(err, result){
            if(err){ //se non è stato modificato il database
                  status = "KO";
                  res.render('edit-profile-response.ejs', {logged, userLogged, status, message});
            }
            if(result.affectedRows == 1){
                  status = "OK";
                  res.render('edit-profile-response.ejs', {logged, userLogged, status, message});
            }
           
      });

   }

};



/*new radar*/
//-------------------------------------------------------------------GET /NEW RADAR-------------------------------------------------------
exports.getNewRadar = function (req, res) {
   var logged = check_logged(req.session.userLoggedId);
  
   if(!logged){ res.redirect("/login"); return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
  
   var sql = "SELECT category_id FROM UserRadar WHERE user_id='"+userLoggedId+"' AND status='A'";
   db.query(sql, function(err, userLoggedRadarCategories){      
      console.log('userLoggedRadarCategories :>> ', userLoggedRadarCategories);
      if(!err){ res.render("new-radar.ejs", {logged, userLogged, userLoggedRadarCategories}); }
   });
 

};


/*----------------------------------------------------------------- POST NEW RADAR  -----------------------------------------------------*/
exports.postNewRadar = function (req, res) {
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login"); return; }
   var userLoggedId = req.session.userLoggedId;
   var userLogged = req.session.userLogged;
   var post = req.body;
   var status = ""; var message = "";

   var radar = post.category;

   // GUARD CLAUSE : SE NON HA SELEZIONATO NESSUNA CATEGORIA
   if(post.category == null || post.category == undefined || !post.category){
      status = "KO";
      res.render('new-radar-response.ejs', {logged, userLogged, status, message});
   }
   // GUARD CLAUSE : SE HA SELEZIONATO PIU DI UNA CATEGORIA NON VA BENE
   if(post.category instanceof Array){ 
      status = "KO"; message = "You can't choose more than one category.";
      res.render('new-radar-response.ejs', {logged, userLogged, status, message});
   }
   // SE HA SELEZIONATO UNA SOLA CATEGORIA OK
   if(post.category instanceof String || typeof post.category === 'string'){
      const { v4: uuidv4 } = require('uuid');
      var p1 = queryWrapper("SELECT COUNT(*) as count_radar FROM UserRadar WHERE user_id = '"+userLoggedId+"' AND category_id = '"+radar+"' AND status='A'");
      var p2 = queryWrapper("SELECT COUNT(*) as count_all_radar FROM UserRadar WHERE user_id = '"+userLoggedId+"' AND status='A'");

      Promise.all([p1, p2]).then(([rows_countRadar, rows_countAllRadarUser]) =>{
         let countAllRadarUser = rows_countAllRadarUser[0].count_all_radar;
         let countRadar = rows_countRadar[0].count_radar;
         if(countAllRadarUser < 3){
            if(countRadar == 0){
               var uuid = uuidv4();
               var sql = "INSERT INTO UserRadar (radar_id, user_id, category_id, status) VALUES ('"+uuid+"', '"+userLoggedId+"', '"+radar+"', 'A')";                      
               db.query(sql, function(err, results){  
                     if(err){ status = "KO";}    
                     status = "OK"; 
                     res.render('new-radar-response.ejs', {logged, userLogged, status, message});  
               });
            }
            else{
               status = "KO"; message = "You already have an active radar for this category.";
               res.render('new-radar-response.ejs', {logged, userLogged, status, message});
            }
         }
         else{
            status = "KO"; message = "You already have three active radars.";
            res.render('new-radar-response.ejs', {logged, userLogged, status, message});
         }
      })
      .catch((error) => {console.log("errore");})
   }
  


};




/*---------------------------------------------------------------- GET /CHAT -------------------------------------------------------------*/
exports.chat = function(req, res){
   var logged = check_logged(req.session.userLoggedId);   
   if(!logged){ res.redirect("/login"); return;}

   if(req.method != "POST"){
         var user_selected = ""; //utente vuoto
         var userLogged =  req.session.userLogged;
         var userLoggedId = req.session.userLoggedId;
         console.log('userLoggedId: '+userLoggedId);
         var sql = "SELECT sender_id, S.artist_name as sender_artist_name, S.user_name as sender_user_name, receiver_id, R.artist_name as receiver_artist_name, R.user_name as receiver_user_name, datetime_sent, content FROM UserMessage JOIN UserArtist S ON UserMessage.sender_id=S.user_id JOIN UserArtist R ON UserMessage.receiver_id=R.user_id WHERE sender_id='"+userLoggedId+"' OR receiver_id='"+userLoggedId+"' ORDER by datetime_sent";
         db.query(sql, function(err, results){
            resultsString = JSON.stringify(results);
            resultsString = resultsString.replace(/'/g, "\\'");
            resultsString = resultsString.replace(/"/g, '\\"');
            console.log("messages"+resultsString,"color: yellow");
            res.render('chat.ejs', {logged, userLogged, messages: resultsString, results, opened_with_user: user_selected});    
         });  
   }     
};




/*------------------------------------------------------- CHAT OPENED FROM USER -----------------------------------------------------------*/
exports.chatOpenedWithUser = function(req, res){
   var logged = check_logged(req.session.userLoggedId);   
   if(!logged){ res.redirect("/login"); return; }
   var userLogged =  req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   if(req.method == "POST"){
      var post  = req.body;
      var user_selected = new Array();
      user_selected['user_id'] = post.profile_userid;
      user_selected['artist_name'] = post.profile_artistname;
      user_selected['user_name'] = post.profile_username;
      var sql = "SELECT sender_id, S.artist_name as sender_artist_name, S.user_name as sender_user_name, receiver_id, R.artist_name as receiver_artist_name, R.user_name as receiver_user_name, datetime_sent, content FROM UserMessage JOIN UserArtist S ON UserMessage.sender_id=S.user_id JOIN UserArtist R ON UserMessage.receiver_id=R.user_id WHERE sender_id='"+userLoggedId+"' OR receiver_id='"+userLoggedId+"' ORDER by datetime_sent";
      db.query(sql, function(err, results){
            resultsString = JSON.stringify(results);
            resultsString = resultsString.replace(/'/g, "\\'");
            resultsString = resultsString.replace(/"/g, '\\"');
            console.log("opened with user" + user_selected['id'] + user_selected.length);
            res.render('chat.ejs', {userLogged, messages:resultsString, results ,logged, opened_with_user: user_selected});
      });  
   }
};



/* -------------------------------------------------------------------- GET /ACCOUNT/VERIFY ---------------------------------------------*/
exports.verify = function(req, res){
   var verif_code_url = req.query.code;
   var sql = "SELECT user_id FROM UserArtist WHERE verif_code='"+verif_code_url+"' AND active='0' LIMIT 1;";          
   db.query(sql, function(err, results){  
         if(results.length == 1){
            var userActivatingId = results[0].user_id;   
            var p1 = queryWrapper("UPDATE UserArtist SET active='1' WHERE user_id='"+userActivatingId+"' AND verif_code='"+verif_code_url+"' AND active='0';");
            var p2 = queryWrapper("INSERT INTO UserProfile (user_id) VALUES ('"+userActivatingId+"')");
            Promise.all([ p1, p2 ])
            .then(([activateUser, createProfile]) => {
               status = "OK";
               res.render('verify_response.ejs', {status});
            })
            .catch(err => {
               status = "KO";
               res.render('verify_response.ejs', {status});
            })
         }
         else{
            status = "KO";
            res.render('verify_response.ejs',{status});
         }
   });
   
};





/*-------------------------------------------------------------------GET /PROFILE------------------------------------------------------*/
exports.showProfile = function(req, res){
   var user_name = req.params.user_name;
   if(user_name==undefined || user_name=="undefined" || user_name==null){ res.redirect('/home'); return; }
   var logged = check_logged(req.session.userLoggedId);
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;

   Promise.all([ queryWrapper("SELECT * FROM UserArtist WHERE user_name='"+user_name+"' LIMIT 1") ])
      .then(([row_userfound]) => {
            var profileUserId = row_userfound[0].user_id;
            var p1 = queryWrapper("SELECT * FROM UserArtist WHERE user_id='"+profileUserId+"' LIMIT 1");
            var p2 = queryWrapper("SELECT * FROM UserProfile WHERE user_id='"+profileUserId+"' LIMIT 1");
            var p3 = queryWrapper("SELECT * FROM UserCategory WHERE user_id='"+profileUserId+"' ORDER BY category_order");
            var p4 = queryWrapper("SELECT * FROM UserGenres WHERE user_id='"+profileUserId+"'");
            var p5 = queryWrapper("SELECT * FROM UserLinks WHERE user_id='"+profileUserId+"'");
            var p6 = queryWrapper("SELECT * FROM UserRadar WHERE user_id='"+profileUserId+"' AND status='A'");
            var p7 = logged==true ? queryWrapper("SELECT * FROM UserLikes WHERE id_sender='"+userLoggedId+"' AND id_receiver='"+profileUserId+"' LIMIT 1") : Promise.resolve();
            var p8 = logged==true ? queryWrapper("SELECT * FROM UserFollows WHERE id_sender='"+userLoggedId+"' AND id_receiver='"+profileUserId+"' LIMIT 1") : Promise.resolve();
            var p9 = logged==true ? queryWrapper("SELECT * FROM SignalCollaboration WHERE id_sender='"+userLoggedId+"' AND id_receiver='"+profileUserId+"' LIMIT 5") : Promise.resolve();
            var p10 = logged==true ? queryWrapper("SELECT user_id, user_name, artist_name, artist_type, active FROM UserArtist WHERE user_id='"+userLoggedId+"' LIMIT 1") : Promise.resolve();
            
            
            Promise.all([ p1, p2, p3, p4, p5, p6, p7, p8, p9, p10])
            .then(([row_user, row_profile, rows_user_categories, rows_user_genres, rows_user_links, rows_user_radar, rows_logged_likes_this, rows_logged_follows_this, rows_logged_signalscollab_this, result_fulluserlogged]) => {
                  if(result_fulluserlogged!=undefined){ userLogged = result_fulluserlogged[0]; }
                  else{ userLogged = ""; }
                  var logged_likes_this = false;
                  var logged_follows_this = false;
                  if(rows_logged_likes_this != undefined && rows_logged_likes_this.length == 1){ logged_likes_this = true; }
                  if(rows_logged_follows_this != undefined && rows_logged_follows_this.length == 1){ logged_follows_this = true; }

                  if(logged){
                     var timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                     var sql = "INSERT INTO TrackingProfileView (user_id_profile, user_id_viewer, time) VALUES ('"+profileUserId+"', '"+userLoggedId+"', '"+timestamp+"')";
                     db.query(sql, function(err, results){
                         console.log(sql);
                     });
                  }
                  

   
                  res.render('profile.ejs', {logged, userLogged, userProfile: row_user[0], userProfileTableProfile: row_profile[0], userProfileCategories: rows_user_categories, userProfileGenres: rows_user_genres, userProfileLinks: rows_user_links, userProfileRadars: rows_user_radar, logged_likes_this, logged_follows_this, rows_logged_signalscollab_this});
            })
            .catch(err => {
               console.log(err);
                  res.redirect('/home');
            })
      })
      .catch(err => {
         res.redirect('/home');
      })
};



/*---------------------------------------------------------- AJAX - PAGE SIGNUP CHECK USERNAME  --------------------------------------------*/
exports.signupCheckUsername = function(req, res){
   var usernameAvailable = false;
   var sql = "SELECT COUNT(*) AS countArtist FROM UserArtist WHERE user_name= '" + req.body.username+ "'";
   db.query(sql, function(err, result){
         if(result[0].countArtist == 0){ usernameAvailable = true; }
         else{ usernameAvailable = false; }
         res.send(JSON.stringify(usernameAvailable));
   })
};


/*--------------------------------------------------------- AJAX - PAGE SIGNUP CHECK EMAIL -------------------------------------------------*/
exports.signupCheckEmail = function(req, res){
   var emailAvailable = false;
   var sql = "SELECT COUNT(*) AS countEmail FROM UserArtist WHERE email = '" + req.body.email+ "'";
   db.query(sql, function(err, result){
      if(result[0].countEmail == 0){ emailAvailable = true; }
      else{ emailAvailable = false; }
      res.send(JSON.stringify(emailAvailable));
   })
};


/*--------------------------------------------------------- AJAX - PAGE PROFILE BUTTON LIKE --------------------------------------------------*/
exports.buttonAjaxLike = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ return; }
   var post = req.body;
   var id_sender = req.session.userLoggedId;
   var id_receiver = post.id_receiver;

   if(post.current_status == 0){
      var sql = "INSERT INTO UserLikes (id_sender, id_receiver) VALUES ('"+id_sender+"','"+id_receiver+"')";
      db.query(sql, function(err, result){
            if(err) { new_status = 0; console.log("Error."); }
            else { new_status = 1; console.log("INSERTED."); }  
            res.send(JSON.stringify({new_status}));          
      });
   }
   if(post.current_status == 1){
      var sql = "DELETE FROM UserLikes WHERE id_sender='"+id_sender+"' AND id_receiver='"+id_receiver+"'";
      db.query(sql, function(err, result){
            if(err) { new_status = 1; console.log("Error."); }
            else { new_status = 0; console.log("DELETED."); }    
            res.send(JSON.stringify({new_status}));
      });
   }
};



/*------------------------------------------------------- AJAX - PAGE PROFILE BUTTON FOLLOW -------------------------------------------------*/
exports.buttonAjaxFollow = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ return; }
   var post = req.body;
   var id_sender = req.session.userLoggedId;
   var id_receiver = post.id_receiver;

   if(post.current_status == 0){
      var sql = "INSERT INTO UserFollows (id_sender, id_receiver) VALUES ('"+id_sender+"','"+id_receiver+"')";
      db.query(sql, function(err, result){
            if(err) { new_status = 0; console.log("Error."); }
            else { new_status = 1; console.log("INSERTED."); }  
            res.send(JSON.stringify({new_status}));          
      });
   }
   if(post.current_status == 1){
      var sql = "DELETE FROM UserFollows WHERE id_sender='"+id_sender+"' AND id_receiver='"+id_receiver+"'";
      db.query(sql, function(err, result){
            if(err) { new_status = 1; console.log("Error."); }
            else { new_status = 0; console.log("DELETED.");  }    
            res.send(JSON.stringify({new_status}));
      });
   } 
};


/*------------------------------------------------------- AJAX - PAGE PROFILE BUTTON SIGNAL COLLABORATION -------------------------------------------------*/

exports.buttonAjaxCollaboration = (req,res) =>{
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ return; }
   var post = req.body;
   var id_sender = req.session.userLoggedId;
   var id_receiver = post.id_receiver;
   var radar_id = post.radar_id;

   var controlSignalCollaboration;
   
   if(radar_id != ""){controlSignalCollaboration= "radar_id='"+radar_id+"' AND";} else{controlSignalCollaboration= "";}
   
   if(post.current_status == 0){
      if(radar_id != ""){
         var sql = "INSERT INTO SignalCollaboration (id_sender, id_receiver, radar_id) VALUES ('"+id_sender+"', '"+id_receiver+"', '"+radar_id+"')";
         
      }else{
         var sql = "INSERT INTO SignalCollaboration (id_sender, id_receiver) VALUES ('"+id_sender+"','"+id_receiver+"')";
      }
      console.log(sql);
      db.query(sql, function(err, result){
         if(err) { new_status = 0; console.log("Error."); }
         else { new_status = 1; console.log("INSERTED."); }
         res.send(JSON.stringify({new_status}));
      });
   }
   
   if(post.current_status == 1){
      var sql = "DELETE FROM SignalCollaboration WHERE "+controlSignalCollaboration+" id_sender='"+id_sender+"' AND id_receiver='"+id_receiver+"'";
      db.query(sql, function(err, result){
         if(err) { new_status = 1; console.log("Error."); }
         else { new_status = 0; console.log("DELETED."); }
         res.send(JSON.stringify({new_status}));
      });
   }
   
};


/*------------------------------------------------------- AJAX - PAGE CHAT BUTTON SEND MSG  -------------------------------------------------*/
exports.ajaxSendMessage = function(req, res){
      let message_inserted = false;
      var post = req.body;
      var sender = post.sender_message;
      var receiver = post.receiver_message;
      var content = post.content_message;
      var datetime_sent;
      console.log(content);
      /* content = content.replace(/'/g, "''"); */
      var sql = "INSERT INTO UserMessage (sender_id, receiver_id, content) VALUES ('"+sender+"', '"+receiver+"', ?)";
      var param = [content];
      sql = mysql.format(sql, param);
      console.log(sql);
      db.query(sql, function(err, result){
         if(err) {
            message_inserted = false; console.log("Err!");
         }
         else {      
            message_inserted = true;
         }
         if(message_inserted == true){
            console.log("RECORD INSERTED IN DB.");
            var sql = "SELECT MAX(datetime_sent) as max_datetime_sent FROM UserMessage WHERE sender_id ='"+sender+"' AND receiver_id='"+receiver+"' AND content=?";
            var param = [content];
            sql = mysql.format(sql, param);
            db.query(sql, function(err, result){
               datetime_sent = result;         
               res.send(JSON.stringify({message_inserted, content, sender, datetime_sent}));
            });
         }
         else{
            res.send(JSON.stringify({message_inserted, content, sender}));
         }
         
      });
};


/*---------------------------------------------- AJAX - PAGE CHAT CHECK INCOMING MESSAGES  -------------------------------------------------*/
exports.ajaxCheckNewMessagesChat = function(req, res){
   var post = req.body;
   var user_logged = post.user_logged;
   var artistIdChats = post.artistIdChats;
   var artistsIdsChatsForQuery = artistIdChats.substring(1, artistIdChats.length-1);

   var now = new Date();
   let date = ("0" + now.getDate()).slice(-2); let month = ("0" + (now.getMonth() + 1)).slice(-2); let year = now.getFullYear();
   let hours = now.getHours(); let minutes = now.getMinutes(); let seconds = now.getSeconds();
   var now = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

   now_minus_ten = new Date();
   now_minus_ten.setSeconds(now_minus_ten.getSeconds() - 10);

   let date2 = ("0" + now_minus_ten.getDate()).slice(-2); let month2 = ("0" + (now_minus_ten.getMonth() + 1)).slice(-2);
   let year2 = now_minus_ten.getFullYear();
   let hours2 = now_minus_ten.getHours(); let minutes2 = now_minus_ten.getMinutes(); let seconds2 = now_minus_ten.getSeconds();
   now_minus_ten = year2 + "-" + month2 + "-" + date2 + " " + hours2 + ":" + minutes2 + ":" + seconds2;
   artistsIdsChatsForQuery = artistsIdsChatsForQuery.replace(/"/g, "'");
   var sql = "SELECT sender_id, receiver_id, datetime_sent, content FROM UserMessage WHERE sender_id IN("+artistsIdsChatsForQuery+") AND receiver_id='"+user_logged+"' AND datetime_sent >= '"+now_minus_ten+"' AND datetime_sent <= '"+now+"'";
   db.query(sql, function(err, results){
         console.log(sql);
         var arrayNewMessages;
         if(err) { var foundMessages = undefined; }
         if(results.length==0){ var foundMessages = false; }
         if(results.length>=1){
            var foundMessages = true;
            var arrayNewMessages = results; 
            console.log("FOUND NEW MESSAGE");
            console.log(JSON.stringify({foundMessages, arrayNewMessages }));
         }
         res.send(JSON.stringify({foundMessages, arrayNewMessages, now_minus_ten, now}));
   });
      
};


/*---------------------------------------------- EDIT PROFILE ADD LINKS  -------------------------------------------------*/

exports.profileAddLinks = function(req, res){
      var logged = check_logged(req.session.userLoggedId);
      if(!logged){ res.redirect("/login");  return; }
      var userLoggedId = req.session.userLoggedId;
      var userLogged = req.session.userLogged;
      var msg = '';

      if(req.method == "GET"){
         var sql = "SELECT * FROM UserLinks WHERE user_id='"+userLoggedId+"'";
         db.query(sql, (err, results)=>{
            res.render('edit-profile-links.ejs', {message: msg, logged, userLogged, link:results});
         })
      }  
   
      if(req.method == "POST"){
         var arr_links = [];
         var post  = req.body;
         var youtube = post.youtube;
         var instagram = post.instagram;
         var facebook = post.facebook;
         var spotify = post.spotify;
         var twitter = post.twitter;
         var link_type;
   
         if(youtube != undefined && youtube !=''){ arr_links.push({name:"youtube", url:youtube}) }
         if(instagram != undefined && instagram !=''){ arr_links.push({name:"instagram", url:instagram}) }
         if(facebook != undefined && facebook !=''){ arr_links.push({name:"facebook", url:facebook}) }
         if(spotify != undefined && spotify !=''){ arr_links.push({name:"spotify", url:spotify}) }
         if(twitter != undefined && twitter !=''){  arr_links.push({name:"twitter", url:twitter}) }
   
         console.log(arr_links);
         
         arr_links.forEach(element => {
            
            var sql = "SELECT COUNT(*) as count_link FROM UserLinks WHERE user_id='"+userLoggedId+"' AND link_name='"+element.name+"'";
            db.query(sql, (err, result)=>{
               if(result[0].count_link == 1){
                  var sql = "UPDATE UserLinks SET url='"+element.url+"' WHERE user_id='"+userLoggedId+"' AND link_name='"+element.name+"'";
                  db.query(sql, function(err, res){ 
                     /*if(err){
                        msg = 'Non aggiornato'; console.log('Non aggiornato');
                        res.render('edit-profile-links.ejs',{message: msg});
                     }*/
                  });  
               }
               if(result[0].count_link == 0){
                  if(element.name=="instagram" || element.name=="facebook" || element.name=="twitter") { link_type = "follow"; }
                  else{ link_type = "listen"; }
                  var sql = "INSERT INTO UserLinks (user_id, link_type, link_name, url) VALUES ('"+userLoggedId+"', '"+link_type+"', '"+element.name+"', '"+element.url+"')";
                  db.query(sql, function(err, res){ 
                     /*if(err){
                        msg = 'Non aggiornato'; console.log('Non aggiornato');
                        res.render('edit-profile-links.ejs',{message: msg});
                     }*/
                  });
               }
            }) /*end of query count*/
         }); /*end of foreach*/
   
         res.redirect('/profile/'+userLogged.user_name);
         console.log("link aggiornati o inseriti");
      }        
};
   

/*-------------------------------------------------- AJAX EDIT PROFILE DELETE LINK   -----------------------------------------------------*/
exports.ajaxDeleteLink = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   var delete_link = false;
   if(logged){
      var post = req.body;
      var link = post.link_name;
      var user = post.id;
      var sql = "DELETE FROM UserLinks WHERE user_id='"+user+"' AND link_name='"+link+"'";
      db.query(sql, (err, results)=>{
         if(err){
            res.redirect('/profile-add-links');
         }
         delete_link = true;
         res.send(JSON.stringify(delete_link));
      })
   }
};


/*------------------------------------------------------- AJAX - PAGE PROFILE BUTTON FOLLOW -------------------------------------------------*/
exports.ajaxTrackClickLink = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   
   var post = req.body;
   var profile_user_id = post.id_user_profile;
   var link_name = post.link_name;
   var link_url = post.link_url;
   var timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
   
   if(logged){
      var clicker_user_id = req.session.userLoggedId;
      var sql = "INSERT INTO TrackingUserClickLink (id_user_profile, id_user_clicking, link_name, link_url, time) VALUES('"+profile_user_id+"', '"+clicker_user_id+"', '"+link_name+"', '"+link_url+"', '"+timestamp+"')";
   }
   if(!logged){
      var sql = "INSERT INTO TrackingVisitorClickLink (id_user_profile, link_name, link_url, time) VALUES ('"+profile_user_id+"', '"+link_name+"', '"+link_url+"', '"+timestamp+"')";
   }
   console.log(sql);
   db.query(sql, function(err, result){
         if(err) { status = "KO" }
         else { status = "OK"}    
         res.send(JSON.stringify({status}));
   }); 
};


exports.deleteRadar = (req, res) =>{ 
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var post = req.body; console.log('post :>> ', post);
   var radarId = post.radar_id; console.log('radar_id :>> ', radarId);
   if(logged){
      var sql = "UPDATE UserRadar SET status='U' WHERE radar_id = '"+radarId+"'";
      db.query(sql, (err, result) =>{
         if(err) { status = "KO" }
         else { status = "OK"; res.redirect('/myconnections/radars')}  
      });
   }
};




//-----------------------------------------------------------------GET /PROFILE-ADD-IMAGE-----------------------------------
exports.getEditImage = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login"); return; }
   var userLogged =  req.session.userLogged;
   res.render('edit-profile-image.ejs', {logged, userLogged});
};


//-------------------------------------------------------------------------------------------------------------------
//var upload = multer({ dest: "public/uploads" }).single("photo");  
// If you do not want to use diskStorage then uncomment it 


const multer = require('multer');
var path = require('path');
const fs = require("fs");

var storage = multer.diskStorage({ 
   destination: function (req, file, cb) {
       // Uploads is the Upload_folder_name 
       const path = `public/uploads/${req.session.userLoggedId}`;
       fs.mkdirSync(path, { recursive: true });
       cb(null, path) 
   }, 
   filename: function (req, file, cb) { 
     cb(null, "profile.jpg") 
   } 
 }) 
      
 // Define the maximum size for uploading  picture i.e. 1 MB. it is optional 
 const maxSize = 4 * 1000 * 1000; 
   
 var upload = multer({  
   storage: storage, 
   limits: { fileSize: maxSize }, 
   fileFilter: function (req, file, cb){ 
       // Set the filetypes, it is optional 
       var filetypes = /jpeg|jpg|png/; 
       var mimetype = filetypes.test(file.mimetype); 
       var extname = filetypes.test(path.extname(file.originalname).toLowerCase()); 
       if (mimetype && extname) { 
           return cb(null, true); 
       } 
       cb("Error: File upload only supports the " + "following filetypes - " + filetypes); 
     }  
 
 // mypic is the name of file attribute 
 }).single("photo");        

//---------------------------------------------------------------POST EDIT PROFILE IMAGE----------------------------------------------------
exports.postEditImage = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged =  req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var status; var message; 
   // Error MiddleWare for multer file upload, so if any error occurs, the image would not be uploaded! 
   upload(req,res,function(err) { 
       if(err) { 
           // ERROR occured (here it can be occured due to uploading image of size greater than 1MB or uploading different file type)
           status = "KO"; message = err.message; 
           res.render("edit-profile-response.ejs", {logged, userLogged, status, message});
       } 
       else { 
           // SUCCESS, image successfully uploaded 
           status = "OK"; message = "";
           res.render("edit-profile-response.ejs", {logged, userLogged, status, message});
       } 
   }) 
 };
 