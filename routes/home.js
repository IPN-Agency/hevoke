function check_logged(ele){ return ele != undefined; }

const queryWrapper = (statement) => {
  return new Promise((resolve, reject) => {
      db.query(statement, (err, result) => {
          if(err){return reject(err);}
          resolve(result);
      });
  });
};

class Database {
  constructor( db ) {
      this.connection = db;
  }
  queryPro( sql, args ) {
      return new Promise( ( resolve, reject ) => {
          this.connection.query( sql, args, ( err, rows ) => {
              if ( err )
                  return reject( err );
              resolve( rows );
          } );
      });
  }
  close() {
      return new Promise( ( resolve, reject ) => {
          this.connection.close( err => {
              if ( err )
                  return reject( err );
              console.log("DB Connection Closed."); resolve();
          } );
      });
  }
}



//---------------------------------------------------------------------------------GET /HOME OR /----------------------------------

exports.home = function(req, res, next){
  var message = '';
  var logged = check_logged(req.session.userLoggedId);
  var userLogged = req.session.userLogged;
  var userLoggedId = req.session.userLoggedId;
  var conditionUserLoggedMacro = "";

  /*------------USER LOGGED------------*/
  var p1 = logged==true ? queryWrapper("SELECT * FROM UserArtist WHERE UserArtist.active != 0 AND user_id='"+userLoggedId+"' LIMIT 1") : Promise.resolve();
  /*------------USERS WITH MORE LIKES------------*/
  var p2 = queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0  GROUP BY (id_receiver) ORDER BY COUNT(id_receiver) DESC LIMIT 10");
  /*------------USERS CREATED TODAY------------*/
  var p3 = queryWrapper("SELECT * FROM UserArtist WHERE active != 0 AND created=CURDATE() LIMIT 10;");
  /*------------USERS ACTIVE TODAY------------*/
  var p4 = queryWrapper("SELECT * FROM UserArtist WHERE active != 0 AND last_login=CURDATE() LIMIT 10");

  var p5 = queryWrapper("SELECT * FROM Genre");

  /*------------USERS FOR RADAR------------*/
  var p6 = logged==true ? queryWrapper("SELECT category_id FROM UserRadar WHERE user_id='"+userLoggedId+"' AND status = 'A'") : Promise.resolve();

  /*------------USERS MUSIC ------------*/
  var p7 = queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'M' AND active != 0 LIMIT 10");

   /*------------USERS VIDEO ------------*/
  var p8 = queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'V' AND active != 0 LIMIT 10");

  /*------------USERS DANCE ------------*/
  var p9 = queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'D' AND active != 0 LIMIT 10");

  Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9])
  .then(([res_user_logged, res_users_morelikes, res_users_newuser, res_users_active, res_genres, res_userloggedradarscategories, res_users_music, res_users_video, res_users_dance]) => {

      var idsAllUsersHome = [];

      console.log(res_user_logged);

      res_users_morelikes.forEach(function(user){ idsAllUsersHome.push(user.user_id); });
      res_users_active.forEach(function(user){ idsAllUsersHome.push(user.user_id); });
      res_users_newuser.forEach(function(user){ idsAllUsersHome.push(user.user_id); });

      if(logged){
            var flagMacro = false;
            var userLoggedMacro = res_user_logged[0].artist_macro;
            var userLoggedCountry = res_user_logged[0].country;
            var userLoggedUserLevel = res_user_logged[0].user_level;

            var stringRadarsCategories = "";
            Object.keys(res_userloggedradarscategories).forEach(key => { stringRadarsCategories+="'"+res_userloggedradarscategories[key].category_id+"',"; });
            stringRadarsCategories = stringRadarsCategories.substring(0, stringRadarsCategories.length - 1);
    
            if(res_userloggedradarscategories==undefined || res_userloggedradarscategories.length==0){ stringRadarsCategories = "''" }

            if(userLoggedMacro == "M" || userLoggedMacro == "V" || userLoggedMacro == "D"){ conditionUserLoggedMacro = "AND artist_macro='"+userLoggedMacro+"'";  }

            /*------------USERS WITH A CATEGORY IN COMMON------------*/
            var p10 = logged==true ? queryWrapper("SELECT DISTINCT(UserCategory.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.artist_type From UserCategory JOIN UserArtist on UserCategory.user_id = UserArtist.user_id WHERE UserArtist.active != 0 AND UserCategory.category_id IN (SELECT UserCategory.category_id FROM UserCategory where UserCategory.user_id = '"+userLoggedId+"') AND UserCategory.user_id != '"+userLoggedId+"' GROUP BY UserCategory.user_id LIMIT 10"): Promise.resolve();
            /*------------USERS WITH A GENRE IN COMMON------------*/
            var p11 = logged==true ? queryWrapper("SELECT DISTINCT(UserGenres.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.artist_type FROM Subgenre JOIN UserGenres on Subgenre.subgenre = UserGenres.cod_subgenre JOIN UserArtist ON UserGenres.user_id=UserArtist.user_id WHERE UserArtist.active != 0 AND Subgenre.cod_genre IN (SELECT Subgenre.cod_genre FROM Subgenre JOIN UserGenres ON Subgenre.subgenre = UserGenres.cod_subgenre WHERE UserGenres.user_id='"+userLoggedId+"') AND UserGenres.user_id!='"+userLoggedId+"' GROUP BY UserGenres.user_id LIMIT 10") : Promise.resolve();
            /*------------ USERS SAME COUNTRY ------------*/
            var p12 = queryWrapper("SELECT user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE UserArtist.active !=0 "+conditionUserLoggedMacro+" AND country = '"+userLoggedCountry+"' AND user_id <>'"+userLoggedId+"' LIMIT 10");
            /*------------ USERS SAME LEVEL ------------*/
            var p13 = queryWrapper("SELECT user_id, artist_name, artist_type, country, user_level, user_name FROM UserArtist WHERE UserArtist.active !=0 "+conditionUserLoggedMacro+" AND user_level = '"+userLoggedUserLevel+"' AND user_id <>'"+userLoggedId+"' LIMIT 10");
            /*------------ USERS FOR RADARS ------------*/
            var p14 = queryWrapper("SELECT user_id, artist_name, artist_type, country, user_level, user_name FROM UserArtist WHERE UserArtist.active !=0 AND artist_type IN ("+stringRadarsCategories+") LIMIT 10");

            if(userLoggedMacro != "M" || userLoggedMacro != "V" || userLoggedMacro != "D"){
              var p15 = Promise.resolve();
              var p16 = Promise.resolve();
            }
            if(userLoggedMacro == "M"){
              flagMacro = true;
              //simple video artist
              var p15 = queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'V' AND active != 0 LIMIT 10");
              //dance artists with genre in common
              var p16 = queryWrapper("SELECT DISTINCT(UserGenres.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.city, UserArtist.artist_type FROM Subgenre JOIN UserGenres on Subgenre.subgenre = UserGenres.cod_subgenre JOIN UserArtist ON UserGenres.user_id=UserArtist.user_id WHERE UserArtist.active != 0 AND Subgenre.cod_genre IN (SELECT Subgenre.cod_genre FROM Subgenre JOIN UserGenres ON Subgenre.subgenre = UserGenres.cod_subgenre WHERE UserGenres.user_id='"+userLoggedId+"') AND UserGenres.user_id!='"+userLoggedId+"' AND artist_macro= 'D' GROUP BY UserGenres.user_id LIMIT 10");
            }
            if(userLoggedMacro == "V"){
              flagMacro = true;
              //simple dance
              var p15 = queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'D' AND active != 0 LIMIT 10");
              //simple music
              var p16 = queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'M' AND active != 0 LIMIT 10");
            }
            if(userLoggedMacro == "D"){
              flagMacro = true;
              //singers or producers with genre danceable
              var p15 = queryWrapper("SELECT DISTINCT(UserArtist.user_id), artist_name, artist_type, country, user_name FROM UserArtist JOIN UserCategory ON UserArtist.user_id = UserCategory.user_id JOIN UserGenres ON UserArtist.user_id = UserGenres.user_id WHERE category_id IN ('Rapper', 'Trapper', 'Singer', 'Producer') AND UserGenres.cod_subgenre IN ('pop', 'hip hop', 'rap', 'trap', 'brazilian', 'reggae', 'pop dance', 'pop rap', 'k-pop') AND UserArtist.active != 0 LIMIT 10")
              //simple video artists
              var p16 = queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'V' AND active != 0 LIMIT 10");
            }
            

            Promise.all([p10, p11, p12, p13, p14, p15, p16])
            .then(([res_users_samecategory, res_users_samegenre, res_users_samecountry, res_users_samelevel, res_users_matchradars, res_users_macro_sec_1, res_users_macro_sec_2])=>{
                  
                  res_users_samecategory.forEach(function(user){ idsAllUsersHome.push(user.user_id); });
                  res_users_samegenre.forEach(function(user){ idsAllUsersHome.push(user.user_id); });
                  res_users_samecountry.forEach(function(user){ idsAllUsersHome.push(user.user_id); });
                  res_users_samelevel.forEach(function(user){ idsAllUsersHome.push(user.user_id); });
                  res_users_matchradars.forEach(function(user){ idsAllUsersHome.push(user.user_id); });
                  if(flagMacro){
                    res_users_macro_sec_1.forEach(function(user){ idsAllUsersHome.push(user.user_id); });
                    res_users_macro_sec_2.forEach(function(user){ idsAllUsersHome.push(user.user_id); });
                  }
                  
                  var stringIdsAllUsersHome = "'" + idsAllUsersHome.join("','") + "'";
                  Promise.all([queryWrapper("SELECT * FROM UserLinks WHERE user_id IN ("+stringIdsAllUsersHome+")")]).then(([res_links]) => {
                        res.render('home', {menuActiveHome:true, message, logged, userLogged, res_users_active, res_users_newuser, res_users_morelikes, res_users_samecountry, res_users_samelevel, userLoggedComplete: res_user_logged[0], res_genres, res_links, res_users_samegenre, res_users_samecategory, res_users_matchradars, res_users_macro_sec_1, res_users_macro_sec_2, res_users_music, res_users_video, res_users_dance});
                  }); 
          })
          .catch(err => { res.redirect("/login"); });
      }
      else{
          var stringIdsAllUsersHome = "'" + idsAllUsersHome.join("','") + "'";
          Promise.all([queryWrapper("SELECT * FROM UserLinks WHERE user_id IN ("+stringIdsAllUsersHome+")")]).then(([res_links]) => {
                res.render('home',{menuActiveHome:true, message, logged, res_users_active, res_users_morelikes, res_genres, res_links, res_users_newuser, res_users_music, res_users_video, res_users_dance});
          });
      }
  })
  .catch(err => { res.redirect("/login"); })
};



exports.showAllProfiles = (req,res) =>{
  var message = '';
  var section_url = req.params.type_section;
  var get = req.query;

  var logged = check_logged(req.session.userLoggedId);
  var userLogged = req.session.userLogged;
  var conditionUserLoggedMacro = "";
  
  var p1 = queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 GROUP BY (id_receiver) ORDER BY COUNT(id_receiver) DESC");
  var p2 = queryWrapper("SELECT * FROM Genre");
  var p3 = queryWrapper("SELECT * FROM UserLinks");
  var p4 = queryWrapper("SELECT * FROM UserArtist WHERE UserArtist.active != 0 AND last_login=CURDATE()");
  var p10 = queryWrapper("SELECT * FROM UserArtist WHERE active != 0 AND created=CURDATE();");
  var p5 = logged==true ? queryWrapper("SELECT * FROM UserArtist WHERE UserArtist.active != 0 AND user_id='"+req.session.userLoggedId+"'") : Promise.resolve();
  var p6 = logged==true ? queryWrapper("SELECT DISTINCT(UserGenres.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.city, UserArtist.artist_type  FROM Subgenre JOIN UserGenres on Subgenre.subgenre = UserGenres.cod_subgenre JOIN UserArtist ON UserGenres.user_id=UserArtist.user_id WHERE UserArtist.active != 0 AND Subgenre.cod_genre IN (SELECT Subgenre.cod_genre FROM Subgenre JOIN UserGenres ON Subgenre.subgenre = UserGenres.cod_subgenre WHERE UserGenres.user_id='"+req.session.userLoggedId+"') AND UserGenres.user_id!='"+req.session.userLoggedId+"' GROUP BY UserGenres.user_id ") : Promise.resolve();
  var p7 = logged == true ? queryWrapper("SELECT DISTINCT(UserCategory.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.city, UserArtist.artist_type From UserCategory JOIN UserArtist on UserCategory.user_id = UserArtist.user_id WHERE UserCategory.category_id IN (SELECT UserCategory.category_id FROM UserCategory where UserArtist.active != 0 AND UserCategory.user_id = '"+req.session.userLoggedId+"') AND UserCategory.user_id != '"+req.session.userLoggedId+"' GROUP BY UserCategory.user_id"): Promise.resolve();
  var p11 = logged==true ? queryWrapper("SELECT category_id FROM UserRadar WHERE user_id='"+req.session.userLoggedId+"' AND status = 'A'") : Promise.resolve();

  /*-----------------MORE LIKES-----------------*/
  if(section_url == "mostliked"){
    if(get.sortby){
      console.log(get.sortby);
      if(get.sortby=="newusers"){
        p1=queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 GROUP BY (id_receiver) ORDER BY created DESC");
      }
      if(get.sortby=="artist_name"){
        p1=queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 GROUP BY (id_receiver) ORDER BY artist_name");
        
      }
      if(get.sortby=="likes" ){
        p1 = queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 GROUP BY (id_receiver) ORDER BY COUNT(id_receiver) DESC");
      }
      
    }
  }
/*----------------ACTIVE TODAY-----------------*/
  if(section_url == "activetoday"){
    if(get.sortby){
      console.log(get.sortby);
      if(get.sortby=="newusers"){
        p4=queryWrapper("SELECT * FROM UserArtist WHERE UserArtist.active != 0 AND last_login=CURDATE() ORDER BY created DESC");   
      }
      if(get.sortby=="artist_name"){
        p4=queryWrapper("SELECT * FROM UserArtist WHERE UserArtist.active != 0 AND last_login=CURDATE() ORDER BY artist_name");     
      }
      
      if(get.sortby=="likes" || get.sortby=="auto"){
        p4 = queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE last_login=CURDATE()) GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;");
      }
      
    }
  }

  /*----------------NEW USERS-----------------*/
  if(section_url == "newusertoday"){
    if(get.sortby){
      console.log(get.sortby);
      if(get.sortby=="newusers"){
        p10=queryWrapper("SELECT * FROM UserArtist WHERE active != 0 AND created=CURDATE() ORDER BY created DESC");   
      }
      if(get.sortby=="artist_name"){
        p10=queryWrapper("SELECT * FROM UserArtist WHERE active != 0 AND created=CURDATE() ORDER BY artist_name");     
      }
      
      if(get.sortby=="likes" || get.sortby=="auto"){
        p10 = queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE created=CURDATE()) GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;");
      }
      
    }
  }

  /*-----------------COMMON GENRE-----------------*/
  if(section_url == "withcommongenre"){
    if(!logged || section_url == null){ res.redirect("/login"); return; }
    if(get.sortby){
      console.log(get.sortby);
      if(get.sortby=="newusers"){
        p6=queryWrapper("SELECT DISTINCT(UserGenres.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.city, UserArtist.artist_type  FROM Subgenre JOIN UserGenres on Subgenre.subgenre = UserGenres.cod_subgenre JOIN UserArtist ON UserGenres.user_id=UserArtist.user_id WHERE UserArtist.active != 0 AND Subgenre.cod_genre IN (SELECT Subgenre.cod_genre FROM Subgenre JOIN UserGenres ON Subgenre.subgenre = UserGenres.cod_subgenre WHERE UserGenres.user_id='"+req.session.userLoggedId+"') AND UserGenres.user_id!='"+req.session.userLoggedId+"' GROUP BY UserGenres.user_id  ORDER BY created DESC");   
      }
      if(get.sortby=="artist_name"){
        p6=queryWrapper("SELECT DISTINCT(UserGenres.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.city, UserArtist.artist_type  FROM Subgenre JOIN UserGenres on Subgenre.subgenre = UserGenres.cod_subgenre JOIN UserArtist ON UserGenres.user_id=UserArtist.user_id WHERE UserArtist.active != 0 AND Subgenre.cod_genre IN (SELECT Subgenre.cod_genre FROM Subgenre JOIN UserGenres ON Subgenre.subgenre = UserGenres.cod_subgenre WHERE UserGenres.user_id='"+req.session.userLoggedId+"') AND UserGenres.user_id!='"+req.session.userLoggedId+"' GROUP BY UserGenres.user_id  ORDER BY artist_name");     
      }
      
      if(get.sortby=="likes" || get.sortby=="auto"){
        p6 = queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer join UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT DISTINCT(UserGenres.user_id) FROM Subgenre JOIN UserGenres on Subgenre.subgenre = UserGenres.cod_subgenre JOIN UserArtist ON UserGenres.user_id=UserArtist.user_id WHERE Subgenre.cod_genre IN (SELECT Subgenre.cod_genre FROM Subgenre JOIN UserGenres ON Subgenre.subgenre = UserGenres.cod_subgenre WHERE UserGenres.user_id='"+req.session.userLoggedId+"') AND UserGenres.user_id!='"+req.session.userLoggedId+"' GROUP BY UserGenres.user_id ) GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;");
      }      
    }
  }

   /*-----------------COMMON CATEGORY-----------------*/
   if(section_url == "withcommoncategory"){
    if(!logged || section_url == null){ res.redirect("/login"); return; }
    if(get.sortby){
      console.log(get.sortby);
      if(get.sortby=="newusers"){
        p7=queryWrapper("SELECT DISTINCT(UserCategory.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.city, UserArtist.artist_type From UserCategory JOIN UserArtist on UserCategory.user_id = UserArtist.user_id WHERE UserArtist.active != 0 AND UserCategory.category_id IN (SELECT UserCategory.category_id FROM UserCategory where UserCategory.user_id = '"+req.session.userLoggedId+"') AND UserCategory.user_id != '"+req.session.userLoggedId+"' GROUP BY UserCategory.user_id  ORDER BY created DESC");   
      }
      if(get.sortby=="artist_name"){
        p7=queryWrapper("SELECT DISTINCT(UserCategory.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.city, UserArtist.artist_type From UserCategory JOIN UserArtist on UserCategory.user_id = UserArtist.user_id WHERE UserArtist.active != 0 AND UserCategory.category_id IN (SELECT UserCategory.category_id FROM UserCategory where UserCategory.user_id = '"+req.session.userLoggedId+"') AND UserCategory.user_id != '"+req.session.userLoggedId+"' GROUP BY UserCategory.user_id  ORDER BY artist_name");     
      }
      
      if(get.sortby=="likes" || get.sortby=="auto"){
        p7 = queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer join UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT DISTINCT(UserCategory.user_id) From UserCategory JOIN UserArtist on UserCategory.user_id = UserArtist.user_id WHERE UserCategory.category_id IN (SELECT UserCategory.category_id FROM UserCategory where UserCategory.user_id = '"+req.session.userLoggedId+"') AND UserCategory.user_id != '"+req.session.userLoggedId+"' GROUP BY UserCategory.user_id ) GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;");
      }      
    }
  }

  Promise.all([p1, p2, p3, p4, p5, p6, p7, p10, p11])
  .then(([res_users_morelikes, res_genres, res_links, res_users_active, res_user_logged, res_users_samegenre, res_users_samecategory, res_users_newuser, res_userloggedradarscategories]) => {

    /**********************RADAR USER**************************/

    if(section_url == "usersforradars"){
      if(logged){
        var stringRadarsCategories = "";
        Object.keys(res_userloggedradarscategories).forEach(key => { stringRadarsCategories+="'"+res_userloggedradarscategories[key].category_id+"',"; });
        stringRadarsCategories = stringRadarsCategories.substring(0, stringRadarsCategories.length - 1);

        if(res_userloggedradarscategories==undefined || res_userloggedradarscategories.length==0){ stringRadarsCategories = "''" }
        var sql= "SELECT user_id, artist_name, artist_type, country, user_level, user_name FROM UserArtist WHERE UserArtist.active !=0 AND artist_type IN ("+stringRadarsCategories+")";
        if(get.sortby){
          if(get.sortby=="newusers"){
            sql="SELECT user_id, artist_name, artist_type, country, user_level, user_name FROM UserArtist WHERE UserArtist.active !=0 AND artist_type IN ("+stringRadarsCategories+") ORDER BY created DESC";
          }
          if(get.sortby=="artist_name"){
            sql="SELECT user_id, artist_name, artist_type, country, user_level, user_name FROM UserArtist WHERE UserArtist.active !=0 AND artist_type IN ("+stringRadarsCategories+") ORDER BY artist_name";
          }
          if(get.sortby=="likes" || get.sortby=="auto"){
            sql="SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE artist_type IN ("+stringRadarsCategories+")) GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC";
          }   
        }
        db.query(sql, function(err, res_usersradar){  
          res.render('all-profiles',{message,section_url, logged, userLogged,res_usersradar, userLoggedComplete: res_user_logged[0], res_genres, res_links});
        }); 
      }
      if(!logged || section_url == null){ res.redirect("/login"); return; }
    }

      /*-----------------MORE LIKES-----------------*/
      if(section_url == "mostliked"){
        res.render('all-profiles',{message,section_url, logged, userLogged, res_users_morelikes,  res_genres, res_links});
      }
      
      /*-----------------MACRO SECTION------------------*/
      if(logged){
        userLoggedArtistMacro = res_user_logged[0].artist_macro;
      }
      if(userLoggedArtistMacro == "D"){
        if(section_url== "musicartists"){
          if(logged){
            sql ="SELECT DISTINCT(UserArtist.user_id), artist_name, artist_type, country, city, gender, user_name FROM UserArtist JOIN UserCategory ON UserArtist.user_id = UserCategory.user_id JOIN UserGenres ON UserArtist.user_id = UserGenres.user_id WHERE category_id IN ('Rapper','Trapper','Singer', 'Producer') AND UserGenres.cod_subgenre IN ('pop', 'hip hop', 'rap', 'trap', 'brazilian', 'reggae', 'pop dance', 'pop rap', 'k-pop') AND UserArtist.active != 0";
          
            if(get.sortby=="newusers"){
              sql="SELECT DISTINCT(UserArtist.user_id), artist_name, artist_type, country, city, gender, user_name, created FROM UserArtist JOIN UserCategory ON UserArtist.user_id = UserCategory.user_id JOIN UserGenres ON UserArtist.user_id = UserGenres.user_id WHERE category_id IN ('Rapper','Trapper','Singer', 'Producer') AND UserGenres.cod_subgenre IN ('pop', 'hip hop', 'rap', 'trap', 'brazilian', 'reggae', 'pop dance', 'pop rap', 'k-pop') AND UserArtist.active != 0 ORDER BY created DESC";   
            }
            if(get.sortby=="artist_name"){
             sql="SELECT DISTINCT(UserArtist.user_id), artist_name, artist_type, country, city, gender, user_name FROM UserArtist JOIN UserCategory ON UserArtist.user_id = UserCategory.user_id JOIN UserGenres ON UserArtist.user_id = UserGenres.user_id WHERE category_id IN ('Rapper','Trapper','Singer', 'Producer') AND UserGenres.cod_subgenre IN ('pop', 'hip hop', 'rap', 'trap', 'brazilian', 'reggae', 'pop dance', 'pop rap', 'k-pop') AND UserArtist.active != 0 ORDER BY artist_name";     
            }
            if(get.sortby=="likes" || get.sortby=="auto"){
              sql = "SELECT DISTINCT(UserArtist.user_id), artist_name, artist_type, country, city, gender, user_name FROM UserArtist JOIN UserCategory ON UserArtist.user_id = UserCategory.user_id JOIN UserGenres ON UserArtist.user_id = UserGenres.user_id WHERE category_id IN ('Rapper','Trapper','Singer', 'Producer') AND UserGenres.cod_subgenre IN ('pop', 'hip hop', 'rap', 'trap', 'brazilian', 'reggae', 'pop dance', 'pop rap', 'k-pop')";   
            }
            db.query(sql, function(err, res_users_macro_sec_1){  
              res.render('all-profiles',{message,section_url, logged,userLoggedArtistMacro, userLogged,res_users_macro_sec_1, userLoggedComplete: res_user_logged[0], res_genres, res_links});
            }); 
          }
          if(!logged || section_url == null){ res.redirect("/login"); return; }

        }else if(section_url== "videoartists"){
          if(logged){
            sql ="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE artist_macro = 'V' AND active != 0";
            if(get.sortby=="newusers"){
              sql="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name,created FROM UserArtist WHERE artist_macro = 'V' AND active != 0 ORDER BY created DESC";   
            }
            if(get.sortby=="artist_name"){
            sql="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE artist_macro = 'V' AND active != 0 ORDER BY artist_name";     
            }
            if(get.sortby=="likes" || get.sortby=="auto"){
              sql = "SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE artist_macro = 'V') GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;";
            }   
            
            db.query(sql, function(err, res_users_macro_sec_2){  
              res.render('all-profiles',{message,section_url, logged,userLoggedArtistMacro, userLogged,res_users_macro_sec_2, userLoggedComplete: res_user_logged[0], res_genres, res_links});
            });
          }
          if(!logged || section_url == null){ res.redirect("/login"); return; }
        }
      }else if(userLoggedArtistMacro == "V"){
        if(section_url== "musicartists"){
          if(logged){
            sql ="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE artist_macro = 'D' AND active != 0";
            if(get.sortby=="newusers"){
                sql="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name, created FROM UserArtist WHERE artist_macro = 'D' AND active != 0 ORDER BY created DESC";
              }
            if(get.sortby=="artist_name"){
              sql="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE artist_macro = 'D' AND active != 0 ORDER BY artist_name DESC";
            }
            if(get.sortby=="likes" || get.sortby=="auto"){
              sql="SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE artist_macro = 'D') GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;";
            }    
            db.query(sql, function(err, res_users_macro_sec_1){  
              res.render('all-profiles',{message,section_url, logged,userLoggedArtistMacro, userLogged,res_users_macro_sec_1, userLoggedComplete: res_user_logged[0], res_genres, res_links});
            });
          }
          if(!logged || section_url == null){ res.redirect("/login"); return; }

        }else if(section_url== "danceartists"){
          if(logged){
            sql ="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE artist_macro = 'M' AND active != 0";
            if(get.sortby=="newusers"){
              sql="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name, created FROM UserArtist WHERE artist_macro = 'M' AND active != 0 ORDER BY created DESC";
            }
            if(get.sortby=="artist_name"){
              sql="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE artist_macro = 'M' AND active != 0 ORDER BY artist_name DESC";
            }
            if(get.sortby=="likes" || get.sortby=="auto"){
              sql="SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE artist_macro = 'M') GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;";
            }
            
            db.query(sql, function(err, res_users_macro_sec_2){  
              res.render('all-profiles',{message,section_url, logged,userLoggedArtistMacro, userLogged,res_users_macro_sec_2, userLoggedComplete: res_user_logged[0], res_genres, res_links});
            });
          }
          if(!logged || section_url == null){ res.redirect("/login"); return; }
        }
       
      }else if(userLoggedArtistMacro == "M"){
        if(section_url== "videoartists"){
          if(logged){
            sql ="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE artist_macro = 'V' AND active != 0";
            if(get.sortby=="newusers"){
              sql="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name, created FROM UserArtist WHERE artist_macro = 'V' AND active != 0 ORDER BY created DESC";
            }
            if(get.sortby=="artist_name"){
              sql="SELECT UserArtist.user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE artist_macro = 'V' AND active != 0 ORDER BY artist_name DESC";
            }
            if(get.sortby=="likes" || get.sortby=="auto"){
              sql="SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE artist_macro = 'V') GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;";
            } 
            if(!logged || section_url == null){ res.redirect("/login"); return; }
            db.query(sql, function(err, res_users_macro_sec_1){  
              res.render('all-profiles',{message,section_url, logged,userLoggedArtistMacro, userLogged,res_users_macro_sec_1, userLoggedComplete: res_user_logged[0], res_genres, res_links});
            });
          }
          if(!logged || section_url == null){ res.redirect("/login"); return; }
          
        }else if(section_url== "danceartists"){
          if(logged){
            sql ="SELECT DISTINCT(UserGenres.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.city, UserArtist.artist_type FROM Subgenre JOIN UserGenres on Subgenre.subgenre = UserGenres.cod_subgenre JOIN UserArtist ON UserGenres.user_id=UserArtist.user_id WHERE UserArtist.active != 0 AND Subgenre.cod_genre IN (SELECT Subgenre.cod_genre FROM Subgenre JOIN UserGenres ON Subgenre.subgenre = UserGenres.cod_subgenre WHERE UserGenres.user_id='"+req.session.userLoggedId+"') AND UserGenres.user_id!='"+req.session.userLoggedId+"' AND artist_macro= 'D' GROUP BY UserGenres.user_id";
            if(get.sortby=="newusers"){
              sql="SELECT DISTINCT(UserGenres.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.city, UserArtist.artist_type, UserArtist.created FROM Subgenre JOIN UserGenres on Subgenre.subgenre = UserGenres.cod_subgenre JOIN UserArtist ON UserGenres.user_id=UserArtist.user_id WHERE UserArtist.active != 0 AND Subgenre.cod_genre IN (SELECT Subgenre.cod_genre FROM Subgenre JOIN UserGenres ON Subgenre.subgenre = UserGenres.cod_subgenre WHERE UserGenres.user_id='"+req.session.userLoggedId+"') AND UserGenres.user_id!='"+req.session.userLoggedId+"' AND artist_macro= 'D' GROUP BY UserGenres.user_id ORDER BY created DESC";
            }
            if(get.sortby=="artist_name"){
              sql="SELECT DISTINCT(UserGenres.user_id), UserArtist.user_name, UserArtist.artist_name, UserArtist.country, UserArtist.city, UserArtist.artist_type FROM Subgenre JOIN UserGenres on Subgenre.subgenre = UserGenres.cod_subgenre JOIN UserArtist ON UserGenres.user_id=UserArtist.user_id WHERE UserArtist.active != 0 AND Subgenre.cod_genre IN (SELECT Subgenre.cod_genre FROM Subgenre JOIN UserGenres ON Subgenre.subgenre = UserGenres.cod_subgenre WHERE UserGenres.user_id='"+req.session.userLoggedId+"') AND UserGenres.user_id!='"+req.session.userLoggedId+"' AND artist_macro= 'D' GROUP BY UserGenres.user_id ORDER BY artist_name DESC";
            }
            if(get.sortby=="likes" || get.sortby=="auto"){
              sql="SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserGenres.user_id FROM Subgenre JOIN UserGenres on Subgenre.subgenre = UserGenres.cod_subgenre JOIN UserArtist ON UserGenres.user_id=UserArtist.user_id WHERE UserArtist.active != 0 AND Subgenre.cod_genre IN (SELECT Subgenre.cod_genre FROM Subgenre JOIN UserGenres ON Subgenre.subgenre = UserGenres.cod_subgenre WHERE UserGenres.user_id='"+req.session.userLoggedId+"') AND UserGenres.user_id!='"+req.session.userLoggedId+"' AND artist_macro= 'D') GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;";
            }  
            
            db.query(sql, function(err, res_users_macro_sec_2){  
              res.render('all-profiles',{message,section_url, logged,userLoggedArtistMacro, userLogged,res_users_macro_sec_2, userLoggedComplete: res_user_logged[0], res_genres, res_links});
            });    
          }
          if(!logged || section_url == null){ res.redirect("/login"); return; }
        }
      }

      /*-------------------SAME GENRE IN COMMON-----------------*/
      if(section_url == "withcommongenre"){
      if(!logged || section_url == null){ res.redirect("/login"); return; }
        res.render('all-profiles',{message,section_url, logged, userLogged, res_genres, res_links, res_users_samegenre});
      }
      /*-------------------SAME CATEGORY IN COMMON-----------------*/
      if(section_url == "withcommoncategory"){
        if(!logged || section_url == null){ res.redirect("/login"); return; }
          res.render('all-profiles',{message,section_url, logged, userLogged, res_genres, res_links, res_users_samecategory});
        }
      /*-----------------GENRE COUNTRY IN COMMON-----------------*/

      if(logged){
        userLoggedMacro = res_user_logged[0].artist_macro;
        if(userLoggedMacro.length>0){ conditionUserLoggedMacro = "AND artist_macro='"+userLoggedMacro+"'";  }
      }
      
      if(section_url == "inmycountry"){
        if(logged){
          userLoggedCountry = res_user_logged[0].country;
          /***** country*****/
          var sql = "SELECT user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE UserArtist.active != 0 AND country = '"+userLoggedCountry+"' "+conditionUserLoggedMacro+" AND user_id <>'"+req.session.userLoggedId+"'";
          if(get.sortby){

            if(get.sortby=="newusers"){
              sql="SELECT user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE UserArtist.active != 0 AND country = '"+userLoggedCountry+"' "+conditionUserLoggedMacro+" AND user_id <>'"+req.session.userLoggedId+"' ORDER BY created DESC";   
            }
            if(get.sortby=="artist_name"){
              sql="SELECT user_id, artist_name, artist_type, country, city, gender, user_name FROM UserArtist WHERE UserArtist.active != 0 AND country = '"+userLoggedCountry+"' "+conditionUserLoggedMacro+" AND user_id <>'"+req.session.userLoggedId+"' ORDER BY artist_name";     
            }
            
            if(get.sortby=="likes" || get.sortby=="auto"){
              sql = "SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE country = '"+userLoggedCountry+"' "+conditionUserLoggedMacro+" AND user_id <>'"+req.session.userLoggedId+"') GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;";
            }
          }
          
          db.query(sql, function(err, res_users_samecountry){  
              res.render('all-profiles',{message,section_url, logged, userLogged, res_users_samecountry, userLoggedComplete: res_user_logged[0], res_genres, res_links});
          });
        }
        if(!logged || section_url == null){ res.redirect("/login"); return; }

      }
      /*-----------------GENRE LEVEL IN COMMON-----------------*/
      if(section_url == "samelevel"){
        if(logged){
          userLoggedUserLevel = res_user_logged[0].user_level;
          /***** level*****/
          var sql = "SELECT user_id, artist_name, artist_type, country, user_level, city, gender, user_name FROM UserArtist WHERE UserArtist.active != 0 AND user_level = '"+userLoggedUserLevel+"' "+conditionUserLoggedMacro+" AND user_id <>'"+req.session.userLoggedId+"'";
          if(get.sortby){

            if(get.sortby=="newusers"){
              sql="SELECT user_id, artist_name, artist_type, country, user_level, city, gender, user_name FROM UserArtist WHERE UserArtist.active != 0 AND user_level = '"+userLoggedUserLevel+"' "+conditionUserLoggedMacro+" AND user_id <>'"+req.session.userLoggedId+"' ORDER BY created DESC";   
            }
            if(get.sortby=="artist_name"){
              sql="SELECT user_id, artist_name, artist_type, country, user_level, city, gender, user_name FROM UserArtist WHERE UserArtist.active != 0 AND user_level = '"+userLoggedUserLevel+"' "+conditionUserLoggedMacro+" AND user_id <>'"+req.session.userLoggedId+"' ORDER BY artist_name";     
            }
          
            if(get.sortby=="likes" || get.sortby=="auto"){
              sql = "SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE user_level = '"+userLoggedUserLevel+"' "+conditionUserLoggedMacro+" AND user_id <>'"+req.session.userLoggedId+"') GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;";
            }
          }
          
          db.query(sql, function(err, res_users_samelevel){  
              res.render('all-profiles',{message,section_url, logged, userLogged, res_users_samelevel, userLoggedComplete: res_user_logged[0], res_genres, res_links});
          });
        }
        if(!logged || section_url == null){ res.redirect("/login"); return; }

      }
      /*----------------NEW USERS TODAY-----------------*/
      if(section_url == "newusertoday"){
        res.render('all-profiles',{message,section_url, logged, userLogged, res_users_newuser, res_genres, res_links});
      } 
      /*----------------ACTIVE TODAY-----------------*/
      if(section_url == "activetoday"){
        res.render('all-profiles',{message,section_url, logged, userLogged, res_users_active, res_genres, res_links});
      } 
       
  })
  .catch(err => {
      res.send(err);
  })
  

};



exports.generalMacroSection = function(req,res){
  var message = '';
  var macro_section = req.params.macro_category;
  var get = req.query;
  var logged = check_logged(req.session.userLoggedId);
  var userLogged = req.session.userLogged;
 
  var p4 = queryWrapper("SELECT * FROM UserLinks");

  if(macro_section == 'musicartists'){
    var p1= queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'M' AND active != 0");

    if(get.sortby){
      console.log(get.sortby);
      if(get.sortby=="newusers"){
        p1=queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'M' AND active != 0 ORDER BY created DESC");
      }
      if(get.sortby=="artist_name"){
        p1=queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'M' AND active != 0 ORDER BY artist_name");
        
      }
      if(get.sortby=="likes" || get.sortby=="auto"){
        p1 = queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE artist_macro = 'M') GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;");
      }
      
    }
  }
  if(macro_section == 'danceartists'){
    var p2= queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'D' AND active != 0 ");
    if(get.sortby){
      console.log(get.sortby);
      if(get.sortby=="newusers"){
        p2=queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'D' AND active != 0 ORDER BY created DESC");
      }
      if(get.sortby=="artist_name"){
        p2=queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'D' AND active != 0 ORDER BY artist_name");
        
      }
      if(get.sortby=="likes" || get.sortby=="auto"){
        p2 = queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE artist_macro = 'D') GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;");
      }
      
    }
  }
  if(macro_section == 'videoartists'){
    var p3= queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'V' AND active != 0 ");
    if(get.sortby){
      console.log(get.sortby);
      if(get.sortby=="newusers"){
        p3=queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'V' AND active != 0 ORDER BY created DESC");
      }
      if(get.sortby=="artist_name"){
        p3=queryWrapper("SELECT UserArtist.user_id, artist_name, artist_type, country, user_name FROM UserArtist WHERE artist_macro = 'V' AND active != 0 ORDER BY artist_name");
        
      }
      if(get.sortby=="likes" || get.sortby=="auto"){
        p3 = queryWrapper("SELECT COUNT(id_receiver) as countlike, UserArtist.* FROM UserLikes right outer JOIN UserArtist ON id_receiver = user_id WHERE UserArtist.active != 0 AND UserArtist.user_id in (SELECT UserArtist.user_id FROM UserArtist WHERE artist_macro = 'V') GROUP BY (UserArtist.user_id) ORDER BY COUNT(id_receiver) DESC;");
      }
      
    }
  }

  Promise.all([p1, p2, p3,p4])
  .then(([res_users_macro_music,res_users_macro_dance,res_users_macro_video,res_links]) => {
    if(macro_section == 'musicartists'){res.render('general-section',{message,macro_section, logged, userLogged, res_users_macro_music, res_links});}
    if(macro_section == 'danceartists'){res.render('general-section',{message,macro_section, logged, userLogged, res_users_macro_dance, res_links});}
    if(macro_section == 'videoartists'){res.render('general-section',{message,macro_section, logged, userLogged, res_users_macro_video, res_links});}
  });


};



exports.landing = function(req, res){
  var logged = check_logged(req.session.userLoggedId);
  if(logged){ var userLogged = req.session.userLogged; }
  res.render('getstarted', {logged, userLogged});
};


exports.reel = function(req, res){
  var logged = check_logged(req.session.userLoggedId);
  if(logged){ var userLogged = req.session.userLogged; }
  res.render('reel', {logged, userLogged});
};




exports.spotifyapis = function(req, res){
    var logged = check_logged(req.session.userLoggedId);
    if(logged){ var userLogged = req.session.userLogged; }

    var bio = "abc";

    var database = new Database(db);

    let someRows, otherRows;
    database.queryPro( "SELECT user_id FROM UserArtist WHERE email='drake@email.it' LIMIT 1" )
    .then( rows => {
        someRows = rows;
        return database.queryPro( "SELECT bio FROM UserProfile WHERE user_id='"+rows[0].user_id+"'" );
    } )
    .then( rows => {
        bio = rows[0].bio;
     } , err => {
      return database.close().then( () => { throw err; } )
     } )
    .then( () => {
        // do something with someRows and otherRows
        res.render('spotifyapis',{logged, userLogged, bio});
    })
    .catch( err => {
      // handle the error
    });
};


exports.spotifyapisglobal = function(req, res){
    var logged = check_logged(req.session.userLoggedId);
    if(logged){ var userLogged = req.session.userLogged; }

    var bio = "abc";

    var database = new Database(db);

    let someRows, otherRows;
    database.queryPro( "SELECT user_id FROM UserArtist WHERE email='drake@email.it' LIMIT 1" )
    .then( rows => {
        someRows = rows;
        return database.queryPro( "SELECT bio FROM UserProfile WHERE user_id='"+rows[0].user_id+"'" );
    } )
    .then( rows => {
        bio = rows[0].bio;
     } , err => {
      return database.close().then( () => { throw err; } )
     } )
    .then( () => {
        // do something with someRows and otherRows
        res.render('spotifyapisglobal',{logged, userLogged, bio});
    })
    .catch( err => {
      // handle the error
    });
};



exports.getNewsletter = function(req, res){
  if(req.method == "GET"){ var email = req.query.email; }
  else{ email = ""; }
  res.render("newsletter.ejs", {email});
};


exports.postNewsletter = function(req, res){
  const email = req.body.email;
  const honeypot_website = req.body.website;
  var email_valid = false; var human = true; var already_subscribed = false;
  var status = ""; var msg = "";

  if(honeypot_website.length > 0){  human = false;  } //is not a normal human

 
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
   /*
  var mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  */
  /*if (email.length > 0 && email.match(mailformat)){ email_valid = true; }*/
  

  if (email.length > 0 && re.test(email)){ email_valid = true; }
  else{
    status = "KO"; msg += "Email field is not valid.";
    res.render("newsletter.ejs", {status, msg, email_subscribed: ""});
  }
  
  
  if(human && email_valid){
      var sql = "SELECT email,status,uuid FROM NewsletterSubscriber WHERE email='"+email+"' LIMIT 1";
      db.query(sql, function(err, result){
        var flag = false;
          if(err) { console.log("Select Error."); }

          if (result.length == 1 && result[0].status == 1){
              status = "KO"; console.log("already subscribed."); msg += "This email is already subscribed.";
              res.render("newsletter.ejs", {status, msg, email_subscribed: ""});
          } 

          if(result.length == 1 && result[0].status == 0){
            status = "OK"; console.log("This email already exist."); msg += "This email already exist."; 
            var uuid = result[0].uuid;
            already_subscribed = true; flag = true;
          }

          if (result.length == 0){
            already_subscribed = false; flag = true;  console.log("not already subscribed."); msg += "This email is NOT already subscribed.";
            var m = new Date();
            var dateString = m.getUTCFullYear() +"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();
            var dateOptIn = m.getUTCFullYear() +"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCDate();

            /*
            const crypto = require('crypto');
            const token = crypto.randomBytes(16).toString("hex");
            */

            var uuid;
            var logged = check_logged(req.session.userLoggedId);
            if(logged){
              var userLoggedId = req.session.userLoggedId; uuid = userLoggedId;
            }
            if(!logged) {
              var bcrypt = require('bcrypt'); const {  v4: uuidv4  } = require('uuid'); uuid = uuidv4();
            }

            var sql = "INSERT INTO NewsletterSubscriber (uuid, email, date_opt_in, status) VALUES ('"+uuid+"', '"+email+"', '"+dateOptIn+"', '0')";

          } 

          if(flag){
            //send email with link to confirm
            var nodemailer = require('nodemailer');
            var link = "http://hevoke.com/newsletter/verify?uuid="+uuid;
        
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
            htmlString += '<body style="">';
            htmlString += '<div style="background-color: #212121; font-family: \'DM Sans\', sans-serif; color: #ffffff; text-align: center; padding: 35px 0;">';
            htmlString += '<div style="max-width: 900px; margin: 0 auto; background-color: #121212; padding: 35px; text-align: center;">';
            /*htmlString += '<div style="line-height:30px; margin-top: 0px;"><img style="display:inline-block; line-height:0px;" src="https://webdevtrick.com/wp-content/uploads/logo-fb-1.png" width="60" height="60" alt="logo"></div>';*/
            htmlString += '<div style="color:#ffffff; font-family: \'Kanit\', sans-serif; letter-spacing: -1px; font-weight: 800; font-size: 19px; margin-top: 5px;">HEVOKE</div>';
            htmlString += '<div style="font-size: 32px; line-height: 30px; letter-spacing: -1px; margin-top: 35px; font-weight: 500;">Confirm newsletter subscription</div>';     
            htmlString += '<div style="font-size: 20px; line-height: 30px; margin-top: 10px;">To confirm that you want to subscribe to our newsletter, click the link below:</div>';     
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

            if(already_subscribed == true){

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
              
              var mailOptions = {
                from: 'Hevoke <no-reply@hevoke.com>',
                to: email,
                subject: 'Confirm your subscription to the Hevoke newsletter',
                html: htmlString
             };

              transporter.sendMail(mailOptions, function(error, info){
                  if (error) {
                    console.log(error); status="KO"; msg += "Email could not be sent."
                    res.render("newsletter.ejs", {status, msg, email_subscribed: ""});
                    return;
                  } else {
                    console.log('Email sent to ' + email + ' :' + info.response);
                    status = "OK";
                    res.render("newsletter.ejs", {status, msg, email_subscribed: email});
                  }
              }); 
            }else{
              db.query(sql, function(err, result){
                if(err) {
                  status = "KO"; console.log("Error on insert."); msg += "Error during insertion."
                  res.render("newsletter.ejs", {status, msg, email_subscribed: ""});
                }
                else {
                    status = "OK"; console.log("INSERTED."); msg += "Record inserted.";  

                    //send email with link to confirm
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
                    
                    var mailOptions = {
                      from: 'Hevoke <no-reply@hevoke.com>',
                      to: email,
                      subject: 'Confirm your subscription to the Hevoke newsletter',
                      html: htmlString
                   };

                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error); status="KO"; msg += "Email could not be sent."
                          res.render("newsletter.ejs", {status, msg, email_subscribed: ""});
                          return;
                        } else {
                          console.log('Email sent to ' + email + ' :' + info.response);
                          status = "OK";
                          res.render("newsletter.ejs", {status, msg, email_subscribed: email});
                        }
                    }); 
          
                }
        
              });
            }
          }
      });
  }

  /*
  const fs = require('fs');
  var status = ""; let newEntry = '\n' + dateString + ' ' + email;
  fs.appendFile('public/newsletter/newsletter.txt', newEntry, (err) => {
    if (err) {status = "KO"; throw err;}
    status = "OK";
    res.render("newsletter.ejs", {status, email_subscribed: email});
  });
  */
};


/* -------------------------------------------------------------------- NEWSLETTER VERIFY ---------------------------------------------*/
exports.verifyNewsletter = function(req, res){
  var status=""; var msg=""; var source= "subscription";
  var uuid = req.query.uuid;
  var sql = "SELECT * FROM NewsletterSubscriber WHERE uuid='"+uuid+"' LIMIT 1;";          
  db.query(sql, function(err, results){
        if(results.length == 0){
           status = "KO"; msg += "There is no subcription started with this email.";
           res.render('newsletter-sub-activation.ejs', {status, msg, source});
        }
        if(results.length == 1 && results[0].status=="1"){
           status = "KO"; msg += "Your subscription was already confirmed. You are subscribed.";
           res.render('newsletter-sub-activation.ejs', {status, msg, source});
        }
        if(results.length == 1 && results[0].status=="0"){   
          var m = new Date();
          var dateString = m.getUTCFullYear() +"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();
          var dateOptIn = m.getUTCFullYear() +"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCDate();    
          var sql = "UPDATE NewsletterSubscriber SET status='1',date_opt_in='"+dateOptIn+"', date_opt_out=NULL WHERE uuid='"+uuid+"' AND status='0';";  
          db.query(sql, function(err, result){  
            if(result.affectedRows == 0){
                status = "KO"; msg += "A problem occurred while activating your subscription. [ERRCODE: 941]";
                res.render('newsletter-sub-activation.ejs', {status, msg, source});
            } 
            if(result.affectedRows == 1){
                status = "OK"; msg += "Subscription activated.";
                res.render('newsletter-sub-activation.ejs', {status, msg, source});
            }
          });
        }
       
  });
  
};


exports.getUnsubscribeNewsletter = (req,res) =>{
  /*if(req.method == "GET"){ var email = req.query.email; }
  else{ email = ""; }*/
  res.render("unsubscribed-newsletter.ejs"/*, {email}*/);
}

exports.postUnsubscribeNewsletter = (req,res) =>{
  const email = req.body.email;
  const honeypot_website = req.body.website;
  var email_valid = false; var human = true; var already_subscribed = false;
  var status = ""; var msg = "";

  if(honeypot_website.length > 0){  human = false;  } //is not a normal human

  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (email.length > 0 && re.test(email)){ email_valid = true; }
  else{
    status = "KO"; msg += "Email field is not valid.";
    res.render("unsubscribed-newsletter.ejs", {status, msg, email_subscribed: ""});
  }

  if(human && email_valid){
    var sql = "SELECT email,status,uuid FROM NewsletterSubscriber WHERE email='"+email+"' LIMIT 1";
    db.query(sql, function(err, result){
        if(err) { console.log("Select Error."); }

        if (result.length == 0){
            status = "KO"; console.log("This email not exist."); msg += "This email not exist.";
            res.render("unsubscribed-newsletter.ejs", {status, msg, email_subscribed: ""});
        }
        if(result.length== 1 && result[0].status == 0){
          status = "KO"; console.log("This email has not yet been activated."); msg += "This email has not yet been activated.";
            res.render("unsubscribed-newsletter.ejs", {status, msg, email_subscribed: ""});
        }
        if (result.length == 1 && result[0].status == 1){
          status = "OK"; console.log("email exist"); msg+="This email exist";
          var uuid= result[0].uuid;

          //send email with link to confirm
          var nodemailer = require('nodemailer');
          var link = "http://localhost:8080/unsubscribed-newsletter/verify?uuid="+uuid;

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
              host: "smtp.mailtrap.io",
              port: 2525,
              auth: {
                user: "9d8d23a1f6fed5",
                pass: "f0905363879baf"
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
          htmlString += '<link rel="preconnect" href="https://fonts.gstatic.com"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"> <script src="https://kit.fontawesome.com/ce061fb4d7.js" crossorigin="anonymous"></script>';
          htmlString += '<style type="text/css" media="screen">';
          htmlString += '[style*="Roboto"] { font-family: Arial, sans-serif; }';
          htmlString += 'body { min-width:100% !important; width:100%!important; line-height: 1.5; -webkit-text-size-adjust:none; color: #303030; }';
          htmlString += 'img { -ms-interpolation-mode: bicubic; /* Allow smoother rendering of resized image in Internet Explorer */ }';
          htmlString += '</style>';
          htmlString += '</head>';
          htmlString += '<body style="">';
          /*start here email template*/
          htmlString += '<div style="background-color: #212121; font-family: \'DM Sans\', sans-serif; color: #ffffff; text-align: center; padding: 35px 0;">';
          htmlString += '<div style="max-width: 900px; margin: 0 auto; background-color: #121212;  padding: 35px; text-align: center;">';
          /*htmlString += '<div style="line-height:30px; margin-top: 0px;"><img style="display:inline-block; line-height:0px;" src="https://webdevtrick.com/wp-content/uploads/logo-fb-1.png" width="60" height="60" alt="logo"></div>';*/
          htmlString += '<div style="color:#808080; font-size: 19px; margin-top: 15px;">L26.com</div>';
          htmlString += '<div style="font-size: 45px; line-height: 45px; margin-top: 20px; font-weight: 300;">Great to have you!</div>';     
          htmlString += '<div style="font-size: 22px; line-height: 30px; margin-top: 10px;">To remove your subscription to our newsletter use the button below:</div>';     
          htmlString += '<a style="background-color: #171718; border: 2px solid grey; color: #fff; font-size: 17px; text-decoration: none; padding: 0.8rem 2.3rem; margin-top: 20px; display: inline-block; width: auto; border-radius: 3px;" href='+link+'>Confirm</a>';
          htmlString += '<div style="color:#E8E8E8; font-size: 15px; line-height: 15px; margin-top: 20px;">or copy and paste this url:</div>';   
          htmlString += '<div style="color:#808080; font-size: 14px; line-height: 15px; margin-top: 5px; white-space: wrap">'+link+'</div>';     
          htmlString += '<div style="color:#E8E8E8; font-size: 15px; margin-top: 35px; border-top: 1px solid #696969; padding: 15px 0; border-bottom: 1px solid #696969;">';
          /*htmlString += '<a>Instagram</a> <a>Youtube</a>';*/
          htmlString += '<div style="display: inline-flex; gap: 27px; font-size: 27px"><i class="fab fa-facebook"></i> <i class="fab fa-youtube"></i> <i class="fab fa-instagram"></i></div>';
          htmlString += '</div>';
          htmlString += '<div style="color:#5C5C5C; font-size: 13px; margin-top: 30px;">Hai ricevuto questo messaggio perchè il tuo indirizzo email è stato indicato durante una registrazione su l26.com.<br>Se non hai fatto questa richiesta puoi segnalarcelo a info@l26.com.</div>';   
          htmlString += '<div style="color:#5C5C5C; font-size: 12px; margin-top: 15px;">l26.com</div>';
          htmlString += '</div>';
          htmlString += '</div>';
          /*end here email template*/
          htmlString += '</body>';
          htmlString += '</html>';
          
          var mailOptions = {
              from: 'J&R',
              to: email,
              subject: 'Confirmation of unsubscription from our newsletter',
              html: htmlString
          };

          transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                console.log(error); status="KO"; msg += "Email could not be sent."
                res.render("unsubscribed-newsletter.ejs", {status, msg, email_subscribed: ""});
                return;
              } else {
                console.log('Email sent to ' + email + ' :' + info.response);
                status = "OK";
                res.render("unsubscribed-newsletter.ejs", {status, msg, email_subscribed: email});
              }
          });
        } 
 
    })
  }

}

exports.verifyUnsubscribeNewsletter = function(req, res){
  var status=""; var msg="";var source= "unsubscription";
  var uuid = req.query.uuid;
  var sql = "SELECT * FROM NewsletterSubscriber WHERE uuid='"+uuid+"' LIMIT 1;";          
  db.query(sql, function(err, results){
        if(results.length == 0){
           status = "KO"; msg += "There is no subcription started with this email.";
           res.render('newsletter-sub-activation.ejs', {status, msg, source});
        }
        if(results.length == 1 && results[0].status=="1"){
          var m = new Date();
          var dateString = m.getUTCFullYear() +"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();
          var dateOptOut = m.getUTCFullYear() +"/"+ (m.getUTCMonth()+1) +"/"+ m.getUTCDate();
          var sql = "UPDATE NewsletterSubscriber SET status=0, date_opt_out = '"+dateOptOut+"' WHERE uuid = '"+uuid+"' AND status = 1 ";

          db.query(sql, function(err, result){  
             if(result.affectedRows == 0){
                status = "KO"; msg += "A problem occurred while activating your subscription. [ERRCODE: 941]";
                res.render('newsletter-sub-activation.ejs', {status, msg, source});
             } 
             if(result.affectedRows == 1){
                status = "OK"; msg += "Subscription activated.";
                res.render('newsletter-sub-activation.ejs', {status, msg, source});
             }
          });
        }
        if(results.length == 1 && results[0].status=="0"){   
          status = "KO"; msg += "Your subscription was already confirmed. You are subscribed.";
           res.render('newsletter-sub-activation.ejs', {status, msg, source});    
           
        }
       
  });
  
};

