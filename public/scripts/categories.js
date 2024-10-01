                  
    const sg_voice = ["VOICE", "singer", "rapper", "trapper"];
    const sg_productiondj = ["PRODUCTION/DJ", "producer", "dj"];
    const sg_instrument = ["INSTRUMENT", "guitarist", "pianist", "drummer", "bassist", "keyboardist", 
                        "percussionist", "violinist", "saxophonist", "brass player", "ukelelist",
                        "banjolist", "harmonicist", "cellist", "clarinetist", "strings player",
                        "trumpter", "trombonist", "harpist", "accordionist"]; 
//const sg_orchestralinstrument =["ORCHESTRAL INSTRUMENT"]                
    const sg_writemusic = ["WRITE/WROTE MUSIC", "songwriter", "composer", "lyricist"];
    const sg_musicvideoprod = ["MUSIC VIDEO PRODUCTION", "video director", "videographer", "graphic designer"];
    const sg_band = ["BAND", "band"];
    const sg_other = ["OTHER", "dancer", "music lover"]

    var a = new Array();
    a.push(sg_voice, sg_productiondj, sg_instrument, sg_writemusic, sg_musicvideoprod, sg_band, sg_other);
    //a.sort();
    var htmlStringOptions=""; var categoryOptions="";
    for(i= 0; i < a.length; i++){
        htmlStringOptions="";
        for (j = 0; j < a[i].length; j++) {
            
            if(j==0){
                categoryOptions = a[i][j];
                categoryClass = categoryOptions.replace(/\s+/g, '').replace(/\//g, "-").toLowerCase();
            }
            else{
                htmlStringOptions+='<input id="'+a[i][j]+'" type="checkbox" name="category" value="'+a[i][j]+'"> <label for="'+a[i][j]+'">'+a[i][j]+'</label>';
            }
        
        }

        document.getElementById("containerToAppendCategories").innerHTML+="<div class='check-buttons small "+categoryClass+"'><span class='options-genre-title'>"+categoryOptions+"</span><div>"+htmlStringOptions+"</div></div>";
    }
