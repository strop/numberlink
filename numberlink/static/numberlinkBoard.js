/*
obiekt gry:

numberlinkBoard:
clear()
loadLayout()
potrzebuje callback do zwycięstwa
potrzebuje diva, w którym ma się narysować

victory callback zostanie wywołane z:

fieldsami + layoutem

*/

function numberlinkBoard(boardDiva, victoryCallbacka) {  
  var boardDiv = boardDiva
  var victoryCallback = victoryCallbacka
  var currentLayout, boardHeight, boardWidth, pairCount
  var fields, nums, curr = null, prev = null, dragging = false, cellsize, fontsize
  
  var clearfields = function() { // czyści stan chwilowy (połączenia)
    fields = new Array(boardWidth);
    for(i = 0; i < boardWidth; i++) {
      fields[i] = new Array(boardHeight);
      for(j = 0; j < boardHeight; j++) {
        fields[i][j] = new Array(4);
        for(k = 0; k < 4; k++) fields[i][j][k] = false;
      }
    }
  }

  // zwraca obiekt jQuery zawierający canvas o danych współrzędnych
  var field = function(x, y) {
    if(x >= boardWidth || y >= boardHeight) { 
      horn("field(x,y): invalid value");
      return null;
    }
    return $("#" + x.toString() + "a" + y.toString());
  }

  // sprawdzenie, czy aktualy układ połączeń to dobre rozwiązanie
  // sprawdza i samo wywołuje win(), nic nie zwraca
  var validate = function() {
    var xpos, ypos, finishx, finishy, cameFrom, proper = 0, neigh;
    for(i=0;i<pairCount;i++) {
      xpos = nums[i][0];
      ypos = nums[i][1];
      finishx = nums[i][2];
      finishy = nums[i][3];
      cameFrom = 4;
      do {
        neigh = fields[xpos][ypos];
        if(cameFrom == 4) {if(countIf(neigh) != 1) return;}
        else if(countIf(neigh) != 2) return;
        if(neigh[0] && cameFrom != 0) { xpos--; cameFrom = 2; }
        else if(neigh[1] && cameFrom != 1) { ypos--; cameFrom = 3; }
        else if(neigh[2] && cameFrom != 2) { xpos++; cameFrom = 0; }
        else if(neigh[3] && cameFrom != 3) { ypos++; cameFrom = 1; }
      } while(xpos != finishx || ypos != finishy);
      if((xpos == finishx && ypos == finishy) && countIf(fields[xpos][ypos]) == 1) proper++;
    }
    if(proper == pairCount) victoryCallback(currentLayout, fields)
  }

  var createBoard = function() { // tworzy html planszy. +debug
    cellsize = Math.min(($(window).width()*0.75)/boardWidth,  ($(window).height()*0.9)/boardHeight); 
    fontsize = Math.ceil(cellsize*0.75);
    tabelka="<table class='board'>";
      for(i = 0; i < boardHeight; i++) {
        tabelka += "<tr>";
          for(j = 0; j < boardWidth; j++)
          tabelka += "<td class='boardsquare'><canvas class='cell' id='" + j.toString() +"a"+ i.toString() + "' width='"+ cellsize + "' height='" +cellsize+"'></canvas>" + "</td>";
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
    $(boardDiv).html(tabelka);
  }

  var redrawBoard = function() { // Wypełnia gotową tabelke. Potrzebuje danych o numerkach
    for(i = 0; i < boardWidth; i++) {
      for(j = 0; j < boardHeight; j++) {
        foundfield = field(i,j)
        can = foundfield.get(0);
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
        can.beginPath();
        can.strokeText(i+1, center[0], center[1]);
        can.closePath();
      }
    }
  }

  // odświeżanie planszy, szybsze od redrawBoard, bo aktualizuje tylko jedno pole
  var redrawField = function(i,j) {
    var foundfield = field(i,j)
    can = foundfield.get(0)
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
  var coords = function(canvas) { return canvas['id'].split('a'); }

  var registerHandlers = function() {
    $(".cell").mouseenter(function() {
      //łączymy prev i curr
      if(dragging) { 
        prev = curr;
        curr = this;
        var c = coords(curr)
          xcur = c[0]
          ycur = c[1]
          c = coords(prev)
          xpre = c[0]
          ypre = c[1]
          // AAA SLAJD PO SKOSIE
          if(xpre == xcur-1 && ycur == ypre) { 
            fields[xpre][ypre][2] = !fields[xpre][ypre][2]; 
            fields[xcur][ycur][0] = !fields[xcur][ycur][0];
            //$("#dbg").val("wprawo ("+xpre+","+ypre+") w ("+xcur+","+ycur+") (x,y)");
          }
          if(xpre-1 == xcur && ycur == ypre) {
            fields[xpre][ypre][0] = !fields[xpre][ypre][0]; 
            fields[xcur][ycur][2] = !fields[xcur][ycur][2];
            //$("#dbg").val("wlewo ("+xpre+","+ypre+") w ("+xcur+","+ycur+") (x,y)");
          }
          if(ypre == ycur-1 && xcur == xpre) {
            fields[xpre][ypre][3] = !fields[xpre][ypre][3]; 
            fields[xcur][ycur][1] = !fields[xcur][ycur][1];
            //$("#dbg").val("wdol ("+xpre+","+ypre+") w ("+xcur+","+ycur+") (x,y)");
          }
          if(ypre-1 == ycur && xcur == xpre) {
            fields[xpre][ypre][1] = !fields[xpre][ypre][1]; 
            fields[xcur][ycur][3] = !fields[xcur][ycur][3];
            //$("#dbg").val("wgore ("+xpre+","+ypre+") w ("+xcur+","+ycur+") (x,y)");
          }
          redrawField(xpre, ypre);
          redrawField(xcur, ycur);
        }
      });

      $(".cell").mousedown(function() {
        dragging = true;
        curr = this;
      });

      $(document).mouseup(function() {
        if(dragging) {
          dragging = false
          redrawBoard()
          validate()
      }});
    }
    
    this.clearConnections = function() { clearfields() }
  
    this.loadLayout = function(layoutDesc) {
      currentLayout = layoutDesc
      boardWidth = currentLayout['width']
      boardHeight = currentLayout['height']
      pairCount = currentLayout['pairCount']
      nums = eval(currentLayout['pairs'])
      createBoard()
      clearfields()
      registerHandlers()
      redrawBoard()
    }
    //createBoard()
    //clearfields()
    //registerHandlers()
  }
