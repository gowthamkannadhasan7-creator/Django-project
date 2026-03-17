"""
maze_game/urls.py — URL patterns for the maze_game app.

URL patterns:
  /              → home view
  /game/         → game view (accepts ?difficulty=easy|medium|hard)
  /save-score/   → save_score API (POST)
  /leaderboard/  → leaderboard API (GET)
"""

from django.urls import path
from . import views

# app_name lets us use {% url 'maze_game:game' %} in templates
app_name = 'maze_game'

urlpatterns = [
    # Home / landing page
    path('', views.home, name='home'),

    # Game page — maze is rendered here
    path('game/', views.game, name='game'),

    # API: save a player's score after winning
    path('save-score/', views.save_score, name='save_score'),

    # API: fetch top-10 scores (JSON)
    path('leaderboard/', views.leaderboard, name='leaderboard'),
]
