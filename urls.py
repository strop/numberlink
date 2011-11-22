from django.conf.urls.defaults import patterns, include, url
from django.views.decorators.cache import cache_page
import numberlink.views
# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^openid/', include('django_openid_auth.urls')),
    url(r'^favicon\.ico$', 'django.views.generic.simple.redirect_to', {'url':'/s/images/numlinklogo128.png'}),
    url(r'^googleea48fa5f6880c41f\.html$', 'django.views.generic.simple.redirect_to', {'url':'/s/googleea48fa5f6880c41f.html'}),
    url(r'^admin/', include(admin.site.urls)),
    # AUTHENTICATION
    url(r'^ws/login', 'numberlink.views.login'),
    url(r'^ws/logout', 'numberlink.views.logout'),
     url(r'^ws/whoami', 'numberlink.views.getLoggedUser'),
    url(r'^ws/newplayer', 'numberlink.views.newPlayer'),
    url(r'^ws/inuse/(?P<player_name>.+)', 'numberlink.views.inuse'),
    
    # PLAYERS
    url(r'^ws/playerinfo/(?P<player_name>.+)', 'numberlink.views.playerInfo'),
    url(r'^ws/ranking', cache_page(numberlink.views.ranking, 300)),
    url(r'^ws/recentlyregistered', 'numberlink.views.recentlyRegistered'),
    
    # LAYOUTS
    url(r'^ws/getlayout/(?P<layout_id>\d+)', 'numberlink.views.getLayout'),
    url(r'^ws/getrandomlayout/', 'numberlink.views.getRandomLayout'),
    url(r'^ws/layoutlist', 'numberlink.views.layoutList'),
    url(r'^ws/officialLayoutlist', 'numberlink.views.officialLayoutList'),
    url(r'^ws/userLayoutlist', 'numberlink.views.userLayoutList'),
    url(r'^ws/layoutinfo/(?P<layout_id>\d+)', 'numberlink.views.layoutInfo'),
    url(r'^ws/addlayout/', 'numberlink.views.addLayout'),
    
    # ATTEMPTS
    url(r'^ws/finish', 'numberlink.views.finish'),
    #url(r'^ws/', 'numberlink.views.'),
    #url(r'^ws/', 'numberlink.views.'),
    
    # CHALLENGES
    url(r'^ws/initchallenge', 'numberlink.views.initChallenge'),
    url(r'^ws/challengelist', 'numberlink.views.challengeList'),
    url(r'^ws/mychallenges', 'numberlink.views.myChallenges'),
    url(r'^ws/joinchallenge/(?P<challenge_id>\d+)', 'numberlink.views.joinChallenge'),
    url(r'^ws/challengeinfo/(?P<challenge_id>\d+)', 'numberlink.views.challengeInfo'),
    #url(r'^ws/', 'numberlink.views.'),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    url(r'^s/(?P<path>.*)$', 'django.views.static.serve', {'document_root': '/home/numberlink-puzzle/www/numberlink-puzzle/numberlink/static'}),
    url(r'^dbg$', 'numberlink.views.debug'),    
    url(r'^$', 'django.views.generic.simple.redirect_to', {'url':'/s/game.htm'}),

)
