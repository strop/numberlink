  function horn(msg) {window.alert(msg);}
  
  debug = true
  
  function loginfo(msg) {
    if(typeof debug !== 'undefined')
      console.log(msg)
  }

  function fromTimestamp(ts) {
    return new Date(ts*1000)
  }
  
  function toTimestamp(date) {
    return Math.floor(date.getTime()/1000)
  }
  
  function formatDate(data, opt) {
    return data.getDate()+'.'+leadZeros(data.getMonth()+1, 2)+'.'+data.getFullYear()+' <br> '+leadZeros(data.getHours(),2)+':'+leadZeros(data.getMinutes(),2)
  }

  function pr(msg) {document.writeln(msg.toString() + "\n");}

  function countIf(arr) {
    howMany = 0;
    for(x in arr) if(arr[x]) howMany++;
    return howMany;
  }
  
  function leadZeros(num, width) {
    var len = num.toString().length
    var result = ""
    if(len < width)
      for(i=1; i<=width-len;++i) result += "0"
    result += num.toString()
    return result
  } 
  
  function secsToString(secs) {
    //loginfo(secs)
    var days = Math.floor(secs / (3600*24))
    secs %= 3600*24
    var hours = Math.floor(secs / 3600)
    secs %= 3600
    var minutes = Math.floor(secs / 60)
    secs %= 60
    var seconds = secs
    res = ""
    var nonzero = false
    if(days!=0) {
      res+=days+' dni'
      nonzero = true
    }
    if(hours!=0) {
      if(nonzero) res+=' '
      else nonzero = true
      res+=hours + ' godz.'
    }
    if(minutes!=0) {
      if(nonzero) res+=' '
      else nonzero=true
      res+=minutes+' min.'
    }
    if(seconds!=0) {
      if(nonzero) res+=' '
      else nonzero=true
      res+=seconds+' s'
    }
    return res//Math.floor(secs/60) + ":" + (secs%60);
  }
  
  function evalJSON(jsonstring) {
    ret = eval("(" + jsonstring + ")")
    loginfo(ret)
    return ret
  }
  
  function fatal(msg) {
    loginfo('FATAL: ' + msg)
  }
