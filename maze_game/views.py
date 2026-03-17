"""
maze_game/views.py — View functions for the Escape Maze game.

Views:
  home()        → renders the landing / home page
  game()        → renders the live game page
  save_score()  → API endpoint: saves a completed game's score (POST)
  leaderboard() → API endpoint: returns top-10 scores as JSON (GET)
"""

import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Score


# ─────────────────────────────────────────────────────────────
# Home page — /
# ─────────────────────────────────────────────────────────────
def home(request):
    """
    Render the landing page.
    Shows top-5 scores for the leaderboard preview.
    """
    top_scores = Score.objects.order_by('time_seconds')[:5]  # fastest 5
    context = {
        'top_scores': top_scores,
        'page_title': 'Escape the Maze — Home',
    }
    return render(request, 'maze_game/home.html', context)


# ─────────────────────────────────────────────────────────────
# Game page — /game/
# ─────────────────────────────────────────────────────────────
def game(request):
    """
    Render the game page.
    Accepts an optional ?difficulty= query parameter (easy/medium/hard).
    Defaults to 'medium' if not provided.
    """
    # Read difficulty from URL query string, default = medium
    difficulty = request.GET.get('difficulty', 'medium')

    # Validate — only accept known values
    if difficulty not in ('easy', 'medium', 'hard'):
        difficulty = 'medium'

    # Grid size per difficulty
    size_map = {
        'easy':   10,
        'medium': 15,
        'hard':   20,
    }
    grid_size = size_map[difficulty]

    context = {
        'difficulty': difficulty,
        'grid_size':  grid_size,
        'page_title': f'Escape the Maze — {difficulty.capitalize()}',
    }
    return render(request, 'maze_game/game.html', context)


# ─────────────────────────────────────────────────────────────
# Save score endpoint — /save-score/   (POST only)
# ─────────────────────────────────────────────────────────────
@csrf_exempt          # Allow JS fetch() without a CSRF token
@require_POST         # Only POST requests allowed; others → 405
def save_score(request):
    """
    Accept a JSON body from the frontend when the player wins:
      { "player_name": "...", "time_seconds": 42.5, "difficulty": "medium" }
    Save it to the database and return the new rank.
    """
    try:
        data = json.loads(request.body)

        player_name  = str(data.get('player_name', 'Anonymous'))[:50]
        time_seconds = float(data['time_seconds'])
        difficulty   = data.get('difficulty', 'medium')

        if difficulty not in ('easy', 'medium', 'hard'):
            difficulty = 'medium'

        # Create the new score record
        score = Score.objects.create(
            player_name=player_name,
            time_seconds=time_seconds,
            difficulty=difficulty,
        )

        # Calculate rank (how many faster scores exist + 1)
        rank = Score.objects.filter(
            difficulty=difficulty,
            time_seconds__lt=time_seconds,
        ).count() + 1

        return JsonResponse({
            'status': 'saved',
            'id':     score.pk,
            'rank':   rank,
        })

    except (KeyError, ValueError, json.JSONDecodeError) as exc:
        return JsonResponse({'status': 'error', 'message': str(exc)}, status=400)


# ─────────────────────────────────────────────────────────────
# Leaderboard endpoint — /leaderboard/   (GET)
# ─────────────────────────────────────────────────────────────
def leaderboard(request):
    """
    Return the top 10 scores for a given difficulty as JSON.
    Usage: GET /leaderboard/?difficulty=medium
    """
    difficulty = request.GET.get('difficulty', 'medium')
    if difficulty not in ('easy', 'medium', 'hard'):
        difficulty = 'medium'

    scores = Score.objects.filter(difficulty=difficulty).order_by('time_seconds')[:10]

    data = [
        {
            'rank':         idx + 1,
            'player_name':  s.player_name,
            'time_seconds': round(s.time_seconds, 2),
            'difficulty':   s.difficulty,
            'completed_at': s.completed_at.strftime('%Y-%m-%d %H:%M'),
        }
        for idx, s in enumerate(scores)
    ]

    return JsonResponse({'scores': data})
