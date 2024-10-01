
if(document.getElementsByClassName("horizontal-scroll").length>0){

    (function() {
      
   
        Array.prototype.forEach.call(document.getElementsByClassName("horizontal-scroll"), function(element) {
    
            function scrollHorizontally(e) {
              e = window.event || e;
              var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
              element.scrollLeft -= (delta*80); // Multiplied by 40
              e.preventDefault();
            }
    
            if (element.addEventListener) {
                element.addEventListener("mousewheel", scrollHorizontally, false); // IE9, Chrome, Safari, Opera
                element.addEventListener("DOMMouseScroll", scrollHorizontally, false); // Firefox
            
            } else {
                element.attachEvent("onmousewheel", scrollHorizontally); // IE 6/7/8
                
            }
    });
    
    })();
    


        
}


  
  
  