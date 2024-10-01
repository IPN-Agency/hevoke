USE musicwebsitenode;

DROP TABLE IF EXISTS Post;
DROP TABLE IF EXISTS ResetPassword;
DROP TABLE IF EXISTS ChangeEmail;
DROP TABLE IF EXISTS UserProfile;
DROP TABLE IF EXISTS UserRadar;
DROP TABLE IF EXISTS UserGenres;
DROP TABLE IF EXISTS NewsletterSubscriber;

DROP TABLE IF EXISTS UserCategory;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS UserLinks;
DROP TABLE IF EXISTS UserMessage;
DROP TABLE IF EXISTS UserLikes;
DROP TABLE IF EXISTS UserFollows;
DROP TABLE IF EXISTS Ads;

DROP TABLE IF EXISTS Subgenre;
DROP TABLE IF EXISTS Genre;
DROP TABLE IF EXISTS UserArtist;

CREATE TABLE UserArtist(
  user_id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_name VARCHAR(30) NOT NULL UNIQUE,
  artist_name VARCHAR(30) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  artist_type VARCHAR(50),
  artist_macro ENUM('M', 'V', 'D'),
  country VARCHAR(5),
  city VARCHAR(30),
  user_level ENUM('1','2','3','4'),
  gender ENUM('-','F','M','O'),
  date_b DATE,
  active TINYINT(1) NOT NULL DEFAULT '0',
  password VARCHAR(255) NOT NULL,
  verif_code varchar(264),
  created DATE NOT NULL DEFAULT (CURRENT_DATE),
  modified DATE NOT NULL DEFAULT (CURRENT_DATE),
  last_login DATE,
  last_edit_user_name DATE NOT NULL DEFAULT (CURRENT_DATE),
  last_edit_artist_name DATE NOT NULL DEFAULT (CURRENT_DATE)
);



CREATE TABLE UserProfile(
  user_id VARCHAR(36) PRIMARY KEY,
  bio VARCHAR(300) DEFAULT '-',
  theme VARCHAR(20) NOT NULL DEFAULT 'black',
  FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Genre(
  genre VARCHAR(50) PRIMARY KEY
);

CREATE TABLE Subgenre(
  cod_genre VARCHAR(50) NOT NULL,
  subgenre VARCHAR(50) NOT NULL,
  PRIMARY KEY(subgenre, cod_genre),
  FOREIGN KEY (cod_genre) REFERENCES Genre(genre) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserGenres(
  user_id VARCHAR(36) NOT NULL,
  cod_subgenre VARCHAR(50) NOT NULL,
  PRIMARY KEY(user_id, cod_subgenre),
  FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (cod_subgenre) REFERENCES Subgenre(subgenre) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Category(
  category_id VARCHAR(50) PRIMARY KEY
);

CREATE TABLE UserCategory(
  user_id VARCHAR(36) NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  category_order INT(1),
  PRIMARY KEY(user_id, category_id, category_order),
  FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserLinks(
  user_id VARCHAR(36) NOT NULL,
  link_type VARCHAR(30) NOT NULL,
  link_name VARCHAR(30) NOT NULL,
  url VARCHAR(80) NOT NULL,
  PRIMARY KEY (user_id, link_name),
  FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserMessage(
  sender_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  datetime_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  content TEXT,
  PRIMARY KEY (sender_id, receiver_id, datetime_sent),
  FOREIGN KEY (sender_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserPost(
  user_id VARCHAR(36) NOT NULL,
  post_type VARCHAR(30) NOT NULL,
  post_title VARCHAR(30) NOT NULL,
  url VARCHAR(80) NOT NULL,
  datetime_feed datetime,
  created timestamp NOT NULL,
  modified timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, created, post_title),
  FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserLikes(
  id_sender VARCHAR(36) NOT NULL,
  id_receiver VARCHAR(36) NOT NULL,
  datetime_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id_sender, id_receiver),
  FOREIGN KEY (id_sender) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_receiver) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserFollows(
  id_sender VARCHAR(36) NOT NULL,
  id_receiver VARCHAR(36) NOT NULL,
  datetime_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(id_sender, id_receiver),
  FOREIGN KEY (id_sender) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_receiver) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE TokenResetPassword(
  email VARCHAR(50) NOT NULL,
  exp_date timestamp,
  token varchar(264),
  PRIMARY KEY (email, token),
  FOREIGN KEY (email) REFERENCES UserArtist(email) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE TokenChangeEmail(
  user_id VARCHAR(36) NOT NULL,
  email_new VARCHAR(50) NOT NULL,
  exp_date timestamp,
  token varchar(264),
  PRIMARY KEY (user_id, token),
  FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Ads(
  ad_id INT(8) UNSIGNED ZEROFILL AUTO_INCREMENT NOT NULL,
  ad_title VARCHAR(20),
  ad_text VARCHAR(45),
  ad_level CHAR(1),
  payment DECIMAL(4,2),
  youtube_video_id VARCHAR(100),
  payment_received BOOLEAN DEFAULT FALSE,
  position INT(2),
  for_artist_macro CHAR,
  PRIMARY KEY (ad_id)
);


CREATE TABLE UserRadar(
  radar_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  category_id VARCHAR(50) NOT NULL,
  message VARCHAR(100),
  created timestamp NOT NULL DEFAULT (CURRENT_DATE),
  closed date,
  status VARCHAR(3),
  PRIMARY KEY (radar_id),
  FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE NewsletterSubscriber(
  uuid VARCHAR(36) NOT NULL, 
  email VARCHAR(50) NOT NULL,
  newsletter_type VARCHAR(3),
  date_opt_in date,
  date_opt_out date,
  status VARCHAR(3),
  PRIMARY KEY (uuid)
);

CREATE TABLE SignalCollaboration(
  id_sender VARCHAR(36) NOT NULL,
  id_receiver VARCHAR(36) NOT NULL,
  radar_id VARCHAR(36),
  datetime_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  PRIMARY KEY(id_sender, datetime_sent),
  FOREIGN KEY (id_sender) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_receiver) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (radar_id) REFERENCES UserRadar(radar_id) ON DELETE CASCADE ON UPDATE CASCADE
);



CREATE TABLE TrackingSession(
  session_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  type CHAR(6),
  time_login TIMESTAMP NOT NULL,
  time_logout TIMESTAMP,
  PRIMARY KEY(session_id),
  FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE TrackingProfileView(
  user_id_profile VARCHAR(36) NOT NULL,
  user_id_viewer VARCHAR(36) NOT NULL,
  time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  params VARCHAR(10),
  PRIMARY KEY (user_id_profile, user_id_viewer, time),
  FOREIGN KEY (user_id_profile) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id_viewer) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE TrackingUserClickLink(
  id_user_profile VARCHAR(36) NOT NULL,
  id_user_clicking VARCHAR(36) NOT NULL,
  time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  link_name VARCHAR(15),
  link_url VARCHAR(60),
  PRIMARY KEY (id_user_profile, id_user_clicking, time),
  FOREIGN KEY (id_user_profile) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_user_clicking) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE TrackingVisitorClickLink(
  id_user_profile VARCHAR(36) NOT NULL,
  time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  link_name VARCHAR(15),
  link_url VARCHAR(60),
  PRIMARY KEY (id_user_profile, time),
  FOREIGN KEY (id_user_profile) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO Category (category_id) VALUES ('music lover');
INSERT INTO Category (category_id) VALUES ('guitarist');
INSERT INTO Category (category_id) VALUES ('singer');
INSERT INTO Category (category_id) VALUES ('composer');
INSERT INTO Category (category_id) VALUES ('rapper');
INSERT INTO Category (category_id) VALUES ('trapper');
INSERT INTO Category (category_id) VALUES ('producer');
INSERT INTO Category (category_id) VALUES ('songwriter');
INSERT INTO Category (category_id) VALUES ('bassist');
INSERT INTO Category (category_id) VALUES ('drummer');
INSERT INTO Category (category_id) VALUES ('dj');
INSERT INTO Category (category_id) VALUES ('pianist');
INSERT INTO Category (category_id) VALUES ('lyricist');
INSERT INTO Category (category_id) VALUES ('band');
INSERT INTO Category (category_id) VALUES ('keyboardist');
INSERT INTO Category (category_id) VALUES ('dancer');
INSERT INTO Category (category_id) VALUES ('accordionist');
INSERT INTO Category (category_id) VALUES ('ukelelist');
INSERT INTO Category (category_id) VALUES ('percussionist');
INSERT INTO Category (category_id) VALUES ('videographer');
INSERT INTO Category (category_id) VALUES ('violinist');
INSERT INTO Category (category_id) VALUES ('saxophonist');
INSERT INTO Category (category_id) VALUES ('brass player');
INSERT INTO Category (category_id) VALUES ('video director');
INSERT INTO Category (category_id) VALUES ('banjolist');
INSERT INTO Category (category_id) VALUES ('harmonicist');
INSERT INTO Category (category_id) VALUES ('cellist');
INSERT INTO Category (category_id) VALUES ('clarinetist');
INSERT INTO Category (category_id) VALUES ('strings player');
INSERT INTO Category (category_id) VALUES ('trumpter');
INSERT INTO Category (category_id) VALUES ('trombonist');
INSERT INTO Category (category_id) VALUES ('harpist');



INSERT INTO Genre (genre) VALUES ('soul');
INSERT INTO Genre (genre) VALUES ('rock');
INSERT INTO Genre (genre) VALUES ('hip hop');
INSERT INTO Genre (genre) VALUES ('pop');
INSERT INTO Genre (genre) VALUES ('rnb'); 
INSERT INTO Genre (genre) VALUES ('indie');
INSERT INTO Genre (genre) VALUES ('dance-electronica');
INSERT INTO Genre (genre) VALUES ('blues');
INSERT INTO Genre (genre) VALUES ('metal');
INSERT INTO Genre (genre) VALUES ('jazz');
INSERT INTO Genre (genre) VALUES ('classical');
INSERT INTO Genre (genre) VALUES ('ambient');
INSERT INTO Genre (genre) VALUES ('funk');
INSERT INTO Genre (genre) VALUES ('punk');
INSERT INTO Genre (genre) VALUES ('folk');
INSERT INTO Genre (genre) VALUES ('world music');
INSERT INTO Genre (genre) VALUES ('reggae');
INSERT INTO Genre (genre) VALUES ('country');
INSERT INTO Genre (genre) VALUES ('latin');
INSERT INTO Genre (genre) VALUES ('brazilian');
INSERT INTO Genre (genre) VALUES ('gospel');
INSERT INTO Genre (genre) VALUES ('psychedelic');
INSERT INTO Genre (genre) VALUES ('trap');
INSERT INTO Genre (genre) VALUES ('emo');
INSERT INTO Genre (genre) VALUES ('orchestral');
INSERT INTO Genre (genre) VALUES ('hardcore');
INSERT INTO Genre (genre) VALUES ('trance');
INSERT INTO Genre (genre) VALUES ('flamenco');
INSERT INTO Genre (genre) VALUES ('opera');
INSERT INTO Genre (genre) VALUES ('hardstyle');
INSERT INTO Genre (genre) VALUES ('lofi');



INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('soul', 'soul');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('folk', 'folk');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('classical', 'classical');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('blues', 'blues');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rnb', 'rnb');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('jazz', 'jazz');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('funk', 'funk');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('indie', 'indie');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('ambient', 'ambient');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('world music', 'world music');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('reggae', 'reggae');/**/
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('brazilian', 'brazilian');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('gospel', 'gospel');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('psychedelic', 'psychedelic');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('trap', 'trap');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('emo', 'emo');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('orchestral', 'orchestral');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('hardcore', 'hardcore');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('trance', 'trance');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('flamenco', 'flamenco');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('opera', 'opera');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('hardstyle', 'hardstyle');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('country', 'country');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('country', 'bluegrass');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('punk', 'punk');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('punk', 'pop punk');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('hip hop', 'hip hop');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('hip hop', 'rap');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('hip hop', 'melodic rap');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('hip hop', 'underground hip hop');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'rock');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'punk rock');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'classic rock');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'modern rock');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'alternative rock');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'progressive rock');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'rock en espanol');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('metal', 'metal');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('metal', 'nu metal');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('metal', 'funk metal');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('metal', 'rap metal');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('metal', 'black metal');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('metal', 'deathcore');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('metal', 'metalcore');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('pop', 'pop');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('pop', 'pop dance');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('pop', 'pop rap');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('pop', 'k-pop');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'dance-electronica');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'drum n bass');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'dubstep');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'electronic');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'techno');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'deep house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'tech house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'bass house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'electro house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'bigroom');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('latin', 'latin');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('latin', 'trap latino');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('latin', 'latin pop');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('lofi', 'lofi');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('lofi', 'lofi beats');

INSERT INTO Ads (youtube_video_id, ad_text, position) VALUES('nVUUk_12yXU', 'the new single of frvrfriday', 1);
INSERT INTO Ads (youtube_video_id, ad_text, position) VALUES('5lrMlex9_nk', 'the new single of baby keem', 2);
INSERT INTO Ads (youtube_video_id, ad_text, position) VALUES('BNVZmrxXuuU', 'spot for audi', 3);


INSERT INTO UserRadar (user_id, category_id, created, status) VALUES ('02kJSzxNuaWGqwubyUba0Z', 'video director', '2021-05-10 00:00:0000', 'A');
INSERT INTO UserRadar (user_id, category_id, created, status) VALUES ('02kJSzxNuaWGqwubyUba0Z', 'dancer', '2021-05-10 00:00:0000', 'A');



/*
userartist
 `status` tinyint(1) NOT NULL,
  `approved` tinyint(1) NOT NULL,
  `registration_date` datetime NOT NULL
*/

/*userprofile:
last edit user name
last edit artist name
verif_code



INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender,user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a01', 'drake', 'Drake', 'Milano', 'US', 'M', '2', 'drake@email.it','$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a02', 'theweeknd', 'The Weeknd', 'Milano', 'US','M', '2', 'theweeknd@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a03', 'djsnake', 'DJ Snake', 'Milano', 'US','M', '2', 'djsnake@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a04', 'dualipa', 'Dua Lipa', 'Milano', 'US','F', '2', 'dualipa@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a05', 'postmalone', 'Post Malone', 'Milano', 'US','M', '2', 'postmalone@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a06', 'arianagrande', 'Ariana Grande', 'Milano','US', 'F', '1', 'arianagrande@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a07', 'mikeshinoda', 'Mike Shinoda', 'Milano', 'US', 'M', '1', 'mikeshinoda@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a08', 'linkinpark', 'Linkin Park', 'Milano', 'US', 'M', '1', 'linkinpark@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a09', 'eminem', 'Eminem', 'Milano', 'US', 'M', '1', 'eminem@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a10', 'fortminor', 'Fort Minor', 'Milano', 'US', 'M', '1', 'fortminor@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');

INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a10', 'fortminor', 'Fort Minor', 'Milano', 'US', 'M', '1', 'fortminor@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a10', 'fortminor', 'Fort Minor', 'Milano', 'US', 'M', '1', 'fortminor@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a10', 'fortminor', 'Fort Minor', 'Milano', 'US', 'M', '1', 'fortminor@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');

INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, user_level, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a10', 'fortminor', 'Fort Minor', 'Milano', 'US', 'M', '1', 'fortminor@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');



INSERT INTO UserProfile (user_id)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a01');
INSERT INTO UserProfile (user_id)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a02');
INSERT INTO UserProfile (user_id)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a03');
INSERT INTO UserProfile (user_id)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a04');
INSERT INTO UserProfile (user_id)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a05');
INSERT INTO UserProfile (user_id)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a06');
INSERT INTO UserProfile (user_id)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a07');
INSERT INTO UserProfile (user_id)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a08');
INSERT INTO UserProfile (user_id)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a09');
INSERT INTO UserProfile (user_id)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a10');


INSERT INTO UserGenres (user_id, cod_subgenre)
VALUES
('2b990df1-c9c8-495b-b8c5-d3eb06262a01', 'pop'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a08', 'metal'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a04', 'pop'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a07', 'pop'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a03', 'pop'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a02', 'pop');

INSERT INTO UserLikes (id_sender,id_receiver)
VALUES
('2b990df1-c9c8-495b-b8c5-d3eb06262a02', '2b990df1-c9c8-495b-b8c5-d3eb06262a01'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a03', '2b990df1-c9c8-495b-b8c5-d3eb06262a01'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a04', '2b990df1-c9c8-495b-b8c5-d3eb06262a01'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a05', '2b990df1-c9c8-495b-b8c5-d3eb06262a01'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a06', '2b990df1-c9c8-495b-b8c5-d3eb06262a01'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a07', '2b990df1-c9c8-495b-b8c5-d3eb06262a01'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2b990df1-c9c8-495b-b8c5-d3eb06262a02'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a03', '2b990df1-c9c8-495b-b8c5-d3eb06262a02'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a04', '2b990df1-c9c8-495b-b8c5-d3eb06262a02'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a05', '2b990df1-c9c8-495b-b8c5-d3eb06262a02'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a06', '2b990df1-c9c8-495b-b8c5-d3eb06262a02'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a07', '2b990df1-c9c8-495b-b8c5-d3eb06262a02'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2b990df1-c9c8-495b-b8c5-d3eb06262a03'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2b990df1-c9c8-495b-b8c5-d3eb06262a04'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2b990df1-c9c8-495b-b8c5-d3eb06262a05'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2b990df1-c9c8-495b-b8c5-d3eb06262a06'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2b990df1-c9c8-495b-b8c5-d3eb06262a07'),
('2b990df1-c9c8-495b-b8c5-d3eb06262a07', '2b990df1-c9c8-495b-b8c5-d3eb06262a04');


INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a02', '2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2021-04-08 20:19:01', '...');

INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a04', '2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2021-04-08 20:19:01', '...');

INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a08', '2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2021-04-08 20:19:01', '...');

INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a05', '2b990df1-c9c8-495b-b8c5-d3eb06262a02', '2021-04-08 20:19:01', '...');

INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a06', '2b990df1-c9c8-495b-b8c5-d3eb06262a02', '2021-04-08 20:19:01', '...');

INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a07', '2b990df1-c9c8-495b-b8c5-d3eb06262a02', '2021-04-08 20:19:01', '...');
*/

