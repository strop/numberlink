    function startEditor() {
      editor.clear()
      $('#editor').show()
      $('#board').hide()
      toggleMenuDialog()
      revealBoard()
    }
    
    $.History.bind(function(state) {
      $('.tab').removeClass('activeTab')
      $('.tab:has(a[href="#'+state+'"])').addClass('activeTab')
    })
    
    function showMenuDialog() {
      $('#logo').show()
      if(!$('#menuDialog').is(':visible')) {
        $('.dialog').hide('fast')
        $('#menuDialog').show('fast')
      } else {
        $('.dialog').hide()
        $('#menuDialog').show()
      }
        $('#cover').show()
    }
    
    function showLoginDialog() {
      $('#logo').show()
      if(!$('#loginDialog').is(':visible')) {
        $('.dialog').hide('fast')
        $('#loginDialog').show('fast')
      }
      $('#cover').show()
    }
    
    $.History.bind('login', function(state) {
      $('.tabcontent').hide()
      //console.log('loghist')
      $('#loginForm').show()
      showLoginDialog()
    })
    
    $.History.bind('signin', function(state) {
      $('.tabcontent').hide()
      //console.log('reghist')
      $('#registerForm').show()
      
      showLoginDialog()
    })
    
    $.History.bind('try', function(state) {
      $('.tabcontent').hide()
      showLoginDialog()
    })
    
    $.History.bind('start', function(state) {
      $('.tabcontent').hide()
      $('#home').show()
      showMenuDialog()
    })
    
    $.History.bind('layouts', function(state) {
      $('.tabcontent').hide()
      $('#layouts').show()
      refreshLayoutList()
      showMenuDialog()
    })
    
    $.History.bind('ranking', function(state) {
      $('.tabcontent').hide()
      $('#rankings').show()
      refreshPlayerRanking()
      showMenuDialog()
    })
    
    $.History.bind('edit', function(state) {
      $('.tabcontent').hide()
      $('#createLayout').show()
      showMenuDialog()
    })
    
    $.History.bind('challenges', function(state) {
      $('.tabcontent').hide()
      $('#challenges').show()
      refreshChallengeList();
      refreshMyChallengesList();
      showMenuDialog()
    })
    
    $.History.bind('createChallenge', function(state) {
      AJAXget('/ws/layoutlist', function(response){
        if(response == 'BADAUTH') {
          
        } else
          if(response == "INVALID PARAMETERS") fatal('IVALPARAMS przy getRandom') 
          else {
            var list = evalJSON(response)
            console.log(list)
            var layoutList = '<tr class="headerRow"><td></td><td>Plansza</td><td>Rozwiązano</td><td>Rekord</td><td>Dodana</td></tr>'
            for(var i in list) {
              data = new Date(list[i]['added']*1000)
              layoutList += '<tr><td><input type="checkbox" name="chlLayouts" value="'+list[i]['id']+'"></td><td><a href=javascript:getLayout('+list[i]['id']+')>Plansza nr '+list[i]['id']+'</a><br>'+
                            '<small>Autor: <a href=javascript:togglePlayerInfoDialog("'+list[i]['author']+'")>' + list[i]['author'] + '</a><small></td>' +
                            '<td>' + list[i]['solved'] + '/' + list[i]['attempted'] + '</td>' + 
                            '<td>'+ secsToString(list[i]['besttime']) + '</td>' +
                            '<td>'+formatDate(data)+'</td></tr>'
            }
            $('#chooseLayouts').html(layoutList)
          }
      })
      $('#chlStartDate').datetimepicker()
      $('#chlFinishDate').datetimepicker()
      //timestamp = $('#startDate').datetimepicker('getDate').getTime()/1000
      $('.dialog').hide()
      $('#createChallengeDialog').show()
      //showMenuDialog()
    })
    
    $.History.bind('editor', function(state) {
      $('.dialog').hide()
      $('#cover').hide()
      $('#logo').hide()
      $('#board').hide()
      $('#editor').show()
      editor.clear()
    })
    
    $.History.bind('board', function(state) {
      $('.dialog').hide()
      $('#cover').hide()
      $('#logo').hide()
      $('#editor').hide()
      $('#board').show()
    })
    
    $.History.bind('info', function(state) {
      $('.dialog').hide()
      $('#infoDialog').show()
      $('#cover').hide()
      $('#logo').hide()
    })
    
    $.History.bind('playerInfo', function(state) {
      //$('.dialog').hide()
      $('#playerInfoDialog').show()
      $('#challengeInfoDialog').hide()
      $('#layoutBlockedDialog').hide()
      //$('#cover').hide()
      //$('#logo').hide()
    })
    
    $.History.bind('layoutBlocked', function(state) {
      //$('.dialog').hide()
      $('#playerInfoDialog').hide()
      $('#challengeInfoDialog').hide()
      $('#layoutBlockedDialog').show()
      //$('#cover').hide()
      //$('#logo').hide()
    })
    
    $.History.bind('challengeInfo', function(state) {
      $('.dialog').hide()
      $('#playerInfoDialog').hide()
      $('#layoutBlockedDialog').hide()
      $('#menuDialog').show()
      $('#cover').show()
      $('#logo').show()
      $('#challengeInfoDialog').show()
      //$('#cover').hide()
      //$('#logo').hide()
    })