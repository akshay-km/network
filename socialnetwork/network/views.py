from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.core.paginator import Paginator, InvalidPage

import json

from .models import User, Post, Follow, Like


def index(request):
    return render(request, "network/index.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


# @login_required
def get_posts(request, page):
    if page == "allposts":
        posts = Post.objects.all()
    if page =="following":
        following = request.user.followings.all()
        posts = Post.objects.filter(poster__in = [f.following for f in following])
    posts = posts.order_by('-time_stamp')
    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    
    try: 
        page_obj = paginator.page(page_number)
    except InvalidPage:
        return JsonResponse({"error":" Requested page is Invalid!"}, status=400)
      
    post_list= [{
        "id": post.id,
        "poster": post.poster.username,
        "poster_id" : post.poster.id,
        "content": post.content,
        "timestamp": post.time_stamp.strftime("%b %d %Y, %I:%M %p"),
        "is_liked": is_liked(post,request.user),       
        "likes" : get_likes_count(post),
        "enable_edit" : enable_edit(post, request.user),
        } for post in page_obj.object_list]

    return JsonResponse({
        "name":page,
        "num_pages" : paginator.num_pages,
        "number": int(page_number),
        "has_next" : page_obj.has_next(),
        "has_previous" : page_obj.has_previous(),
        "posts" : post_list
        }, safe=False)

def get_likes_count(post):
    return len(post.likes.all())

def enable_edit(post, user):
    return True if post.poster == user else False

def is_liked(post, user):
    try: 
        Like.objects.get(Q(post=post) & Q(liker=user))
        return True 
    except: 
        return False

def get_profile(request, key):
    try: 
        profile = User.objects.get(pk=key)
    except User.DoesNotExist:
        return JsonResponse({"error":"User does not exist!"}, status=400)
    
    posts = Post.objects.filter(poster = profile).order_by('-time_stamp')
    
    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')

    try: 
        page_obj = paginator.page(page_number)
    except InvalidPage:
        return JsonResponse({"error":" Requested page is Invalid!"}, status=400)
    
    profile_posts = [ {
        "id": post.id,
        "poster": post.poster.username,
        "poster_id" : post.poster.id,
        "content": post.content,
        "timestamp": post.time_stamp.strftime("%b %d %Y, %I:%M %p"),
        "likes" : get_likes_count(post),
        "is_liked": is_liked(post,request.user),
        "enable_edit" : enable_edit(post, request.user),
        } for post in page_obj.object_list]

    profile_page = {
        "name":"profile",
        "num_pages" : paginator.num_pages,
        "number": int(page_number),
        "has_next" : page_obj.has_next(),
        "has_previous" : page_obj.has_previous(),
        "posts" : profile_posts
        }
    
    return JsonResponse({
        "id":profile.id,
        "username": profile.username,
        "followers_count" : len(profile.followers.all()),
        "followings_count": len(profile.followings.all()),
        "follow_button": show_follow_button(request.user, profile),
        "is_following": is_following(request.user, profile),
        "page": profile_page,
    }, safe=False)


def show_follow_button(user, profile):
    return True if ((user != profile) and user.is_authenticated) else  False


def is_following( user, profile): 
    try : 
        Follow.objects.get(follower = user, following = profile)
        return True
    except : 
        return False


@login_required
def create_post(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    
    data = json.loads(request.body)
    post_content = data.get("content","")
    if not post_content:
        return JsonResponse({"error": "Post content cannot be empty."}, status=400)
    
    new_post = Post(poster= request.user, content =post_content)
    new_post.save()
    return JsonResponse({"message": "New post submitted successfully."}, status=201)

@login_required
def edit_post(request, key):
    if request.method != "PUT":
        return JsonResponse({"error" : "PUT request required."}, status = 400)

    post = Post.objects.get(pk=key)  
    if request.user != post.poster : 
        return JsonResponse({"error": "Post can only be edit by the creator of the post"},status = 400)
    
    data = json.loads(request.body)
    content = data.get("content","")
   # print(f"in EDIT , content : {content}")
    if not content: 
        return JsonResponse({"error": " Post content cannot be empty."}, status = 400)

    post.content = content
    post.save()
    return JsonResponse({"message": " Post updated successfully."}, status = 201)

@login_required
def follow(request, key):
    
    following = User.objects.get(pk=key)
    try : 
        follow = Follow.objects.get(follower = request.user, following = following)
    except Follow.DoesNotExist: 
        follow = None
    if not follow:
        new_follow = Follow( follower = request.user , following = following)
        new_follow.save()
        return JsonResponse({"message": "Follow success."}, status = 201)
    else: 
        follow.delete()
        return JsonResponse({"message": "Unfollow success."}, status = 201)
    
@login_required 
def like(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    data = json.loads(request.body)
    #print(f"in LIKE , data : {data}")
    key = int(data.get("post_id",""))
    post = Post.objects.get(pk=key)
    try: 
        like = Like.objects.get(post = post, liker = request.user)
    except Like.DoesNotExist : 
        like = None
    if not like: 
        new_like = Like(post = post, liker = request.user)
        new_like.save()
        return JsonResponse({"message": "Like success."}, status = 201)
    else:
        like.delete()
        return JsonResponse({"message": "Unlike success."}, status = 201)







