(async function () {
      try {
        if (typeof Site === 'undefined') {
          throw new Error('Site object is not loaded. Check site.js');
        }
        const level = Number(localStorage.getItem('selectedLevel') || 1);
        const instant = localStorage.getItem('instant') === '1';
        document.getElementById('info').textContent = `れべる ${level} — ${instant ? 'すぐにこたえをみる' : 'あとでこたえをみる'}`;
        document.getElementById('fileCount').textContent = `ぜんぶで ${Site.QUESTION_COUNT || 10} もん`;

        const colorMap = Site.colorMap;
        const noteMap = Site.noteMap;

        const previewAudio = new Audio();
        let playingBtn = null;

        const sounds = await Site.getSoundsForLevel(level);
        const container = document.getElementById('chords');
        if (!sounds.length) { container.textContent = '音ファイルがありません'; return; }

        sounds.forEach((fname) => {
          const btn = Site.createChordButton(fname, {
            onClick: () => {
              if (!previewAudio.paused) { previewAudio.pause(); previewAudio.currentTime = 0; }
              if (playingBtn && playingBtn !== btn) { playingBtn.style.boxShadow = 'none'; }
              previewAudio.src = `/static/sounds/${fname}`;
              previewAudio.play().catch(() => { });
              playingBtn = btn;
              btn.style.boxShadow = '0 0 12px rgba(0,0,0,0.18)';
              previewAudio.onended = () => { if (playingBtn) { playingBtn.style.boxShadow = 'none'; playingBtn = null; } };
            }
          });
          container.appendChild(btn);
        });

        document.getElementById('startQuizBtn').addEventListener('click', () => {
          localStorage.setItem('instant', instant ? '1' : '0');
          window.location.href = 'index.html';
        });
      } catch (e) {
        console.error(e);
        document.getElementById('chords').innerHTML = `<div class="col-span-4 text-red-500 font-bold">エラーが発生しました: ${e.message}</div>`;
      }
    })();