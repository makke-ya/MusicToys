import json
import math
import random

# 音程定義とLCM計算
# (numerator, denominator)
intervals_raw = {
    'Perfect 1st': (1, 1),
    'Perfect 8th': (2, 1),
    'Perfect 5th': (3, 2),
    'Perfect 4th': (4, 3),
    'Major 6th': (5, 3),
    'Major 3rd': (5, 4),
    'minor 3rd': (6, 5),
    'minor 6th': (8, 5),
    'minor 7th': (9, 5),
    'Major 2nd': (9, 8),
    'Major 7th': (15, 8),
    'minor 2nd': (16, 15),
    'Tritone': (45, 32)
}

def lcm(a, b):
    return abs(a*b) // math.gcd(a, b)

# LCMでソートされたリストを作成
sorted_intervals = sorted(intervals_raw.keys(), key=lambda k: lcm(intervals_raw[k][0], intervals_raw[k][1]))

# 確認用出力
print("Sorted Intervals by LCM:")
for name in sorted_intervals:
    vals = intervals_raw[name]
    print(f"{name}: {vals[0]}/{vals[1]} (LCM: {lcm(vals[0], vals[1])})")

# 楽器リスト
instruments_rotation = [
    'Sawtooth Wave', # Lv1-5
    'Flute',         # Lv6-9
    'Violin',        # Lv10-14
    'Clarinet',      # Lv15-19
    'Cello',         # Lv20-24
    'Bassoon',       # Lv25-29
]
# Lv30以降用プール
all_instruments = [
    'Sawtooth Wave', 'Violin', 'Viola', 'Cello', 'Contrabass', 
    'Flute', 'Piccolo', 'Oboe', 'Bassoon', 'Clarinet', 
    'Horn', 'Trumpet', 'Trombone', 'Tuba', 'Saxophone'
]

level_data = []

# Lv1からLv100まで生成
for level in range(1, 101):
    # 選択可能な音程の数: 最初(Lv1)は2つ (P1, P8)。Lv5ごとに+1
    # Lv1-4: 2
    # Lv5-9: 3
    # Lv10-14: 4
    # ...
    num_choices = 2 + level // 5
    # リストの長さを超えないように制限
    num_choices = min(num_choices, len(sorted_intervals))
    
    if level >= 60:
        chosen_interval = "Random"
    else:
        available_intervals = sorted_intervals[:num_choices]
        chosen_interval = random.choice(available_intervals)
    
    # 楽器選択
    if level <= 29:
        # 既存の進行に近い形 (インデックス合わせ)
        # Lv1-5 (idx 0), Lv6-9 (idx 1), Lv10-14 (idx 2)...
        # Lv1-5: Sawtooth
        # Lv6-9: Flute
        # Lv10-14: Violin
        # Lv15-19: Clarinet
        # Lv20-24: Cello
        # Lv25-29: Bassoon
        if level <= 5: idx = 0
        elif level <= 9: idx = 1
        elif level <= 14: idx = 2
        elif level <= 19: idx = 3
        elif level <= 24: idx = 4
        else: idx = 5
        timbre = instruments_rotation[idx]
    else:
        # Lv30以降はランダム
        timbre = random.choice(all_instruments)

    # Tolerance (計算式に合わせる)
    tolerance = max(3, 20 - (level - 1) // 5)
    
    # Dynamics (Lv20以降たまにSwellにするなど、少し変化をつける)
    dynamics = "none"
    if level >= 20 and random.random() < 0.2:
        dynamics = "Swell"

    entry = {
        "level": level,
        "timbre": timbre,
        "interval": chosen_interval,
        "tolerance": tolerance,
        "dynamics": dynamics
    }
    level_data.append(entry)

# JSON書き出し
output_path = "games/002_harmony_game/level_design.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(level_data, f, indent=2, ensure_ascii=False)

print(f"Generated {len(level_data)} levels in {output_path}")
