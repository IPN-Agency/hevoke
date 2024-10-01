const sg_blues = ["BLUES", "blues"];
const sg_classical = ["CLASSICAL", "classical"];
const sg_soul = ["SOUL", "soul"];
const sg_rnb = ["RNB", "rnb"];
const sg_folk = ["FOLK", "folk"];
const sg_jazz = ["JAZZ", "jazz"];
const sg_funk = ["FUNK", "funk"];
const sg_indie = ["INDIE", "indie"];
const sg_ambient = ["AMBIENT", "ambient"];
const sg_worldmusic = ["WORLD MUSIC", "world music"];
const sg_reggae = ["REGGAE", "reggae"];
const sg_brazilian = ["BRAZILIAN", "brazilian"];
const sg_gospel = ["GOSPEL", "gospel"];
const sg_psychedelic = ["PSYCHEDELIC", "psychedelic"];
const sg_trap = ["TRAP", "trap"];
const sg_emo = ["EMO", "emo"];
const sg_orchestral = ["ORCHESTRAL", "orchestral"];
const sg_hardcore = ["HARDCORE", "hardcore"];
const sg_trance = ["TRANCE", "trance"];
const sg_flamenco = ["FLAMENCO", "flamenco"];
const sg_opera = ["OPERA", "opera"];
const sg_hardstyle = ["HARDSTYLE", "hardstyle"];

const sg_country = ["COUNTRY", "country", "bluegrass"];
const sg_punk = ["PUNK", "punk", "pop punk"];
const sg_rap = ["RAP/HIP HOP","hip hop", "rap", "melodic rap", "underground hip hop"];
const sg_rock = ["ROCK", "rock","classic rock","punk rock","modern rock","alternative rock","progressive rock", "rock en espanol"];
const sg_metal = ["METAL", "metal","nu metal","funk metal","rap metal","black metal","deathcore","metalcore"];
const sg_pop = ["POP", "pop", "pop dance","pop rap","k-pop"];
const sg_electronic = ["DANCE-ELECTRONICA", "dance-electronica", "electronic", "edm", "techno", "house", "tech house", "deep house","bass house","electro house", "trance", "drum n bass","dubstep","bigroom"];
const sg_latin = ["LATIN", "latin", "trap latino", "latin pop", "reggaeton", "dembow"];
const sg_lofi = ["LOFI", "lofi", "lofi beats"];

var a = new Array();
a.push(sg_blues, sg_classical, sg_worldmusic, sg_indie, sg_rnb, sg_ambient, sg_funk, sg_country,sg_jazz, 
  sg_electronic, sg_folk, sg_metal, sg_latin, sg_pop, sg_rock, sg_rap, sg_reggae, sg_soul, sg_brazilian,sg_gospel,
  sg_psychedelic, sg_trap, sg_emo, sg_orchestral, sg_hardcore, sg_trance, sg_flamenco, sg_opera, sg_hardstyle, sg_punk, sg_lofi);
  a.sort();

var htmlStringOptions=""; var categoryOptions="";
for(i= 0; i < a.length; i++){
    htmlStringOptions="";
    for (j = 0; j < a[i].length; j++) {
        
        if(j==0){
            categoryOptions=a[i][j];
        }
        else{
              htmlStringOptions+='<input id="'+a[i][j]+'" type="checkbox" name="genre" value="'+a[i][j]+'"> <label for="'+a[i][j]+'">'+a[i][j]+'</label>';
        }
      
    }

    document.getElementById("containerToAppendGenres").innerHTML+="<div class='check-buttons small'><span class='options-genre-title'>"+categoryOptions+"</span><div>"+htmlStringOptions+"</div></div>";
}
