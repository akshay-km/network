from django.contrib import admin
from .models import *

class PostAdmin(admin.ModelAdmin):
    list_display= ["poster","content","time_stamp"]

class FollowAdmin(admin.ModelAdmin):
    list_display = ["follower","following"]

class LikeAdmin(admin.ModelAdmin):
    list_display = ["post","liker"]

# Register your models here.
admin.site.register(User)
admin.site.register(Post, PostAdmin)
admin.site.register(Follow, FollowAdmin)
admin.site.register(Like, LikeAdmin)
