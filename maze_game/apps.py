"""
maze_game/apps.py — App configuration for maze_game.
"""

from django.apps import AppConfig


class MazeGameConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'maze_game'
    verbose_name = 'Escape Maze Game'
