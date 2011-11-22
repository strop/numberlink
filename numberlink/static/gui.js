    function toggleCover() {
      var coverWidth = $(window).width()
      var coverHeight = $(document).height()
     //$('#cover').css({'width':coverWidth,'height':coverHeight})
      $('#cover').fadeToggle('slow')
    }
    
    function toggleHalfCover() {
      var coverWidth = $(window).width()
      var coverHeight = $(document).height()
      //$('#halfcover').css({'width':coverWidth,'height':coverHeight})
      //$('#halfcover').fadeToggle('slow')
    }
    
    function revealBoard() {
      if($('#cover').is(':visible')) toggleCover()
      if($('#halfcover').is(':visible')) toggleHalfCover()
    }
    
    function toggleDialog(id, inittab) {
      $('#' + id).toggle('fast')
      if(typeof inittab !== 'undefined') $('#' + inittab).show()
    }
    
    function toggleLoginDialog() { toggleDialog('loginDialog', 'loginForm') }
    
    function toggleMenuDialog() { toggleDialog('menuDialog', 'home') }
    
    function toggleInfoDialog(msg) { 
      $('#lblInfo').html(msg)
      toggleDialog('infoDialog') 
    }
    
    function togglePlayerInfoDialog(playername) {
      if(typeof playername !== 'undefined') {
        AJAXget('/ws/playerinfo/'+playername+'?user=' + env.getUser() + '&pass=' + env.getPass(), function(response){
          if(response == 'INVAL<br>Player does not exist') {
            $('#playerInfoDialog > #lblPlayerName').html('Błąd pobierania danych')
          } else {
            player = evalJSON(response)
            $('#playerInfoDialog > #lblPlayerName').html(player['name'])
            $('#playerInfoDialog > #lblPlayerSolved').html('Rozwiązał '+player['solved']+' na '+player['attempted'])
            $('#playerInfoDialog > #lblPlayerRegistered').html('Zarejestrowany '+new Date(player['registered']*1000))
          }
        })
      }
      $.History.go('#playerInfo')
    }

    function toggleChallengeInfoDialog(chl) {
      AJAXget('/ws/challengeinfo/'+chl, function(response){
          if(response == 'INVALID') {
            $('#lblChallengeName').html('Błąd pobierania danych')
          } else {
            var ch = evalJSON(response)
            $('#lblChallengeName').html(ch['name'] + ((fromTimestamp(ch['finish']) < new Date()) ? " ZAKOŃCZONY" : ""))
            $('#lblChallengeStart').html("Start:<br>" + formatDate(fromTimestamp(ch['start'])))
            $('#lblChallengeFinish').html("Koniec:<br> " + formatDate(fromTimestamp(ch['finish'])))
            var layouts = '<table>'
            loginfo(ch.layouts)
            for(var i in ch.layouts) {
              $.ajax({
                  url: '/ws/layoutinfo/'+ch.layouts[i],
                  success: function(result) {
                    l = evalJSON(result)
                    layouts += '<tr><td><a href="javascript:getLayout('+ch.layouts[i]+', \'#challengeInfo\')">Plansza nr '+ch.layouts[i]+'</a></td><td>' + l['author'] +'</td><td>Rozw:'+ l['solved'] + '</td></tr>'
                  },
                  async:   false
              });
            }
            layouts += '</table>'
            $('#lblChallengeLayouts').html(layouts)
            var players = '<table>'
            if(fromTimestamp(ch['finish']) > new Date()) { // trwa => wyświetlamy listę użytkowników
              //players += '<tr><td></td></tr>'
              for(var i in ch.ranks) {
                  players += '<tr><td>' + ch.ranks[i]['username'] + '</td></tr>'
              }
            } else { // skończył się => wyświetlamy ranking
              players += '<tr><td>Miejsce</td><td>Nazwa</td><td>Rozwiązał</td></tr>'
              for(var i in ch.ranks) {
                  players += '<tr><td>'+ (parseInt(i)+1) +'</td><td>' + ch.ranks[i]['username'] + '</td><td>'+ch.ranks[i]['solved']+'</td></tr>'
              }
            }
            players += '</table>'
            $('#lblChallengePlayers').html(players)
            $.History.go('#challengeInfo')
          }
        })
    }
    
    function showBoard() {
      $('#editor').hide()
      $('#board').show()
    }
