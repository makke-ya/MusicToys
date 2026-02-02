import os
import json
import math
import re

# 音名とMIDIノート番号の対応 (C4 = 60)
NOTE_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
GERMAN_TO_ENGLISH = {'h': 'b'}

def note_to_midi(note_str):
    match = re.match(r"([a-z]+#?)(\d+)", note_str.lower())
    if not match:
        return None
    name, octave = match.groups()
    name = GERMAN_TO_ENGLISH.get(name, name)
    octave = int(octave)
    
    try:
        note_index = NOTE_NAMES.index(name)
    except ValueError:
        return None
        
    return (octave + 1) * 12 + note_index

def midi_to_note(midi_num):
    octave = (midi_num // 12) - 1
    note_index = midi_num % 12
    name = NOTE_NAMES[note_index]
    return f"{name.upper()}{octave}"

def midi_to_freq(midi_num):
    return 440.0 * math.pow(2, (midi_num - 69) / 12)

def scan_sounds(base_dir):
    instruments = {}
    for root, dirs, files in os.walk(base_dir):
        parts = root.split(os.sep)
        # Expect structure: .../instrument_name/*.mp3
        # e.g. static/sounds/strings/violin
        # Check if we are deep enough.
        # "static/sounds" is base.
        # "strings/violin" -> parts[-2], parts[-1]
        
        # Simple heuristic: Use the directory name as instrument name if it contains mp3s
        # But filter out 'sounds' itself or 'strings', 'woodwind' if they are just categories.
        # However, the user said "guess instrument from folder name".
        
        has_mp3 = any(f.endswith('.mp3') for f in files)
        if not has_mp3: continue
        
        instrument_key = parts[-1].capitalize()
        
        # Skip root sounds folder (it has numbered files like 01_red.mp3 which are likely effects or other things)
        if instrument_key == 'Sounds': continue
        
        # Just to be safe, ignore folders that don't look like instruments or specific ones we want to ignore?
        # The root 'static/sounds' contains '01_red.mp3' etc. 'parts[-1]' would be 'sounds'.
        # Let's filter out the root directory.
        if root == base_dir: continue

        if instrument_key not in instruments:
            instruments[instrument_key] = {'files': []}
        
        for file in files:
            if file.endswith('.mp3'):
                note_str = file.replace('.mp3', '')
                # Skip numeric-only filenames like "01_red" or "22"
                if re.match(r'^\d', note_str): continue
                if note_str in ['correct', 'wrong', 'click', 'dummy']: continue

                midi = note_to_midi(note_str)
                if midi is not None:
                    # Construct absolute path for web (starting with /)
                    # root: static/sounds/strings/violin
                    rel_path = os.path.join(root, file)
                    # ensure it starts with /static...
                    if not rel_path.startswith('/'):
                        rel_path = '/' + rel_path
                    
                    instruments[instrument_key]['files'].append({
                        'midi': midi,
                        'path': rel_path,
                        'freq': midi_to_freq(midi)
                    })

    return instruments

def generate_config(instruments):
    config_data = {}
    for name, data in instruments.items():
        if not data['files']: continue
        config_data[name] = {}
        for f in data['files']:
            note_key = midi_to_note(f['midi'])
            config_data[name][note_key] = {
                'file': f['path'],
                'freq': round(f['freq'], 2)
            }
    return config_data

def generate_notes_json(instruments):
    notes_data = {}
    notes_data['Sawtooth Wave'] = [midi_to_note(m) for m in range(60, 85)] 
    
    for name, data in instruments.items():
        if not data['files']: continue
        midis = [f['midi'] for f in data['files']]
        min_midi = min(midis)
        max_midi = max(midis)
        range_notes = []
        for m in range(min_midi, max_midi + 1):
            range_notes.append(midi_to_note(m))
        notes_data[name] = range_notes
    return notes_data

instruments = scan_sounds('static/sounds')

config_json = json.dumps(generate_config(instruments), indent=4)
notes_json = json.dumps(generate_notes_json(instruments), indent=2)

print("---CONFIG_JS---")
print(f"""// このファイルは git にコミットされません。
// API Gateway の URL などをここに記述します。

window.Config = {{
    API_ENDPOINT: 'https://cn3gzqh9ff.execute-api.ap-northeast-1.amazonaws.com/result',

    InstrumentSamples: {config_json}
}};""")

print("---NOTES_JSON---")
print(notes_json)