DROP DATABASE musicwebsitenode;
CREATE DATABASE musicwebsitenode;
USE musicwebsitenode;

/*
DROP TABLE IF EXISTS UserArtist;
DROP TABLE IF EXISTS ResetPassword;
DROP TABLE IF EXISTS ChangeEmail;
DROP TABLE IF EXISTS UserProfile;
DROP TABLE IF EXISTS Genre;
DROP TABLE IF EXISTS Subgenre;
DROP TABLE IF EXISTS UserGenres;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS UserCategory;

DROP TABLE IF EXISTS UserLinks;
DROP TABLE IF EXISTS UserMessage;
DROP TABLE IF EXISTS UserLikes;
DROP TABLE IF EXISTS UserFollows;
DROP TABLE IF EXISTS Ads;
*/

CREATE TABLE UserArtist(
    user_id         VARCHAR(36) NOT NULL PRIMARY KEY,
    user_name       VARCHAR(30) NOT NULL UNIQUE,
    artist_name     VARCHAR(30) NOT NULL,
    email           VARCHAR(50) NOT NULL UNIQUE,
    artist_type     VARCHAR(50),
    country         VARCHAR(5),
    city            VARCHAR(30),
    gender          ENUM('-','F','M','O'),
    date_b          DATE,
    active          INT(1) NOT NULL DEFAULT '0',
    password        VARCHAR(255) NOT NULL,
    verif_code      varchar(264),
    created         timestamp NOT NULL,
    modified        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login      DATE,
    last_edit_user_name  DATE NOT NULL DEFAULT CURRENT_DATE,
    last_edit_artist_name  DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE ResetPassword(
    email           VARCHAR(50) NOT NULL,
    exp_date        timestamp,
    token           varchar(264),
    PRIMARY KEY (email, token),
    FOREIGN KEY (email) REFERENCES UserArtist(email) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ChangeEmail(
    user_id           VARCHAR(36) NOT NULL,
    email_new           VARCHAR(50) NOT NULL,
    exp_date        timestamp,
    token           varchar(264),
    PRIMARY KEY (user_id, token),
    FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserProfile(
    user_id         VARCHAR(36) PRIMARY KEY,
    bio             VARCHAR(500) DEFAULT "-",
    theme           VARCHAR(20) NOT NULL DEFAULT "black",
    image           VARCHAR(50) DEFAULT "fotoprofilo.jpg",
    FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Genre(
    genre           VARCHAR(50) PRIMARY KEY
);

CREATE TABLE Subgenre(
    cod_genre        VARCHAR(50) NOT NULL,
    subgenre         VARCHAR(50) NOT NULL,
    PRIMARY KEY(subgenre, cod_genre),
    FOREIGN KEY (cod_genre) REFERENCES Genre(genre) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserGenres(
    user_id      VARCHAR(36) NOT NULL,
    cod_subgenre      VARCHAR(50) NOT NULL,
    PRIMARY KEY(user_id, cod_subgenre),
    FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (cod_subgenre) REFERENCES Subgenre(subgenre) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Category(
    category_id         VARCHAR(50) PRIMARY KEY
);

CREATE TABLE UserCategory(
    user_id      VARCHAR(36) NOT NULL,
    category_id      VARCHAR(50) NOT NULL,
    PRIMARY KEY(user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserLinks(
    user_id      VARCHAR(36) NOT NULL,
    link_type     VARCHAR(30) NOT NULL,
    link_name    VARCHAR(30) NOT NULL,        
    url   VARCHAR(80) NOT NULL,
    PRIMARY KEY (user_id, link_name),
    FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserMessage(
    sender_id          VARCHAR(36) NOT NULL,
    receiver_id        VARCHAR(36) NOT NULL,
    datetime_sent      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content            TEXT,
    PRIMARY KEY (sender_id, receiver_id, datetime_sent),
    FOREIGN KEY (sender_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Post(
    user_id      VARCHAR(36) NOT NULL,
    post_type     VARCHAR(30) NOT NULL,
    post_title    VARCHAR(30) NOT NULL,        
    url            VARCHAR(80) NOT NULL,
    datetime_feed      datetime,           
    created         timestamp NOT NULL,
     modified        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, created, post_title),
    FOREIGN KEY (user_id) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserLikes(
    id_sender           VARCHAR(36) NOT NULL,
    id_receiver         VARCHAR(36) NOT NULL,
    datetime_sent     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id_sender, id_receiver),
    FOREIGN KEY (id_sender) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_receiver) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE UserFollows(
    id_sender           VARCHAR(36) NOT NULL,
    id_receiver         VARCHAR(36) NOT NULL,
    datetime_sent     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id_sender, id_receiver),
    FOREIGN KEY (id_sender) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_receiver) REFERENCES UserArtist(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Ads(
    ad_id          INT(8) UNSIGNED ZEROFILL AUTO_INCREMENT NOT NULL,
    title         CHAR,
    level_ad         CHAR,
    start_cycle      DATE,
    end_cycle        DATE,
    payment          DECIMAL(4,2),
    youtube_video_id             VARCHAR(100),
    payment_received BOOLEAN DEFAULT FALSE,   
    PRIMARY KEY (ad_id, end_cycle)
);

INSERT INTO Ads (youtube_video_id) VALUES('nVUUk_12yXU'); 
INSERT INTO Ads (youtube_video_id) VALUES('5lrMlex9_nk'); 

INSERT INTO Category (category_id) VALUES ('producer');
INSERT INTO Category (category_id) VALUES ('singer');
INSERT INTO Category (category_id) VALUES ('guitarist');
INSERT INTO Category (category_id) VALUES ('drummer');
INSERT INTO Category (category_id) VALUES ('rapper');
INSERT INTO Category (category_id) VALUES ('band');
INSERT INTO Category (category_id) VALUES ('pianist');
INSERT INTO Category (category_id) VALUES ('dj');

INSERT INTO Genre (genre) VALUES ('rock');
INSERT INTO Genre (genre) VALUES ('pop');
INSERT INTO Genre (genre) VALUES ('folk');
INSERT INTO Genre (genre) VALUES ('rnb');
INSERT INTO Genre (genre) VALUES ('hiphop');
INSERT INTO Genre (genre) VALUES ('dance-electronica');
INSERT INTO Genre (genre) VALUES ('latin');
INSERT INTO Genre (genre) VALUES ('metal');
INSERT INTO Genre (genre) VALUES ('jazz');
INSERT INTO Genre (genre) VALUES ('blues');
INSERT INTO Genre (genre) VALUES ('classical');
INSERT INTO Genre (genre) VALUES ('lofi');
INSERT INTO Genre (genre) VALUES ('soul');
INSERT INTO Genre (genre) VALUES ('reggae');
INSERT INTO Genre (genre) VALUES ('funk');
INSERT INTO Genre (genre) VALUES ('country');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('country', 'country');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('soul', 'soul');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('folk', 'folk');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('classical', 'classical');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('blues', 'blues');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('hiphop', 'rap/hip hop');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('hiphop', 'melodic rap');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('hiphop', 'underground hip hop');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rnb', 'rnb');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'rock');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'classic rock');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'modern rock');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'alternative rock');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('rock', 'rock en espanol');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('metal', 'metal');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('pop', 'pop');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('pop', 'pop dance');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('pop', 'pop rap');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('pop', 'k-pop');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'electronic');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'deep house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'tech house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'tropical house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'bass house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'electro house');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('dance-electronica', 'bigroom');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('latin', 'latin');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('latin', 'trap latino');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('latin', 'latin pop');

INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('lofi', 'lofi beats');
INSERT INTO Subgenre (cod_genre, subgenre) VALUES ('funk', 'funk');

INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a01', 'drake', 'Drake', 'Milano', 'US', 'M', 'drake@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a02', 'theweeknd', 'The Weeknd', 'Milano', 'US','M', 'theweeknd@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a03', 'djsnake', 'DJ Snake', 'Milano', 'US','M', 'djsnake@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a04', 'dualipa', 'Dua Lipa', 'Milano', 'US','F', 'dualipa@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a05', 'postmalone', 'Post Malone', 'Milano', 'US','M', 'postmalone@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a06', 'arianagrande', 'Ariana Grande', 'Milano','US', 'F', 'arianagrande@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a07', 'mikeshinoda', 'Mike Shinoda', 'Milano', 'US', 'M', 'mikeshinoda@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a08', 'linkinpark', 'Linkin Park', 'Milano', 'US', 'M', 'linkinpark@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a09', 'eminem', 'Eminem', 'Milano', 'US', 'M', 'eminem@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');
INSERT INTO UserArtist (user_id, user_name, artist_name, city, country, gender, email, password, active)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a10', 'fortminor', 'Fort Minor', 'Milano', 'US', 'M', 'fortminor@email.it', '$2b$10$zBoLgQzRTERVfNc/zWVhFOQ6ni3xHbAmd80xDCytrq652ZsuS8HhG', '1');


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


INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a01', 'rapper');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a01', 'singer');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a02', 'singer');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a03', 'producer');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a03', 'dj');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a04', 'singer');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a05', 'rapper');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a06', 'singer');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a07', 'rapper');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a08', 'band');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a09', 'rapper');
INSERT INTO UserCategory (user_id, category_id) VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a10', 'band');

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


INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a02', '2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2021-04-08 20:19:01', '...');

INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a04', '2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2021-04-08 20:19:01', '...');

INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a08', '2b990df1-c9c8-495b-b8c5-d3eb06262a01', '2021-04-08 20:19:01', '...');

INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a05', '2b990df1-c9c8-495b-b8c5-d3eb06262a02', '2021-04-08 20:19:01', '...');

INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a06', '2b990df1-c9c8-495b-b8c5-d3eb06262a02', '2021-04-08 20:19:01', '...');

INSERT INTO UserMessage (sender_id, receiver_id, datetime_sent, content)
VALUES ('2b990df1-c9c8-495b-b8c5-d3eb06262a07', '2b990df1-c9c8-495b-b8c5-d3eb06262a02', '2021-04-08 20:19:01', '...');