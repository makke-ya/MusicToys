// Settings for the application

window.Config = {
    API_ENDPOINT: 'https://skht6osyhe.execute-api.ap-northeast-1.amazonaws.com/result',

    InstrumentSamples: {
    "Viola": {
        "C3": {
            "file": "/static/sounds/strings/viola/c3.mp3",
            "freq": 130.81
        },
        "A4": {
            "file": "/static/sounds/strings/viola/a4.mp3",
            "freq": 440.0
        },
        "B3": {
            "file": "/static/sounds/strings/viola/h3.mp3",
            "freq": 246.94
        },
        "G5": {
            "file": "/static/sounds/strings/viola/g5.mp3",
            "freq": 783.99
        },
        "C6": {
            "file": "/static/sounds/strings/viola/c6.mp3",
            "freq": 1046.5
        },
        "E4": {
            "file": "/static/sounds/strings/viola/e4.mp3",
            "freq": 329.63
        },
        "D5": {
            "file": "/static/sounds/strings/viola/d5.mp3",
            "freq": 587.33
        },
        "F3": {
            "file": "/static/sounds/strings/viola/f3.mp3",
            "freq": 174.61
        }
    },
    "Cello": {
        "E3": {
            "file": "/static/sounds/strings/cello/e3.mp3",
            "freq": 164.81
        },
        "G4": {
            "file": "/static/sounds/strings/cello/g4.mp3",
            "freq": 392.0
        },
        "A3": {
            "file": "/static/sounds/strings/cello/a3.mp3",
            "freq": 220.0
        },
        "B2": {
            "file": "/static/sounds/strings/cello/h2.mp3",
            "freq": 123.47
        },
        "C2": {
            "file": "/static/sounds/strings/cello/c2.mp3",
            "freq": 65.41
        },
        "D4": {
            "file": "/static/sounds/strings/cello/d4.mp3",
            "freq": 293.66
        },
        "C5": {
            "file": "/static/sounds/strings/cello/c5.mp3",
            "freq": 523.25
        },
        "F2": {
            "file": "/static/sounds/strings/cello/f2.mp3",
            "freq": 87.31
        }
    },
    "Violin": {
        "C4": {
            "file": "/static/sounds/strings/violin/c4.mp3",
            "freq": 261.63
        },
        "B4": {
            "file": "/static/sounds/strings/violin/h4.mp3",
            "freq": 493.88
        },
        "E5": {
            "file": "/static/sounds/strings/violin/e5.mp3",
            "freq": 659.26
        },
        "F4": {
            "file": "/static/sounds/strings/violin/f4.mp3",
            "freq": 349.23
        },
        "D6": {
            "file": "/static/sounds/strings/violin/d6.mp3",
            "freq": 1174.66
        },
        "A5": {
            "file": "/static/sounds/strings/violin/a5.mp3",
            "freq": 880.0
        },
        "G3": {
            "file": "/static/sounds/strings/violin/g3.mp3",
            "freq": 196.0
        },
        "G6": {
            "file": "/static/sounds/strings/violin/g6.mp3",
            "freq": 1567.98
        }
    },
    "Flute": {
        "C7": {
            "file": "/static/sounds/woodwind/flute/c7.mp3",
            "freq": 2093.0
        },
        "C4": {
            "file": "/static/sounds/woodwind/flute/c4.mp3",
            "freq": 261.63
        },
        "B4": {
            "file": "/static/sounds/woodwind/flute/h4.mp3",
            "freq": 493.88
        },
        "E5": {
            "file": "/static/sounds/woodwind/flute/e5.mp3",
            "freq": 659.26
        },
        "F4": {
            "file": "/static/sounds/woodwind/flute/f4.mp3",
            "freq": 349.23
        },
        "D6": {
            "file": "/static/sounds/woodwind/flute/d6.mp3",
            "freq": 1174.66
        },
        "A5": {
            "file": "/static/sounds/woodwind/flute/a5.mp3",
            "freq": 880.0
        },
        "G6": {
            "file": "/static/sounds/woodwind/flute/g6.mp3",
            "freq": 1567.98
        }
    },
    "Clarinet": {
        "D3": {
            "file": "/static/sounds/woodwind/clarinet/d3.mp3",
            "freq": 146.83
        },
        "C4": {
            "file": "/static/sounds/woodwind/clarinet/c4.mp3",
            "freq": 261.63
        },
        "B4": {
            "file": "/static/sounds/woodwind/clarinet/h4.mp3",
            "freq": 493.88
        },
        "E5": {
            "file": "/static/sounds/woodwind/clarinet/e5.mp3",
            "freq": 659.26
        },
        "F4": {
            "file": "/static/sounds/woodwind/clarinet/f4.mp3",
            "freq": 349.23
        },
        "D6": {
            "file": "/static/sounds/woodwind/clarinet/d6.mp3",
            "freq": 1174.66
        },
        "A5": {
            "file": "/static/sounds/woodwind/clarinet/a5.mp3",
            "freq": 880.0
        },
        "G3": {
            "file": "/static/sounds/woodwind/clarinet/g3.mp3",
            "freq": 196.0
        }
    },
    "Bassoon": {
        "E3": {
            "file": "/static/sounds/woodwind/bassoon/e3.mp3",
            "freq": 164.81
        },
        "G4": {
            "file": "/static/sounds/woodwind/bassoon/g4.mp3",
            "freq": 392.0
        },
        "A3": {
            "file": "/static/sounds/woodwind/bassoon/a3.mp3",
            "freq": 220.0
        },
        "B2": {
            "file": "/static/sounds/woodwind/bassoon/h2.mp3",
            "freq": 123.47
        },
        "C2": {
            "file": "/static/sounds/woodwind/bassoon/c2.mp3",
            "freq": 65.41
        },
        "D4": {
            "file": "/static/sounds/woodwind/bassoon/d4.mp3",
            "freq": 293.66
        },
        "C5": {
            "file": "/static/sounds/woodwind/bassoon/c5.mp3",
            "freq": 523.25
        },
        "F2": {
            "file": "/static/sounds/woodwind/bassoon/f2.mp3",
            "freq": 87.31
        }
    }
}
};
