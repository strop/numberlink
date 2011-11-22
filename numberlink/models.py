from django.db import models
from django.contrib.auth.models import User

# Create your models here.
"""
class Player(models.Model):
    #id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=20, unique=True)
    password = models.CharField(max_length=20)
    registeredDate = models.DateTimeField('date registered')
    def __unicode__(self):
        return self.name"""
    
class Layout(models.Model):
   # id = models.IntegerField(primary_key=True)
    width = models.IntegerField()
    height = models.IntegerField()
    pairCount = models.IntegerField()
    pairs = models.CharField(max_length=2500)
    addedDate = models.DateTimeField('date added')
    author = models.ForeignKey(User)
    def __unicode__(self):
        return 'Layout_id_'+str(self.id)+'_aut:'+self.author.username
    
class Attempt(models.Model):
    user = models.ForeignKey(User)
    layout = models.ForeignKey(Layout)
    startDate = models.DateTimeField('date started')
    finishDate = models.DateTimeField('date finished', null=True, blank=True)
    duration = models.IntegerField()
    def __unicode__(self):
        info = self.user.username + ':' + str(self.layout.id) +'-'
        if self.duration != 0:
            info += 'solv'
        else:
            info+='not'
        return info
    class Meta:
        unique_together = ('user', 'layout')

class Challenge(models.Model):
    createDate = models.DateTimeField()
    name = models.CharField(max_length=100)
    startDate = models.DateTimeField()
    finishDate = models.DateTimeField()
    creator = models.ForeignKey(User, related_name="creator")
    users = models.ManyToManyField(User)
    layouts = models.ManyToManyField(Layout)
    allow_users_who_solved = models.BooleanField()