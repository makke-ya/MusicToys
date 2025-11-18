from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
import glob
import os
import random
import re

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

ALL_CHORD_FILES = sorted([
    os.path.basename(sound_file_path)
    for sound_file_path in glob.glob("./static/sounds/*.mp3")
    if re.match("^[0-9]+", os.path.basename(sound_file_path))
])

CHORD_FILES = {i: ALL_CHORD_FILES[:i+1] for i in range(1, 14)}

def pick_random(level, last_two):
    choices = CHORD_FILES[level].copy()
    if len(last_two) == 2 and last_two[0] == last_two[1] and last_two[0] in choices:
        choices.remove(last_two[0])
    print(choices)
    return random.choice(choices)

def generate_quiz(level, num_questions=10):
    quiz = []
    last_two = []
    for i in range(num_questions):
        note = pick_random(level, last_two)
        print("note", i, note)
        quiz.append(note)
        last_two.append(note)
        if len(last_two) > 2:
            last_two.pop(0)
    return quiz

@app.get("/", response_class=HTMLResponse)
async def title(request: Request):
    return templates.TemplateResponse("title.html", {"request": request})

@app.get("/quiz", response_class=HTMLResponse)
async def quiz_page(request: Request):
    return templates.TemplateResponse("quiz.html", {"request": request})


@app.get("/api/sounds/{level}", response_class=JSONResponse)
async def get_sounds(level: int):
    if not (1 <= level < 14):
        return JSONResponse({"error": "invalid level"}, status_code=400)
    return {"sounds": CHORD_FILES.get(level, [])}


@app.get("/level_select", response_class=HTMLResponse)
async def level_select_page(request: Request):
    return templates.TemplateResponse("level_select.html", {"request": request})


@app.get("/chord_check", response_class=HTMLResponse)
async def chord_check_page(request: Request):
    return templates.TemplateResponse("chord_check.html", {"request": request})


@app.get("/past_results", response_class=HTMLResponse)
async def past_results_page(request: Request):
    return templates.TemplateResponse("past_results.html", {"request": request})

# JSONでクイズ問題を返す
@app.get("/api/quiz/{level}", response_class=JSONResponse)
async def get_quiz(level: int):
    if not (1 <= level < 14):
        return JSONResponse({"error": "invalid level"}, status_code=400)
    questions = generate_quiz(level)
    return {"questions": questions}

@app.get("/result", response_class=HTMLResponse)
async def result_page(request: Request):
    return templates.TemplateResponse("result.html", {"request": request})
