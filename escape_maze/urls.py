"""
escape_maze/urls.py — Project-level URL configuration.

All URLs from the maze_game app are included here.
The admin panel is available at /admin/.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin panel — visit /admin/ in your browser
    path('admin/', admin.site.urls),

    # Include all URLs from the maze_game app (home, game, scores, etc.)
    path('', include('maze_game.urls')),
]
