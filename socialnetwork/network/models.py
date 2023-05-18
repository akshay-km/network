from django.contrib.auth.models import AbstractUser
from django.db import models
# from django.utils.timezone import now


class User(AbstractUser):
    pass

    def __str__(self):
        return f"{self.username}"
        

class Post(models.Model):
    poster = models.ForeignKey( User, on_delete=models.CASCADE, related_name="posts")
    content = models.CharField(max_length=500)  
    time_stamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post:{self.content} Poster: {self.poster}"

class Follow(models.Model):
    follower = models.ForeignKey( User, on_delete=models.CASCADE, related_name="followings")
    following = models.ForeignKey( User, on_delete=models.CASCADE, related_name="followers")

    class Meta: 
        unique_together = ['follower','following']

    def __str__(self):
        return f"Follower:{self.follower} => Following: {self.following}"

class Like(models.Model):
    post = models.ForeignKey( Post, on_delete=models.CASCADE, related_name="likes")
    liker = models.ForeignKey( User, on_delete=models.CASCADE)

    class Meta: 
        unique_together = ['post','liker']

    def __str__(self):
        return f"Post:{self.post} Liker: {self.liker}"