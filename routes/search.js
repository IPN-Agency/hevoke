function check_logged(ele){ return ele != undefined; }

const queryWrapper = (statement) => {
   return new Promise((resolve, reject) => {
       db.query(statement, (err, result) => {
           if(err){ return reject(err); }
           resolve(result);
       });
   });
};

exports.search = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(logged){ var userLogged = req.session.userLogged; }
   res.render('search',{menuActiveSearch:true, logged, userLogged});
 };


 exports.searchResult = function(req, res){
   var sql = ''; var sql_select = ''; var sql_where = '';
   var logged = check_logged(req.session.userLoggedId);
   var userLogged = req.session.userLogged;

   if(req.method == "GET"){
      var get = req.query;
      var sql_select = "SELECT SQL_CALC_FOUND_ROWS * FROM UserArtist";
      var sql_where = " WHERE active='1'";

         if(get.country && get.country != "all"){
            var country = get.country;
            sql_where = `${sql_where} AND country= '`+country+`'`;
         }

         if(get.gender && get.gender != "all"){
            if(get.gender=="m"){ sql_where = `${sql_where} AND gender='M'`; }
            if(get.gender=="f"){ sql_where = `${sql_where} AND gender='F'`; }
         }

        if(get.category && get.category != "all"){
            console.log(String(get.category));
            if (typeof get.category === 'string' || get.category instanceof String){
                  var selectedCategory = get.category;
                  sql_where = `${sql_where} AND user_id IN (SELECT user_id FROM UserCategory WHERE category_id='${selectedCategory}')`;
            }
            else{
                  var stringSelectedCategories = "";
                  Object.values(get.category).forEach(val => { stringSelectedCategories+="'"+val+"',"; });
                  stringSelectedCategories = stringSelectedCategories.substring(0, stringSelectedCategories.length - 1);
                  sql_where = `${sql_where} AND user_id IN (SELECT user_id FROM UserCategory WHERE category_id IN (${stringSelectedCategories}))`;
            }
         }

         if(get.genre && get.genre != "all"){
               console.log(String(get.genre));
               if (typeof get.genre === 'string' || get.genre instanceof String){
                     var selectedGenre = get.genre;
                     sql_where = `${sql_where} AND user_id IN (SELECT user_id FROM UserGenres WHERE cod_subgenre='${selectedGenre}')`;
               }
               else{
                     var stringSelectedGenres = "";
                     Object.values(get.genre).forEach(val => { stringSelectedGenres+="'"+val+"',"; });
                     stringSelectedGenres = stringSelectedGenres.substring(0, stringSelectedGenres.length - 1);
                     sql_where = `${sql_where} AND user_id IN (SELECT user_id FROM UserGenres WHERE cod_subgenre IN (${stringSelectedGenres}))`;
               }
         }


         if(!get.sortby){
            sql = `${sql_select} ${sql_where}`;
         }

         //se è dichiarato parametro sortby allora aggiungo clausola finale
         if(get.sortby){
               if(get.sortby=="auto"){
                  sql = `SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes JOIN UserArtist ON id_receiver = user_id ${sql_where} GROUP BY (id_receiver) ORDER BY COUNT(id_receiver) DESC`;
               }
               if(get.sortby=="likes"){
                  sql = `SELECT UserArtist.user_id, UserArtist.artist_name, UserArtist.user_name, UserArtist.country, UserArtist.city, COUNT(id_receiver) as countlike FROM UserLikes JOIN UserArtist ON id_receiver = user_id ${sql_where} GROUP BY (id_receiver) ORDER BY COUNT(id_receiver) DESC`;
               }
               if(get.sortby=="newusers"){
                  sql = `${sql_select} ${sql_where} ORDER BY created DESC`;
               }
               if(get.sortby=="artist_name"){
                  sql = `${sql_select} ${sql_where} ORDER BY artist_name`;
                
               }
         }

         sql = sql + " LIMIT 12";

         console.log("🚀 ~ file: search.js ~ line 103 ~ sql", sql)
         db.query(sql, function(err, results){  

            sql2 = "SELECT FOUND_ROWS() as numResultsAvailable";
            db.query(sql2, function(err, result){  
               res.render('search-result.ejs', {menuActiveArtists:true, users_result: results, sql, logged, userLogged, form: req.query, total_results_available: result[0].numResultsAvailable});
            });
         });

   }
};


exports.connections = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var p1 = queryWrapper("SELECT * FROM UserLikes JOIN UserArtist ON UserLikes.id_sender=UserArtist.user_id WHERE id_receiver='"+userLoggedId+"'");
   var p2 = queryWrapper("SELECT * FROM UserFollows JOIN UserArtist ON UserFollows.id_sender=UserArtist.user_id WHERE id_sender='"+userLoggedId+"'");
   var p3 = queryWrapper("SELECT * FROM SignalCollaboration JOIN UserArtist ON SignalCollaboration.id_sender=UserArtist.user_id WHERE id_receiver='"+userLoggedId+"';")
   
   Promise.all([p1, p2, p3])
   .then(([rows_likes, rows_followers, rows_signalscollab]) => {
      var num_likes = rows_likes.length;
      var num_following = rows_followers.length;
      var num_signalscollab = rows_signalscollab.length;

      res.render('myconnections.ejs', {logged, userLogged, menuActiveConnections:true, active: "dashboard", num_likes, num_following, num_signalscollab});
   })
   .catch(err => {
      res.redirect('/home');
   })
};

exports.radarsReport = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;

   var p1 = queryWrapper("SELECT * FROM UserRadar WHERE user_id='"+userLoggedId+"' AND status='A';");
   var p2 = queryWrapper("SELECT * FROM SignalCollaboration JOIN UserArtist ON SignalCollaboration.id_sender=UserArtist.user_id WHERE id_receiver='"+userLoggedId+"' ORDER BY datetime_sent DESC;");

   Promise.all([p1, p2])
   .then(([res_radars, res_users]) => {
      /* for (var i=0; i<res_radars.length; i++) { promises.push(res_radars[i].radar_id); } */
      res.render('radars.ejs', {logged, userLogged, menuActiveConnections:true, active: "radars", users_result:res_users, res_radars});
   })
   .catch(err => {
      res.redirect('/home');
   })
};



exports.radarSignals = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var radar_id = req.params.radar_id;
   var p1 = queryWrapper("SELECT * FROM UserRadar WHERE user_id='"+userLoggedId+"' AND radar_id='"+radar_id+"' AND status='A' LIMIT 1;");
   var p2 = queryWrapper("SELECT * FROM SignalCollaboration JOIN UserArtist ON SignalCollaboration.id_sender=UserArtist.user_id WHERE id_receiver='"+userLoggedId+"' AND radar_id='"+radar_id+"' ORDER BY datetime_sent DESC;");

   Promise.all([p1, p2])
   .then(([res_radar, res_signals]) => {
      /* for (var i=0; i<res_radars.length; i++) { promises.push(res_radars[i].radar_id); } */
      console.log(res_radar);
      res.render('radar-signals.ejs', {logged, userLogged, menuActiveConnections:true, active: "radars", res_radar: res_radar[0], users_result:res_signals});
   })
   .catch(err => {
      res.redirect('/home');
   })
};



exports.signalsCollaborationReceived = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;

   var p1 = queryWrapper("SELECT * FROM UserRadar WHERE user_id='"+userLoggedId+"';");
   var p2 = queryWrapper("SELECT * FROM SignalCollaboration JOIN UserArtist ON SignalCollaboration.id_sender=UserArtist.user_id WHERE id_receiver='"+userLoggedId+"' AND radar_id is NULL ORDER BY datetime_sent DESC;");
 
   Promise.all([p1, p2])
   .then(([res_radars, res_users]) => {
      /* for (var i=0; i<res_radars.length; i++) { promises.push(res_radars[i].radar_id); } */
      res.render('signals-collab-received.ejs', {logged, userLogged, menuActiveConnections:true, active: "signals-collab-received", users_result:res_users, res_radars });
   })
   .catch(err => {
      res.redirect('/home');
   })
};


exports.signalsCollaborationSent = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;

   var p1 = queryWrapper("SELECT * FROM UserRadar WHERE user_id='"+userLoggedId+"';");
   var p2 = queryWrapper("SELECT * FROM SignalCollaboration JOIN UserArtist ON SignalCollaboration.id_receiver=UserArtist.user_id WHERE id_sender='"+userLoggedId+"' ORDER BY datetime_sent DESC;");
 
   Promise.all([p1, p2])
   .then(([res_radars, res_users]) => {
      /* for (var i=0; i<res_radars.length; i++) { promises.push(res_radars[i].radar_id); } */
      res.render('signals-collab-sent.ejs', {logged, userLogged, menuActiveConnections:true, active: "signals-collab-sent", users_result:res_users, res_radars });
   })
   .catch(err => {
      res.redirect('/home');
   })
};


exports.likeReceived = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var sql = "SELECT * FROM UserLikes JOIN UserArtist ON UserLikes.id_sender=UserArtist.user_id WHERE id_receiver='"+userLoggedId+"' ORDER BY datetime_sent DESC";
   db.query(sql, function(err, result){  
      res.render('like-received.ejs', {logged, userLogged, menuActiveConnections:true, active: "likes-received", users_result:result, sql});
   });
};

exports.likeSent = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var sql = "SELECT * FROM UserLikes JOIN UserArtist ON UserLikes.id_receiver=UserArtist.user_id WHERE id_sender='"+userLoggedId+"' ORDER BY datetime_sent DESC";
   db.query(sql, function(err, result){  
      res.render('like-sent.ejs', {logged, userLogged, menuActiveConnections:true, active: "likes-sent", users_result:result, sql});
   });
};


exports.followers = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var sql = "SELECT * FROM UserFollows JOIN UserArtist ON UserFollows.id_sender=UserArtist.user_id WHERE id_receiver='"+userLoggedId+"' ORDER BY datetime_sent DESC";
   db.query(sql, function(err, result){  
      res.render('followers.ejs', {logged, userLogged, menuActiveConnections:true, active: "followers", users_result:result, sql});
   });
};


exports.following = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var sql="SELECT * FROM UserFollows JOIN UserArtist ON UserFollows.id_receiver=UserArtist.user_id WHERE id_sender='"+userLoggedId+"' ORDER BY datetime_sent DESC";
   db.query(sql, function(err, result){  
         res.render('following.ejs', {logged, userLogged, menuActiveConnections:true, active: "following", users_result:result, sql});
   });
};







exports.feed = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var sql = "SELECT Post.user_id, artist_name, post_type, post_title, url, datetime_feed FROM Post JOIN UserArtist ON UserArtist.user_id=Post.user_id WHERE Post.user_id IN (SELECT user_id FROM UserFollows JOIN UserArtist ON UserFollows.id_receiver=UserArtist.user_id WHERE id_sender='"+userLoggedId+"') ORDER BY Post.created DESC";
   db.query(sql, function(err, result){  
         res.render('feed.ejs', {posts:result, sql, logged, userLogged});
   });
};


exports.showAllGenres = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   var userLogged = req.session.userLogged;
   var sql="SELECT * FROM Genre ORDER BY genre";
   db.query(sql, function(err, genres_result){  
      if(logged){
         res.render('genres.ejs',{menuActiveGenres:true, genres_result, sql, logged, userLogged});
      }
      else{
         res.render('genres.ejs',{menuActiveGenres:true, genres_result, sql, logged});
      }
   });
};

 

exports.allUsers = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(logged){ var userLogged = req.session.userLogged; }
   var p1 = queryWrapper("SELECT * FROM UserArtist ORDER BY created DESC");
   var p2 = queryWrapper("SELECT * FROM UserArtist ORDER BY artist_name");
  
   Promise.all([ p1, p2 ])
    .then(([users_result, users_result2]) => {
      res.render('cards.ejs',{logged, userLogged, users_result: users_result, users_result2: users_result2 });
    })
    .catch(err => {
        res.redirect('/home');
    })  
};



/*------------------------------------------------------------ GET GENRE/ ------------------------------------------------------*/
exports.showGenre = function (req, res){
   var genre_url = req.params.type_genre;
   var logged = check_logged(req.session.userLoggedId);
   if(logged){ var userLogged = req.session.userLogged; }
   if(genre_url == null){ res.redirect("/home"); return; }
   var get = req.query;
   var sql = "";
   var sql_select = "SELECT DISTINCT(UserArtist.user_id), artist_name, user_name, artist_type, artist_macro, country, created FROM UserArtist JOIN UserGenres ON UserArtist.user_id = UserGenres.user_id JOIN Subgenre ON UserGenres.cod_subgenre = Subgenre.subgenre";
   var sql_where = "WHERE cod_genre = '"+genre_url+"' AND active='1' AND user_name!=''";

   if(!get.sortby){
      sql = `${sql_select} ${sql_where}`;
   }

   if(get.sortby){
      if(get.sortby=="newusers"){
         sql = `${sql_select} ${sql_where} ORDER BY created DESC`;
      }
      if(get.sortby=="artist_name"){
         sql = `${sql_select} ${sql_where} ORDER BY artist_name`;
      }
      if(get.sortby=="likes" || get.sortby=="auto"){
         sql = `SELECT UserArtist.user_id, UserArtist.artist_name, UserArtist.user_name, UserArtist.artist_macro, UserArtist.country, COUNT(id_receiver) as countlike FROM UserLikes JOIN UserArtist ON id_receiver = user_id JOIN UserGenres ON UserArtist.user_id = UserGenres.user_id JOIN Subgenre ON UserGenres.cod_subgenre = Subgenre.subgenre ${sql_where} GROUP BY (id_receiver) ORDER BY COUNT(id_receiver) DESC`;
      }
   }

   console.log(sql);

   var p1 = queryWrapper("SELECT Genre.genre, Subgenre.subgenre FROM Genre JOIN Subgenre ON Genre.genre = Subgenre.cod_genre WHERE Genre.genre = '"+genre_url+"'");
   var p2 = queryWrapper(sql);
   Promise.all([ p1, p2])
     .then(([subgenres_result, artist_genre_result]) => {
           res.render('genre.ejs',{logged, userLogged, subgenres: subgenres_result, artist_genre: artist_genre_result, sql});
     })
     .catch(err => {
         res.redirect('/home');
     })
 };


/*------------------------------------------------------------ GET SUBGENRE/  ------------------------------------------------------*/
exports.showSubgenre = function (req, res){
   var subgenre_url = req.params.type_subgenre;
   var logged = check_logged(req.session.userLoggedId);
   if(logged){ var userLogged = req.session.userLogged; }
   if(subgenre_url == null){ res.redirect("/home"); return; }
   var get = req.query;
   var sql = "";
   //var sql_select = "SELECT DISTINCT(UserArtist.user_id), artist_name, user_name, email, artist_type, artist_macro, country FROM UserArtist JOIN UserGenres ON UserArtist.user_id = UserGenres.user_id JOIN Subgenre ON UserGenres.cod_subgenre = Subgenre.subgenre WHERE subgenre = '"+subgenre_url+"'";
   var sql_select = "SELECT DISTINCT(UserArtist.user_id), artist_name, user_name, email, artist_type, artist_macro, country, created FROM UserArtist JOIN UserGenres ON UserArtist.user_id = UserGenres.user_id JOIN Subgenre ON UserGenres.cod_subgenre = Subgenre.subgenre";
   var sql_where = "WHERE subgenre = '"+subgenre_url+"' AND active='1' AND user_name!=''";

   if(!get.sortby){
      sql = `${sql_select} ${sql_where}`;
   }

   if(get.sortby){
      if(get.sortby=="newusers"){
         sql = `${sql_select} ${sql_where} ORDER BY created DESC`;
      }
      if(get.sortby=="artist_name"){
         sql = `${sql_select} ${sql_where} ORDER BY artist_name`;
      }
      if(get.sortby=="likes" || get.sortby=="auto"){
         sql = `SELECT UserArtist.user_id, UserArtist.artist_name, UserArtist.user_name, UserArtist.artist_macro, UserArtist.country, COUNT(id_receiver) as countlike FROM UserLikes JOIN UserArtist ON id_receiver = user_id JOIN UserGenres ON UserArtist.user_id = UserGenres.user_id JOIN Subgenre ON UserGenres.cod_subgenre = Subgenre.subgenre ${sql_where} GROUP BY (id_receiver) ORDER BY COUNT(id_receiver) DESC`;
      }
   }
   console.log('sql :>> ', sql);

   var p1 = queryWrapper(sql);
   Promise.all([ p1])
     .then(([artist_subgenre_result]) => {
           res.render('subgenre.ejs',{logged, userLogged, artist_subgenre: artist_subgenre_result, subgenre_url});
     })
     .catch(err => {
         res.redirect('/home');
     })
 };



 
/*------------------------------------------------------------ PROFILE BUTTON AJAX ------------------------------------------------------*/
exports.ajaxShowMoreResults = function(req,res){
   var numResultsToShow = 12;
   var logged = check_logged(req.session.userLoggedId);
   let inserted = false;
   var post = req.body;
   var sql = post.sql;
   var last_limit = post.last_limit;
   var sql = sql.substring(0, sql.length - 8);

   var status = "KO";
   var new_limit = parseInt(last_limit) + numResultsToShow;

   var new_sql = sql + " LIMIT "+last_limit+","+numResultsToShow+"";

   if(sql!="" || sql!=undefined){
      console.log("query ajax: " + new_sql);
      db.query(new_sql,function(err,result){
            if(err) {
            status = "KO"; console.log("Error.");
            } else {
            status = "OK"; console.log("OK."); 
            }  
            res.send(JSON.stringify({result}));          
      });

   }
   
 };


 

 
 

 /*------------------------------------------------------------ FYP ---------------------------------------------------------*/

 exports.allUsersFYPRadar = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   const axios = require('axios').default;
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var userLoggedMainCategory = userLogged.artist_type;
   var userLoggedCountry = userLogged.country;
   var userLoggedLevel = userLogged.user_level;
   var adsFullObjects = [];

   /*-------------------------------------- SETUP WEIGHT POINTS FOR RANKING USERS -------------------------------------------- */
   var weightRadarCategory = 5;           // punti se è del radar category
   var weightSingleCommonGenre = 4;       // punti per ogni genere in comune
   var weightSameCountry = 3;             // punti se l'utente è dello stesso paese
   var weightSameLevel = 1;               // punti se l'utente è dello stesso livello
 
   /*---------------------------------------------------------------------------------------------------------------------- */

   var sql = "SELECT category_id FROM UserRadar WHERE user_id='"+userLoggedId+"' AND status='A'";
   db.query(sql, function(err, userLoggedRadarsCategories){

         var stringRadarsCategories = "";
         Object.keys(userLoggedRadarsCategories).forEach(key => { stringRadarsCategories+="'"+userLoggedRadarsCategories[key].category_id+"',"; });
         stringRadarsCategories = stringRadarsCategories.substring(0, stringRadarsCategories.length - 1);
         console.log("string: " + stringRadarsCategories);
         if(userLoggedRadarsCategories==undefined || userLoggedRadarsCategories.length==0){ stringRadarsCategories = "''" }

         console.log("SELECT user_id, artist_name, artist_macro, artist_type, country, user_level, user_name FROM UserArtist WHERE UserArtist.user_id!='"+userLoggedId+"' AND UserArtist.user_id IN (SELECT UserRadar.user_id FROM UserRadar WHERE UserRadar.category_id='"+userLoggedMainCategory+"' AND UserRadar.user_id IN (SELECT user_id FROM UserArtist WHERE UserArtist.active !=0 AND artist_type IN ("+stringRadarsCategories+")))");
         var p1 = queryWrapper("SELECT user_id, artist_name, artist_type, artist_macro, country, user_level, user_name FROM UserArtist WHERE UserArtist.user_id!='"+userLoggedId+"' AND UserArtist.user_id IN (SELECT UserRadar.user_id FROM UserRadar WHERE UserRadar.category_id='"+userLoggedMainCategory+"' AND UserRadar.user_id IN (SELECT user_id FROM UserArtist WHERE UserArtist.active !=0 AND artist_type IN ("+stringRadarsCategories+")))");
         var p2 = queryWrapper("SELECT cod_subgenre FROM UserGenres WHERE user_id='"+userLoggedId+"'");
         var p3 = queryWrapper("SELECT category_id FROM UserCategory WHERE user_id='"+userLoggedId+"'");
         var p4 = queryWrapper("SELECT category_id FROM UserRadar WHERE user_id='"+userLoggedId+"'");
         var p5 = queryWrapper("SELECT * FROM Ads ORDER BY position");
         
         Promise.all([ p1, p2, p3, p4, p5 ])
          .then(([users_result, userLoggedGenres, userLoggedCategories, userLoggedRadarsCategoriesOld, ads]) => {
               console.log("-------------------------------------------DONE PROMISES P1 P2 P3 P4");

               var i = 0;
               
               //creo stringa con valori generi dell'utente loggato, da usare nelle subquery
               var stringGenres = "";
               Object.keys(userLoggedGenres).forEach(key => { stringGenres+="'"+userLoggedGenres[key].cod_subgenre+"',"; });
               stringGenres = stringGenres.substring(0, stringGenres.length - 1);  console.log(stringGenres);

               //creo stringa con valori categorie dell'utente loggato, da usare nelle subquery
               var stringCategories = "";
               Object.keys(userLoggedCategories).forEach(key => { stringCategories+="'"+userLoggedCategories[key].category_id+"',"; });
               stringCategories = stringCategories.substring(0, stringCategories.length - 1); console.log(stringCategories);

               var response = [];
               
               Promise.all(users_result.map(function(user) {
                 
                     console.log("START PROMISE ON USER RESULT");
                     user.points = 0; var pointsUserExamined = 0; var numCommonGenres = 0;
                     
                     var promise = new Promise(function(resolve,reject) {

                        var sql = "SELECT * FROM UserLikes WHERE id_receiver='"+user.user_id+"' AND id_sender='"+userLoggedId+"' LIMIT 1";
                        db.query(sql,function(err, rowsLike) {  if(rowsLike.length>0){user.liked = true;} else{user.liked = false;}  });
                        
                        var sql = "SELECT * FROM UserFollows WHERE id_receiver='"+user.user_id+"' AND id_sender='"+userLoggedId+"' LIMIT 1";
                        db.query(sql,function(err, rowsFollow) {  if(rowsFollow.length>0){user.followed = true;} else{user.followed = false;}  });

                        var sql = "SELECT * FROM SignalCollaboration WHERE id_receiver='"+user.user_id+"' AND id_sender='"+userLoggedId+"' AND radar_id is null LIMIT 1";
                        db.query(sql,function(err, rowsCollaboration) {  if(rowsCollaboration.length>0){user.sentSignalCollab = true;} else{user.sentSignalCollab = false;}  });

                        var sql = "SELECT * FROM UserRadar WHERE user_id='"+user.user_id+"' AND status='A'"; //get radars of user and add them in respective object
                        db.query(sql,function(err, examinedUserRadars) {  user.radars = examinedUserRadars; });

                        var sql = "SELECT * FROM UserLinks WHERE user_id='"+user.user_id+"'"; //get links of user and add them in respective object
                        db.query(sql,function(err, examinedUserLinks) {  user.links = examinedUserLinks; });

                        var sql = "SELECT country, user_level, artist_type, artist_macro FROM UserArtist WHERE user_id='"+user.user_id+"' LIMIT 1";
                        db.query(sql,function(err, result) {

                              if (stringRadarsCategories.includes(result[0].artist_type)) {
                                 pointsUserExamined += weightRadarCategory; user.isRadarCategory = true;
                              }

                              if(result[0].country == userLoggedCountry){           
                                 pointsUserExamined += weightSameCountry; user.isSameCountry = true;
                              }
                              if(result[0].user_level == userLoggedLevel){
                                 pointsUserExamined += weightSameLevel; user.isSameLevel = true;
                              }

                              user.points = pointsUserExamined; // aggiungo all'oggetto degli utenti la chiave che conterrà i punteggi

                        });
                       
                        
                        var sql = "SELECT cod_subgenre FROM UserGenres WHERE user_id='"+user.user_id+"' LIMIT 5"; console.log(sql);
                        db.query(sql,function(err, examinedUserGenres) {
                                 // per ogni genere che quell'utente fa controllo se quel genere è tra i generi che ha l'utente loggato
                                 Object.keys(examinedUserGenres).forEach(key => {
                                    console.log(user.user_id + " - " + examinedUserGenres[key].cod_subgenre);
                                    if(stringGenres.includes(examinedUserGenres[key].cod_subgenre)){           
                                       numCommonGenres++;   // se un genere dell'utente in esame è presente fra i generi che ha l'utente loggato aumento contatore  
                                    }
                                 });

                                 if(numCommonGenres>0){ // se c'erano generi in comune aggiorno l'oggetto utenti con il nuovo punteggio
                                    pointsUserExamined += numCommonGenres * weightSingleCommonGenre;
                                    user.points = pointsUserExamined; 
                                 }

                                 user.genres = examinedUserGenres;
                                 user.numCommonGenres = numCommonGenres; //salvo nell'oggetto anche il numero di generi in comune
                                 
                                 console.log("Comparing with " + user.user_id + ": " + numCommonGenres + " genre in common");
                                 resolve(pointsUserExamined);
                        });

                        
                  });
               
               return promise.then(function(result) {
                  console.log(user);
                   /* console.log(result); //ok response.push(result); //ok*/
               });
               
         })).then(function () {
            
                  users_result.sort((a, b) => b.points - a.points); // riordino l'oggetto di utenti da passare alla pagina, ordinando per punteggio dal più alto

                  ads.forEach(function(ad) { 
                  
                        ad_youtube_video_id = ad.youtube_video_id;
                        axios.get('https://www.googleapis.com/youtube/v3/videos?part=snippet&id='+ad_youtube_video_id+'&key=AIzaSyDYvnFxcVCa-NIsCZNKDOI92t2CwqWL7F8').then(function (response) {
         
                           var apiResponse = JSON.parse(JSON.stringify(response.data));
            
                           var objectAd = {
                              videoid: ad.youtube_video_id,
                              title: apiResponse.items[0].snippet.title,
                              channel: apiResponse.items[0].snippet.channelTitle,
                              text: ad.ad_text
                           };
                        
                           adsFullObjects.push(objectAd); console.log(adsFullObjects[i]); 
            
                           if(i==ads.length-1){ //end of foreach of ads
                              res.render('fyp.ejs',{logged, userLogged, users_result: users_result, adsFullObjects, source: "match"});
                           }
                           i++;
                        }).catch(function (error) { console.log("error axios: " + error);  });
         
                  });

               });

          })
          .catch(err => {
              res.redirect('/home');
          }) 
   });

};



/*------------------------------------------------------------ FYP ---------------------------------------------------------*/

 exports.allUsersFYP = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   if(!logged){ res.redirect("/login");  return; }
   const axios = require('axios').default;
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var userLoggedCountry = userLogged.country;
   var userLoggedLevel = userLogged.user_level;
   var adsFullObjects = [];

   /*-------------------------------------- SETUP WEIGHT POINTS FOR RANKING USERS -------------------------------------------- */
   var weightRadarCategory = 5;           // punti se è del radar category
   var weightSingleCommonGenre = 4;       // punti per ogni genere in comune
   var weightSameCountry = 3;             // punti se l'utente è dello stesso paese
   var weightSameLevel = 1;               // punti se l'utente è dello stesso livello
 
   /*---------------------------------------------------------------------------------------------------------------------- */

   var sql = "SELECT category_id FROM UserRadar WHERE user_id='"+userLoggedId+"' AND status='A'";
   db.query(sql, function(err, userLoggedRadarsCategories){

         var stringRadarsCategories = "";
         Object.keys(userLoggedRadarsCategories).forEach(key => { stringRadarsCategories+="'"+userLoggedRadarsCategories[key].category_id+"',"; });
         stringRadarsCategories = stringRadarsCategories.substring(0, stringRadarsCategories.length - 1);
         console.log("string: " + stringRadarsCategories);
         if(userLoggedRadarsCategories==undefined || userLoggedRadarsCategories.length==0){ stringRadarsCategories = "''" }

         var p1 = queryWrapper("SELECT DISTINCT(user_id), artist_name, user_name, country, artist_macro, artist_type, user_level FROM UserArtist WHERE UserArtist.user_id!='"+userLoggedId+"' AND user_id NOT IN (SELECT id_receiver FROM UserLikes WHERE id_sender='"+userLoggedId+"') AND user_id IN (SELECT user_id FROM UserArtist WHERE country='"+userLoggedCountry+"' OR artist_type IN ("+stringRadarsCategories+")) LIMIT 45");
         var p2 = queryWrapper("SELECT cod_subgenre FROM UserGenres WHERE user_id='"+userLoggedId+"'");
         var p3 = queryWrapper("SELECT category_id FROM UserCategory WHERE user_id='"+userLoggedId+"'");
         var p4 = queryWrapper("SELECT category_id FROM UserRadar WHERE user_id='"+userLoggedId+"'");
         var p5 = queryWrapper("SELECT * FROM Ads ORDER BY position");
           
         Promise.all([ p1, p2, p3, p4, p5 ])
          .then(([users_result, userLoggedGenres, userLoggedCategories, userLoggedRadarsCategoriesOld, ads]) => {
               console.log("-------------------------------------------DONE PROMISES P1 P2 P3 P4");

               var i = 0;
               
               //creo stringa con valori generi dell'utente loggato, da usare nelle subquery
               var stringGenres = "";
               Object.keys(userLoggedGenres).forEach(key => { stringGenres+="'"+userLoggedGenres[key].cod_subgenre+"',"; });
               stringGenres = stringGenres.substring(0, stringGenres.length - 1); console.log(stringGenres);
               
               //creo stringa con valori categorie dell'utente loggato, da usare nelle subquery
               var stringCategories = "";
               Object.keys(userLoggedCategories).forEach(key => { stringCategories+="'"+userLoggedCategories[key].category_id+"',"; });
               stringCategories = stringCategories.substring(0, stringCategories.length - 1); console.log(stringCategories);
               
               var response = [];
               
               Promise.all(users_result.map(function(user) {

                     console.log("START PROMISE ON USER RESULT");
                     user.points = 0; var pointsUserExamined = 0; var numCommonGenres = 0;
                     
                     var promise = new Promise(function(resolve,reject) {

                        var sql = "SELECT * FROM UserLikes WHERE id_receiver='"+user.user_id+"' AND id_sender='"+userLoggedId+"' LIMIT 1";
                        db.query(sql,function(err, rowsLike) {  if(rowsLike.length>0){user.liked = true;} else{user.liked = false;}  });
                        
                        var sql = "SELECT * FROM UserFollows WHERE id_receiver='"+user.user_id+"' AND id_sender='"+userLoggedId+"' LIMIT 1";
                        db.query(sql,function(err, rowsFollow) {  if(rowsFollow.length>0){user.followed = true;} else{user.followed = false;}  });

                        var sql = "SELECT * FROM SignalCollaboration WHERE id_receiver='"+user.user_id+"' AND id_sender='"+userLoggedId+"' AND radar_id is null LIMIT 1";
                        db.query(sql,function(err, rowsCollaboration) {  if(rowsCollaboration.length>0){user.sentSignalCollab = true;} else{user.sentSignalCollab = false;}  });

                        var sql = "SELECT * FROM UserRadar WHERE user_id='"+user.user_id+"' AND status='A'"; //get radars of user and add them in respective object
                        db.query(sql,function(err, examinedUserRadars) {  user.radars = examinedUserRadars; });

                        var sql = "SELECT * FROM UserLinks WHERE user_id='"+user.user_id+"'"; //get links of user and add them in respective object
                        db.query(sql, function(err, examinedUserLinks) { user.links = examinedUserLinks; });

                        var sql = "SELECT country, user_level, artist_type, artist_macro FROM UserArtist WHERE user_id='"+user.user_id+"' LIMIT 1";
                        db.query(sql, function(err, result) {

                              if (stringRadarsCategories.includes(result[0].artist_type)) {
                                 pointsUserExamined += weightRadarCategory; user.isRadarCategory = true;
                              }

                              if(result[0].country == userLoggedCountry){           
                                 pointsUserExamined += weightSameCountry; user.isSameCountry = true;
                              }
                              if(result[0].user_level == userLoggedLevel){
                                 pointsUserExamined += weightSameLevel; user.isSameLevel = true;
                              }

                              user.points = pointsUserExamined; // aggiungo all'oggetto degli utenti la chiave che conterrà i punteggi

                        });
                       
                        
                        var sql = "SELECT cod_subgenre FROM UserGenres WHERE user_id='"+user.user_id+"' LIMIT 5"; console.log(sql);
                        db.query(sql,function(err, examinedUserGenres) {
                                 // per ogni genere che quell'utente fa controllo se quel genere è tra i generi che ha l'utente loggato
                                 Object.keys(examinedUserGenres).forEach(key => {
                                    console.log(user.user_id + " - " + examinedUserGenres[key].cod_subgenre);
                                    if(stringGenres.includes(examinedUserGenres[key].cod_subgenre)){           
                                       numCommonGenres++;  // se un genere dell'utente in esame è presente fra i generi che ha l'utente loggato aumento contatore   
                                    }
                                 });

                                 if(numCommonGenres>0){ 
                                    pointsUserExamined += numCommonGenres * weightSingleCommonGenre;  
                                    user.points = pointsUserExamined;  // se c'erano generi in comune aggiorno l'oggetto utenti con il nuovo punteggio
                                 }

                                 user.genres = examinedUserGenres;
                                 user.numCommonGenres = numCommonGenres; //salvo nell'oggetto anche il numero di generi in comune
                                 
                                 console.log("Comparing with " + user.user_id + ": " + numCommonGenres + " genre in common");
                                 resolve(pointsUserExamined);
                        });

                        
                  });
               
               return promise.then(function(result) {
                  console.log(user);
                   /* console.log(result); //ok  response.push(result); //ok */
               });
               
         })).then(function () {
            
                     users_result.sort((a, b) => b.points - a.points); // riordino l'oggetto di utenti da passare alla pagina, ordinando per punteggio dal più alto

                     res.render('fyp.ejs',{logged, userLogged, users_result: users_result, adsFullObjects, source: "discover"});

               });

          })
          .catch(err => {
              res.redirect('/home');
          }) 
   });

};







exports.activityLogs = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var p1 = queryWrapper("SELECT * FROM TrackingSession ORDER BY time_login DESC;");
   var p2 = queryWrapper("SELECT * FROM TrackingProfileView ORDER BY time DESC;");
   var p3 = queryWrapper("SELECT * FROM TrackingUserClickLink ORDER BY time DESC;");
   var p4 = queryWrapper("SELECT * FROM TrackingVisitorClickLink ORDER BY time DESC;");
 
   Promise.all([p1, p2, p3, p4])
   .then(([logsSession, logsProfileView, logsUserClickLink, logsVisitorClickLink]) => {
      if(logsSession==undefined){ logsSession = []}
      if(logsProfileView==undefined){ logsProfileView = [] }
      if(logsUserClickLink==undefined){ logsUserClickLink = [] }
      if(logsVisitorClickLink==undefined){ logsVisitorClickLink = []; }
      res.render('logs.ejs', {logged, userLogged, logsSession, logsProfileView, logsUserClickLink, logsVisitorClickLink});
   })
   .catch(err => {
      res.redirect('/home');
   })
};


exports.listUsers = function(req, res){
   var logged = check_logged(req.session.userLoggedId);
   var userLogged = req.session.userLogged;
   var userLoggedId = req.session.userLoggedId;
   var p1 = queryWrapper("SELECT user_name, email, active FROM UserArtist WHERE opt_newsletter='Y' OR opt_newsletter='N' ORDER BY created DESC;");
   var p2 = queryWrapper("SELECT email, status FROM NewsletterSubscriber ORDER BY date_opt_in DESC;");
   Promise.all([p1, p2])
   .then(([listUsers, listSubscribersNewsletter]) => {
      if(listUsers==undefined){ listUsers = []; }
      if(listSubscribersNewsletter==undefined){ listSubscribersNewsletter = []}
      
      res.render('hevolytics.ejs', {logged, userLogged, listUsers, listSubscribersNewsletter});
   })
   .catch(err => {
      res.redirect('/home');
   })
};