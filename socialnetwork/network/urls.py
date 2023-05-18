
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("posts/<str:page>", views.get_posts, name="posts"),
    path("create", views.create_post, name="create_post"),
    path("edit/<int:key>", views.edit_post , name="edit"),
    path("follow/<int:key>", views.follow, name="follow"),
    path("profile/<int:key>", views.get_profile, name="profile"),
    path("like", views.like, name="like"),
    
]
