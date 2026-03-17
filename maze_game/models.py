"""
maze_game/models.py — Database models for the Escape Maze game.

The Score model stores each player's result:
  - player_name : who played
  - time_seconds: how fast they solved the maze
  - difficulty   : easy / medium / hard
  - completed_at : when they finished
"""

from django.db import models


class Score(models.Model):
    """
    Stores one completed game result.
    Each row = one player's successful escape from the maze.
    """

    # Difficulty choices — used in the dropdown on the game page
    DIFFICULTY_CHOICES = [
        ('easy',   'Easy'),
        ('medium', 'Medium'),
        ('hard',   'Hard'),
    ]

    # Player's chosen display name (up to 50 characters)
    player_name = models.CharField(
        max_length=50,
        default='Anonymous',
        verbose_name='Player Name',
    )

    # Time in seconds it took to solve the maze (decimal so we keep precision)
    time_seconds = models.FloatField(
        verbose_name='Time (seconds)',
    )

    # Which difficulty was selected when the game was played
    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='medium',
        verbose_name='Difficulty',
    )

    # Automatically set to the moment the record is created
    completed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Completed At',
    )

    class Meta:
        # Show newest scores first in admin / queries
        ordering = ['time_seconds']
        verbose_name = 'Score'
        verbose_name_plural = 'Scores'

    def __str__(self):
        """Human-readable string for this score (shown in admin list)."""
        return f"{self.player_name} — {self.time_seconds:.1f}s ({self.difficulty})"
