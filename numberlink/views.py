# Create your views here.
from django.shortcuts import render_to_response
from django.db.models import Avg, Count, Max, Min, Q
from django.http import HttpResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from numberlink.models import *
from django.contrib.auth.models import User
from django.contrib import auth
from django.core import serializers
import simplejson as json
import datetime
import time
import random
import logging

random.seed()
log = logging.getLogger(__name__)

def auth_required(f):
    def wrap(request, *args, **kwargs):
        if not request.user.is_authenticated():
            return HttpResponse('BADAUTH')
        return f(request, *args, **kwargs)
    return wrap

def timestamp(dateobject):
    return "%.0f"%time.mktime(dateobject.timetuple())

def validRequest(requestObject, keys):
    for i in keys:
        if not requestObject.has_key(i):
            return False
    return True;

def validPOST(request, keys):
    return validRequest(request.POST, keys)

def validGET(request, keys):
    return validRequest(request.GET, keys)

# mamy globalny sposb na logowanie, to zwraca usera lub cos a'la null
def authenticate(request):
    try:
        if not validGET(request, ('user', 'pass')):
            raise Exception()
        user = User.objects.get(username=request.GET['user'])
        if user.check_password(request.GET['pass']):
            return user
        else:
            raise Exception()
    except Exception:
        return None

# LOGIN / REJESTRACJA
def login(request):
    print "lol"
    if not validGET(request, ['user', 'pass']):
        return HttpResponse('INVAL')
    user = auth.authenticate(username=request.GET['user'], password=request.GET['pass'])
    if user is not None and user.is_active:
        auth.login(request, user)
        return HttpResponse('OK')
    else:
        return HttpResponse('BADAUTH')

@auth_required
def logout(request):
    auth.logout(request)
    return HttpResponse('OK')

@auth_required
def getLoggedUser(request):
    return HttpResponse(request.user.username)

def newPlayer(request):
    if validGET(request, ('user', 'pass')):
        if isNameOccupied(username=request.GET['user']) or request.GET['user'] == '':
            return HttpResponse('ERR: OCCUPIED')
        else:
            u = User.objects.create_user(request.GET['user'], 'dummy@l.pl', password=request.GET['pass'])
            u.save()
            u = auth.authenticate(username=request.GET['user'], password=request.GET['pass'])
            auth.login(request, u)
            return HttpResponse('OK')
    else:
        return HttpResponse('INVALID PARAMETERS')

def isNameOccupied(username):
    try:
        User.objects.get(username=username)
    except User.DoesNotExist:
        return False;
    return True;
  
def inuse(request, player_name):
    if isNameOccupied(username=player_name) or player_name == '':
        return HttpResponse('OCCUPIED')
    else:
        return HttpResponse('FREE')


# PLAYERZY
def playerInfo(request, player_name):
    """name, ile rozwiazal, do ilu podchodzil, kiedy zarejestrowany"""
    try:
        user = User.objects.get(username=player_name)
    except User.DoesNotExist:
        return HttpResponse('INVAL<br>Player does not exist')
    response = json.dumps({'name' : user.username,
                           'solved' : Attempt.objects.filter(user=user).exclude(duration=0).count(),
                           'attempted' : Attempt.objects.filter(user=user).count(),
                           'registered' : timestamp(user.date_joined)}, sort_keys=True, indent=4)
    return HttpResponse(response)

def ranking(request):
    """name, ile rozwiazal, posortowane"""
    query = User.objects.exclude(username="Numberlink").exclude(username="root").filter(attempt__duration__gt=0)
    query = query.annotate(solved=Count('attempt'))
    query = query.order_by('-solved')
    jsondict = {}
    ilu = query.count()
    for i in range(min(query.count(), 20)):
        jsondict[str(i)] = {'name': query[i].username, 'solved': query[i].solved }
    # dodajemy tych, co nic nie rozwiazali
    query = User.objects.exclude(attempt__duration__gt=0)
    for i in range(query.count()):
        jsondict[str(i+ilu)] = {'name' : query[i].username, 'solved' : 0}
    #ilu += query.count()
    # dodajemy tych, co nic nie zaczeli rozwiazywac
    #query = Player.objects.annotate(zero=Count('attempt')).filter(zero=0)
    #for i in range(query.count()):
    #    jsondict[str(i+ilu)] = {'name' : query[i].name, 'solved' : 0}
    response = json.dumps(jsondict)
    return HttpResponse(response)
    
def recentlyRegistered(request):
    query = User.objects.order_by('-registeredDate')
    jsondict={}
    for i in range(min(query.count(), 20)):
        jsondict[str(i)] = {'name': query[i].username, 'registered': timestamp(query[i].date_joined) }
    response = json.dumps(jsondict)
    return HttpResponse(response)

# PLANSZE
@auth_required
def getLayout(request, layout_id):
    """ zwracamy jsona z:
    width
    height
    pairCount
    wspolrzedneNumerkow
    id
    poczatekRozwiazywania """
    user = request.user
    l = Layout.objects.get(id=layout_id)
    chls = Challenge.objects.filter(users=user)
    for chl in chls:
        if l in chl.layouts.all() and chl.startDate > datetime.datetime.now():
            return HttpResponse('NOTALLOWED')
    try:
        a = Attempt.objects.get(user__username=user, layout=l)
    except Attempt.DoesNotExist:
        a = Attempt(user=user, layout=l, startDate=datetime.datetime.now(), duration=0)
        a.save()
    response = json.dumps({'width' : l.width,
                           'height' : l.height,
                           'id' : l.id,
                           'pairCount': l.pairCount,
                           'started' : timestamp(a.startDate),
                           'duration' : a.duration,
                           'pairs' : l.pairs, })
    return HttpResponse(response)


def getRandomLayout(request):
    layouts = Layout.objects.all()
    laycount = layouts.count()
    picked = random.randint(0,laycount-1)
    return getLayout(request, layouts[picked].id)

@auth_required
def layoutList(request):
    """id, autor, solved, attempted, czyjarozwiazalem, best time?, data dodania"""
    user = request.user
    lays = Layout.objects.order_by('addedDate')
    jsondict = {}
    for i in range(0,lays.count()):
        l = lays[i]
        jsondict[str(i)] = {"id" : l.id,
                            "author" : l.author.username,
                            "added" : timestamp(l.addedDate),
                            "solved" : Attempt.objects.filter(layout=l,duration__gt=0).count(),
                            "attempted" : Attempt.objects.filter(layout=l).count(),
                            "besttime" : Attempt.objects.filter(layout=l, duration__gt=0).aggregate(Min('duration'))['duration__min']}
        try:
            requesterAttempt = Attempt.objects.get(layout=l, user=user)
            jsondict[str(i)]['started'] = timestamp(requesterAttempt.startDate)
            jsondict[str(i)]['duration'] = requesterAttempt.duration
        except Attempt.DoesNotExist:
            jsondict[str(i)]['started'] = 0
            jsondict[str(i)]['duration'] = 0
    return HttpResponse(json.dumps(jsondict))

@auth_required
def userLayoutList(request):
    """id, autor, solved, attempted, czyjarozwiazalem, best time?, data dodania"""
    user = request.user
    numberlinkUser = User.objects.get(username="Numberlink")
    lays = Layout.objects.exclude(author=numberlinkUser).order_by('addedDate')
    jsondict = {}
    for i in range(0,lays.count()):
        l = lays[i]
        jsondict[str(i)] = {"id" : l.id,
                            "author" : l.author.username,
                            "added" : timestamp(l.addedDate),
                            "solved" : Attempt.objects.filter(layout=l,duration__gt=0).count(),
                            "attempted" : Attempt.objects.filter(layout=l).count(),
                            "besttime" : Attempt.objects.filter(layout=l, duration__gt=0).aggregate(Min('duration'))['duration__min']}
        try:
            requesterAttempt = Attempt.objects.get(layout=l, user=user)
            jsondict[str(i)]['started'] = timestamp(requesterAttempt.startDate)
            jsondict[str(i)]['duration'] = requesterAttempt.duration
        except Attempt.DoesNotExist:
            jsondict[str(i)]['started'] = 0
            jsondict[str(i)]['duration'] = 0
    return HttpResponse(json.dumps(jsondict))

@auth_required
def officialLayoutList(request):
    """id, autor, solved, attempted, czyjarozwiazalem, best time?, data dodania"""
    user = request.user
    numberlinkUser = User.objects.get(username="Numberlink")
    lays = Layout.objects.filter(author=numberlinkUser).order_by('addedDate')
    jsondict = {}
    for i in range(0,lays.count()):
        l = lays[i]
        jsondict[str(i)] = {"id" : l.id,
                            "author" : l.author.username,
                            "added" : timestamp(l.addedDate),
                            "solved" : Attempt.objects.filter(layout=l,duration__gt=0).count(),
                            "attempted" : Attempt.objects.filter(layout=l).count(),
                            "besttime" : Attempt.objects.filter(layout=l, duration__gt=0).aggregate(Min('duration'))['duration__min']}
        try:
            requesterAttempt = Attempt.objects.get(layout=l, user=user)
            jsondict[str(i)]['started'] = timestamp(requesterAttempt.startDate)
            jsondict[str(i)]['duration'] = requesterAttempt.duration
        except Attempt.DoesNotExist:
            jsondict[str(i)]['started'] = 0
            jsondict[str(i)]['duration'] = 0
    return HttpResponse(json.dumps(jsondict))

def layoutInfo(request, layout_id):
    user = request.user
    try:
        layout = Layout.objects.get(id=layout_id)
        response = json.dumps({'author': layout.author.username,
                               'added': timestamp(layout.addedDate),
                               'solved': Attempt.objects.filter(layout__id=layout_id).exclude(duration=0).count(),
                               "attempted" : Attempt.objects.filter(layout__id=layout_id).count(),
                               'besttime': Attempt.objects.filter(layout=layout, duration__gt=0).aggregate(Min('duration'))['duration__min']})
        return HttpResponse(response)
    except Layout.DoesNotExist:
        return HttpResponse('INVALID PARAMETERS')

@auth_required
def addLayout(request):
            user = request.user
    #try:
        #if validGET(request, ('layoutdesc')):
            newdesc = json.loads(str(request.GET['layoutdesc']))
            #oj przyda sie walidacja
            new = Layout(author=user,
                         addedDate=datetime.datetime.now(),
                         width=newdesc['width'],
                         height=newdesc['height'],
                         pairCount=newdesc['pairCount'],
                         pairs=str(newdesc['pairs']).replace("'",'').replace("u",''))
            new.save()
            return HttpResponse('OK')
        #else:
            raise Exception()
    #except Exception:
    #        return HttpResponse('INVALID')

# ATTEMPTY
def countIf(arr):
    return sum((lambda x: x==True)(x) for x in arr)

def checkSolution(solution, layout):
    #sprawdzenie poprawnosci formatu najpierw TU
    proper = 0
    log.info(layout.pairs)
    nums = json.loads(layout.pairs)
    log.info(nums[0])
    for i in range(0,layout.pairCount):
        xpos = nums[i][0]
        ypos = nums[i][1]
        finishx = nums[i][2]
        finishy = nums[i][3]
        cameFrom = 4
        while True:
            neigh = solution[xpos][ypos];
            if cameFrom == 4:
                if countIf(neigh) != 1:
                    return False
            elif countIf(neigh) != 2:
                return False
            if neigh[0] and cameFrom != 0:
                xpos-=1
                cameFrom = 2
            elif neigh[1] and cameFrom != 1:
                ypos-=1
                cameFrom = 3
            elif neigh[2] and cameFrom != 2:
                xpos+=1
                cameFrom = 0
            elif neigh[3] and cameFrom != 3:
                ypos+=1
                cameFrom = 1
            if xpos == finishx and ypos == finishy:
                break
        if (xpos == finishx and ypos == finishy) and countIf(solution[xpos][ypos]) == 1:
            proper+=1
            log.info(str(i)+'mam')
    log.info(str(proper) + ' ' + str(layout.pairCount))
    if proper == layout.pairCount:
        return True
    else:
        return False

@csrf_exempt
@auth_required
def finish(request):
    user = request.user
    if not validPOST(request, ('solution', 'layout_id')):
        raise Exception('params')
    else:
        query = Attempt.objects.filter(user__username=user.username, layout__id=request.POST['layout_id'])
        if query.count() == 0:
            raise Exception()
        else:
            if query[0].duration != 0:
                return HttpResponse('ALREADY SOLVED')
                #raise Exception()
        a = query[0]
        delta = (datetime.datetime.now() - a.startDate).seconds
        solution = json.loads(str(request.POST['solution']))
        if checkSolution(solution, Layout.objects.get(id=a.layout.id)):
            a.duration = delta
            a.finishDate = a.startDate + datetime.timedelta(seconds=delta)
            a.save()
            return HttpResponse('OK')
        else:
            return HttpResponse('WRONG')
        return HttpResponse(solution)

# CHALLENGES
@auth_required
def initChallenge(request):
    try:
        if not validGET(request, ('start', 'finish', 'layouts', 'name')):
            raise Exception('INVAL PARAMS')
        user = request.user
        layouts = json.loads(request.GET['layouts'])
        ch = Challenge(creator=user, createDate=datetime.datetime.now(), #name=request.GET['name'], #escaping?
                       startDate=datetime.datetime.fromtimestamp(int(request.GET['start'])),
                       finishDate=datetime.datetime.fromtimestamp(int(request.GET['finish'])), name=request.GET['name'])
        ch.save()
        for i in layouts:
            ch.layouts.add(Layout.objects.get(id=i))
        return HttpResponse('OK')
    except Exception:
        return HttpResponse('INVALID')

def challengeAllowed(user, chl_id):
     if len(set([x.layout for x in Attempt.objects.filter(user=user).all()]) & set(Challenge.objects.get(id=chl_id).layouts.all())) > 0:
         return False
     if len(set(Layout.objects.filter(author=user).all()) & set(Challenge.objects.get(id=chl_id).layouts.all())) > 0:
         return False
     if Challenge.objects.get(id=chl_id).finishDate < datetime.datetime.now():
         return False
     return True

@auth_required
def challengeList(request):
    user = request.user
    chls = Challenge.objects.order_by('startDate')
    jsondict = {}
    for i in range(0,chls.count()):
        ch = chls[i]
        jsondict[str(i)] = {"id" : ch.id,
                            "author" : ch.creator.username,
                            "name" : ch.name,
                            "created" : timestamp(ch.createDate),
                            "start" : timestamp(ch.startDate),
                            "finish" : timestamp(ch.finishDate),
                            "layoutcount" : ch.layouts.all().count(),
                            "usercount" : ch.users.all().count(),
                            "allowed" : challengeAllowed(user, ch.id)}
    return HttpResponse(json.dumps(jsondict))
    
@auth_required
def myChallenges(request):
    user = request.user
    chls = Challenge.objects.order_by('-startDate').filter(users=user)
    jsondict = {}
    for i in range(0,chls.count()):
        ch = chls[i]
        jsondict[str(i)] = {"id" : ch.id,
                            "author" : ch.creator.username,
                            "name" : ch.name,
                            "created" : timestamp(ch.createDate),
                            "start" : timestamp(ch.startDate),
                            "finish" : timestamp(ch.finishDate),
                            "layoutcount" : ch.layouts.all().count(),
                            "usercount" : ch.users.all().count()}
        if ch.finishDate < datetime.datetime.now():
            # dodajemy info o zajetym miejscu
            scoreboard = User.objects.filter(id__in=[x.id for x in ch.users.all()]).filter(Q(attempt__layout__in=ch.layouts.all()) & Q(attempt__startDate__gt=ch.startDate) & Q(attempt__finishDate__lt=ch.finishDate)).annotate(ile=Count('username')).order_by('-ile')
            for j in range(0, scoreboard.count()):
                if scoreboard[j].username == user.username:
                    jsondict[str(i)]['rank'] = j+1
                    break
            #User.objects.filter(id__in=[u.id for u in ch.users.all()]).annotate()
    return HttpResponse(json.dumps(jsondict))

@auth_required
def joinChallenge(request, challenge_id):
    #try:
        user = request.user
        if not challengeAllowed(user, challenge_id):
            return HttpResponse("NOTALLOWED")
        Challenge.objects.get(id=challenge_id).users.add(user)
        return HttpResponse('OK')
    #except Exception:
        return HttpResponse('INVALID')

@auth_required
def challengeInfo(request, challenge_id):
    #try:
        ch = Challenge.objects.get(id=challenge_id)
        jsondict = {"id" : ch.id,
                            "author" : ch.creator.username,
                            "name" : ch.name,
                            "created" : timestamp(ch.createDate),
                            "start" : timestamp(ch.startDate),
                            "finish" : timestamp(ch.finishDate),
                            "layoutcount" : ch.layouts.all().count(),
                            "usercount" : ch.layouts.all().count(),
                            "layouts" : [l.id for l in ch.layouts.all()]}
        if ch.finishDate < datetime.datetime.now():
            ranks = []
            scoreboard = User.objects.filter(id__in=[x.id for x in ch.users.all()]).filter(Q(attempt__layout__in=ch.layouts.all()) & Q(attempt__startDate__gt=ch.startDate) & Q(attempt__finishDate__lt=ch.finishDate)).annotate(ile=Count('username')).order_by('-ile')
            for user in scoreboard:
                ranks.append({"username": user.username, "solved": user.ile})
            for user in ch.users.all():
                if not user.username in [x["username"] for x in ranks]:
                    ranks.append({"username": user.username, "solved": 0})
            jsondict['ranks'] = ranks
        else:
            jsondict['ranks'] = [{"username": user.username} for user in ch.users.all()]
        return HttpResponse(json.dumps(jsondict))
    #except Exception:
    #    return HttpResponse('INVALID')

def game(request):
    return HttpResponse('game main view')
    
def debug(request):
    data = serializers.serialize("json", User.objects.all(), fields=('name', 'password'))
    return HttpResponse(data)
