function numberlinkEditor(boardDiva, finishedCallbacka) {  
  var boardDiv = boardDiva
  var finishedCallback = finishedCallbacka
  var currentLayout, boardHeight=5, boardWidth=5, pairCount=0
  var fields, nums=[], curr = null, prev = null, dragging = false, cellsize, fontsize
  
  var currPair = 0
  var currNum = 0
  var layout
  
  this.clear = function() {
    console.log('kli')
    currPair=0
    currNum=0
    nums=[]
    pairCount=0
    createBoard()
  }
  
  var clear = this.clear
  
  // zwraca obiekt jQuery zawierający canvas o danych współrzędnych
  var field = function(x, y) {
    if(x===null && y===null) return //ogon niedodanej pary
    if(x >= boardWidth || y >= boardHeight) { 
      horn("field(x,y): invalid value");
      return null;
    }
    return $("#" + x.toString() + "e" + y.toString());
  }

  var validate = function() {
    if(currNum != 0 || pairCount == 0) {
      window.alert('Niepoprawna plansza')
      return
    }
    var occup = new Array(boardWidth)
    for(var i = 0; i < boardWidth; ++i) { occup[i] = new Array(boardHeight) }
    loginfo(JSON.stringify(nums))
    loginfo(JSON.stringify(occup))
    for(var i in nums) {
      for(var j in nums[i])
        if(nums[i][j] === null) {
          window.alert('Niepoprawna plansza')
          return
        }
      if(typeof occup[nums[i][0]][nums[i][1]] !== 'undefined' || typeof occup[nums[i][2]][nums[i][3]] !== 'undefined') {
        window.alert('Niepoprawna plansza')
        return
      }
      occup[nums[i][0]][nums[i][1]] = true
      occup[nums[i][2]][nums[i][3]] = true
      loginfo(JSON.stringify(nums))
    }
    var nlayout = {}
    nlayout['width'] = boardWidth
    nlayout['height'] = boardHeight
    nlayout['pairCount'] = pairCount
    nlayout['pairs'] = nums
    loginfo(nlayout)
    finishedCallback(nlayout)
  }
  
  var createBoard = function() { // tworzy html planszy. +debug
    cellsize = Math.min(($(window).width()*0.75)/boardWidth,  ($(window).height()*0.7)/boardHeight); 
    fontsize = Math.ceil(cellsize*0.75);
    tabelka="<table class='board'>";
      for(i = 0; i < boardHeight; i++) {
        tabelka += "<tr>";
          for(j = 0; j < boardWidth; j++)
          tabelka += "<td class='boardsquare'><canvas class='cell' id='" + j.toString() +"e"+ i.toString() + "' width='"+ cellsize + "' height='" +cellsize+"'></canvas>" + "</td>";
          tabelka+="</tr>";
      }
      // ID POSTACI X Y
      tabelka+="</table>";
      var debug = "<table cellspacing=0 border=1><tr>";
        for(i=0; i<boardWidth; i++) 
        for(j=0; j<4; j++) debug+="<td>"+j+"</td>";
        debug+="</tr>";
      for(i=0; i<boardHeight; i++) {
        debug+="<tr>";
          for(j=0; j<boardWidth; j++)
          for(k=0; k<4; k++) 
          debug+="<td id='d"+j+i+k+"'></td>";
          debug+="</tr>";
      }
      debug+="</table>";
      //tabelka+=debug;
      tabelka+='<br><input type=button value="H+" id="hp">'+
      '<input type=button value="H-" id="hm">'+
      '<input type=button value="W+" id="wp">'+
      '<input type=button value="W-" id="wm">'+
      '<input type=button value="Koniec" id="finishEditing">' +
      '<input type=button value="Czyść" id="clearout">'
      $(boardDiv).html(tabelka);
      $('#hp').click(function() { boardHeight++; createBoard()})
      $('#hm').click(function() { boardHeight--; createBoard()})
      $('#wp').click(function() { boardWidth++; createBoard()})
      $('#wm').click(function() { boardWidth--; createBoard()})
      $('#finishEditing').click(validate)
      $('#clearout').click(clear)
      
      registerHandlers()
      redrawBoard()
  }
  
  var redrawBoard = function() { // Wypełnia gotową tabelke. Potrzebuje danych o numerkach
    loginfo('rys1')
    for(i=0;i<pairCount;++i) { // Tu rysujemy cyferki
      for(j=0;j<2;j++) {
        loginfo('rys')
        can = field(nums[i][2*j], nums[i][2*j+1]).get(0);
        center = [can.width/2, can.height/2];
        size = [can.width, can.height];
        can = can.getContext("2d");
        can.lineWidth=2;
        can.clearRect(0,0,size[0], size[1]);
        can.textBaseline="middle";
        can.textAlign = "center";
        can.font = "bold "+fontsize +"px sans-serif";
        can.beginPath();
        can.strokeText(i+1, center[0], center[1]);
        can.closePath();
      }
    }
  }

  // odświeżanie planszy, szybsze od redrawBoard, bo aktualizuje tylko jedno pole
  var redrawField = function(i,j) {
    var foundfield = field(i,j)
    var can = foundfield.get(0)
    if(countIf(fields[i][j]) != 0) foundfield.addClass("hl");
    else foundfield.removeClass("hl");
    center = [can.width/2, can.height/2];
    size = [can.width, can.height];
    can = can.getContext("2d");
    can.clearRect(0,0,size[0], size[1]);
    can.lineWidth = Math.min(Math.ceil(cellsize/10), 5);
    for(k in fields[i][j]) {
      if(fields[i][j][k]) {
        can.lineCap = "round";
        can.beginPath();
        //can.lineCap = "round";
        can.moveTo(center[0], center[1]);
        newy = (k%2 == 0) ? center[1] : (k-1)/2*size[1];
        newx = (k%2 == 1) ? center[0] : k/2*size[0];
        can.lineTo(newx, newy);
        //can.closePath();
        can.stroke();
      }
    }
    for(i=0;i<pairCount;++i) { // Tu rysujemy cyferki
      for(j=0;j<2;j++) {
        can = field(nums[i][2*j], nums[i][2*j+1]).get(0);
        center = [can.width/2, can.height/2];
        size = [can.width, can.height];
        can = can.getContext("2d");
        can.lineWidth=2;
        can.textBaseline="middle";
        can.textAlign = "center";
        can.font = "bold "+fontsize +"px sans-serif";
        can.clearRect(0,0,size[0], size[1]);
        can.beginPath();
        can.strokeText(i+1, center[0], center[1]);
        can.closePath();
        can.beginPath();
        can.lineWidth = Math.min(Math.ceil(cellsize/10), 5);
        for(k in fields[nums[i][2*j]][nums[i][2*j+1]]) {
          if(fields[nums[i][2*j]][nums[i][2*j+1]][k]) {
            can.lineCap = "round";
            can.beginPath();
            //can.lineCap = "round";
            can.moveTo(center[0], center[1]);
            newy = (k%2 == 0) ? center[1] : (k-1)/2*size[1];
            newx = (k%2 == 1) ? center[0] : k/2*size[0];
            can.lineTo(newx, newy);
            //can.closePath();
            can.stroke();
          }
        }
      }
    }
  }

  // Zwraca współrzędne canvasa (przekazane jako obiekt javascriptowy)
  // ID POSTACI X Y
  var coords = function(canvas) { return canvas['id'].split('e'); }

  var registerHandlers = function() {

      $("#editor .cell").mousedown(function() {
        if(currNum==0) {
          nums.push([null,null,null,null])
          pairCount++;
        }
        c = coords(this)
        nums[currPair][currNum*2]=c[0]
        nums[currPair][currNum*2+1]=c[1]
        if(currNum==1) {
          currNum=0
          currPair++
        } else { currNum=1 }
        //dragging = true;
        redrawBoard()
        //window.alert(JSON.stringify(nums));
        curr = this;
      });

      $(document).mouseup(function() {
        redrawBoard()
        /*if(dragging) {
          dragging = false
          redrawBoard()
          validate()
      }*/
      });
    }
    
    createBoard()
  }
