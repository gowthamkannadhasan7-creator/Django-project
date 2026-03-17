"""
maze_game/admin.py — Register models with the Django Admin panel.

After running migrations you can visit /admin/ to see all scores.
Create a superuser first with:  python manage.py createsuperuser
"""

from django.contrib import admin
from .models import Score


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    """
    Customise how Score entries appear in the Django Admin.
    """

    # Columns shown in the list view
    list_display = ('player_name', 'time_seconds', 'difficulty', 'completed_at')

    # Sidebar filter options
    list_filter = ('difficulty', 'completed_at')

    # Search box — search by player name
    search_fields = ('player_name',)

    # Default ordering in admin (fastest first)
    ordering = ('time_seconds',)

    # Make completed_at read-only (auto-set on save)
    readonly_fields = ('completed_at',)
