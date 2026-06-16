/*****************************************************
 *  GLOBALE KONSTANTEN & ZUSTÄNDE
 *****************************************************/

/* --- Concerns (Sticky-Notes) --- */
const defaultConcerns = [
    "Kaffeequalität im Büro verbessern",
    "Mehr Remote-Tage ermöglichen",
    "Wellness-Kurse anbieten",
    "Bessere Meeting-Raumausstattung",
    "Regelmäßigere Team-Events",
    "Verbesserung der Fahrstuhl-Reinigung",
    "Gehalt anpassen nach Inflation",
    "Verbesserung der Klimatisierung"
];

let concerns = JSON.parse(localStorage.getItem('concerns')) || [...defaultConcerns];
let currentConcernIndex = 0;
let startX = 0;
let currentX = 0;
let isDragging = false;
let concernVotes = JSON.parse(localStorage.getItem('concernVotes')) || {};

/* --- Top Voices (Abstimmung) --- */
const defaultTopVoices = [
    { id: 1, title: "Frau Afflerbach will Demokratietag organisieren", votes: 24 },
    { id: 2, title: "Kaffeequalität im Pausenraum verbessern", votes: 18 },
    { id: 3, title: "Mehr flexible Arbeitszeiten ermöglichen", votes: 16 },
    { id: 4, title: "Wellness-Programm für Mitarbeiter starten", votes: 14 },
    { id: 5, title: "Bessere Klimatisierung in den Büros", votes: 11 },
    { id: 6, title: "Monthly Team Building Events", votes: 9 },
    { id: 7, title: "Verbesserung der Fahrstuhl-Reinigung", votes: 7 }
];

let topVoices = JSON.parse(localStorage.getItem('topVoices')) || defaultTopVoices;
let userTopVotes = JSON.parse(localStorage.getItem('userTopVotes')) || {};

/* --- Stimmungs‑Smileys --- */
const userVotes = JSON.parse(localStorage.getItem('userVotes')) || {
    satisfaction: null,
    energy: null,
    workload: null
};


/*****************************************************
 *  FUNKTIONEN
 *****************************************************/

/* ---------- Concerns (Wischbare Notizen) ---------- */
function renderSticky() {
    const container = document.getElementById('stickyNoteContainer');
    if (!container) return;
    container.innerHTML = '';

    if (currentConcernIndex < concerns.length) {
        const note = document.createElement('div');
        note.className = 'sticky-note';
        note.id = 'currentSticky';

        // Text und Indikatoren getrennt setzen, nicht mit innerHTML überschreiben
        note.innerHTML = `
            <span class="note-text">${concerns[currentConcernIndex]}</span>
            <div class="vote-indicator">
                <div class="indicator-left">✕</div>
                <div class="indicator-right">✓</div>
            </div>
        `;

        note.addEventListener('mousedown', startDrag);
        note.addEventListener('touchstart', startDrag, { passive: true });

        container.appendChild(note);
    } else {
        const note = document.createElement('div');
        note.className = 'sticky-note finished';
        note.innerHTML = '✨ Alle Anliegen angesehen!<br><br>Komm morgen wieder.<br><span style="font-size: 24px; margin-top: 12px;">😊</span>';
        note.style.cursor = 'default';
        container.appendChild(note);
    }

    document.getElementById('currentIndex').textContent = currentConcernIndex + 1;
    document.getElementById('totalCount').textContent = concerns.length;
}

function startDrag(e) {
    if (currentConcernIndex >= concerns.length) return;

    isDragging = true;
    startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    currentX = startX;
    const note = document.getElementById('currentSticky');
    if (note) {
        note.classList.add('dragging');
        note.classList.remove('swiping-left', 'swiping-right');
    }
}

function moveDrag(e) {
    if (isDragging) e.preventDefault();
    if (!isDragging) return;
    currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const note = document.getElementById('currentSticky');
    if (!note) return;

    const diff = currentX - startX;
    note.style.transform = `translateX(${diff}px) rotate(${diff * 0.15}deg) scale(${1 - Math.abs(diff) * 0.0005})`;

    const threshold = 60;
    const maxDistance = 150;
    const absDiff = Math.abs(diff);

    if (diff > threshold) {
        note.classList.add('swiping-right');
        note.classList.remove('swiping-left');
    } else if (diff < -threshold) {
        note.classList.add('swiping-left');
        note.classList.remove('swiping-right');
    } else {
        note.classList.remove('swiping-left', 'swiping-right');
    }

    const leftIndicator = note.querySelector('.indicator-left');
    const rightIndicator = note.querySelector('.indicator-right');
    if (leftIndicator && rightIndicator) {
        const opacity = Math.min(absDiff / maxDistance, 1);
        if (diff > threshold) {
            rightIndicator.style.opacity = opacity;
            leftIndicator.style.opacity = 0;
        } else if (diff < -threshold) {
            leftIndicator.style.opacity = opacity;
            rightIndicator.style.opacity = 0;
        } else {
            leftIndicator.style.opacity = 0;
            rightIndicator.style.opacity = 0;
        }
    }
}

function endDrag() {
    if (!isDragging) return;
    isDragging = false;

    const note = document.getElementById('currentSticky');
    if (!note) return;

    const diff = currentX - startX;

    if (Math.abs(diff) > 100) {
        if (diff > 0) {
            note.classList.add('swiped-right');
            recordVote(currentConcernIndex, 'relevant');
        } else {
            note.classList.add('swiped-left');
            recordVote(currentConcernIndex, 'not-relevant');
        }

        note.querySelector('.indicator-left')?.style?.removeProperty('opacity');
        note.querySelector('.indicator-right')?.style?.removeProperty('opacity');
        note.classList.remove('swiping-left', 'swiping-right', 'dragging');

        setTimeout(() => {
            currentConcernIndex++;
            renderSticky();
        }, 400);
    } else {
        note.style.transform = 'translateX(0) rotate(0deg) scale(1)';
        note.classList.remove('dragging', 'swiping-left', 'swiping-right');
        note.querySelector('.indicator-left')?.style?.removeProperty('opacity');
        note.querySelector('.indicator-right')?.style?.removeProperty('opacity');
    }
}

function recordVote(index, value) {
    if (!concernVotes[index]) {
        concernVotes[index] = { concern: concerns[index], vote: value };
        localStorage.setItem('concernVotes', JSON.stringify(concernVotes));
    }
}

/* ---------- Modales Fenster für neue Anliegen ---------- */
function openAddConcernModal() {
    const modal = document.getElementById('addConcernModal');
    const textarea = document.getElementById('concernText');
    if (!modal) return;

    modal.classList.add('active');
    if (textarea) {
        textarea.value = '';
        textarea.focus();
    }
    const counter = document.getElementById('charCount');
    if (counter) counter.textContent = '0';
}

function closeAddConcernModal() {
    const modal = document.getElementById('addConcernModal');
    if (modal) modal.classList.remove('active');

    const textarea = document.getElementById('concernText');
    if (textarea) textarea.value = '';

    const counter = document.getElementById('charCount');
    if (counter) counter.textContent = '0';
}

function submitConcern() {
    const textarea = document.getElementById('concernText');
    if (!textarea) return;

    const text = textarea.value.trim();
    if (text.length < 5) {
        alert('⚠️ Bitte mindestens 5 Zeichen eingeben!');
        return;
    }

    try {
        concerns.unshift(text);
        localStorage.setItem('concerns', JSON.stringify(concerns));
        currentConcernIndex = 0;
        renderSticky();
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
    } finally {
        closeAddConcernModal();
    }
}

/* ---------- Top Voices (Up‑/Downvotes) ---------- */
function renderTopVoices() {
    const container = document.getElementById('topVoicesContainer');
    if (!container) return;

    const sorted = [...topVoices].sort((a, b) => b.votes - a.votes);

    container.innerHTML = sorted.map(voice => {
        const upVoted = userTopVotes[voice.id]?.upVoted || false;
        const downVoted = userTopVotes[voice.id]?.downVoted || false;

        return `
            <div class="voice-item">
                <div class="voice-title">${voice.title}</div>
                <div class="voice-votes">
                    <button class="vote-button ${upVoted ? 'up-voted' : ''}" onclick="upVote(${voice.id})">👍</button>
                    <span class="vote-count" id="vote-${voice.id}">${voice.votes}</span>
                    <button class="vote-button ${downVoted ? 'down-voted' : ''}" onclick="downVote(${voice.id})">👎</button>
                </div>
            </div>
        `;
    }).join('');
}

function upVote(id) {
    const voice = topVoices.find(v => v.id === id);
    if (!voice) return;

    if (!userTopVotes[id]) userTopVotes[id] = {};

    if (userTopVotes[id].upVoted) {
        voice.votes--;
        userTopVotes[id].upVoted = false;
    } else {
        if (userTopVotes[id].downVoted) {
            voice.votes++;
            userTopVotes[id].downVoted = false;
        }
        voice.votes++;
        userTopVotes[id].upVoted = true;
    }

    localStorage.setItem('topVoices', JSON.stringify(topVoices));
    localStorage.setItem('userTopVotes', JSON.stringify(userTopVotes));
    renderTopVoices();
}

function downVote(id) {
    const voice = topVoices.find(v => v.id === id);
    if (!voice) return;

    if (!userTopVotes[id]) userTopVotes[id] = {};

    if (userTopVotes[id].downVoted) {
        voice.votes++;
        userTopVotes[id].downVoted = false;
    } else {
        if (userTopVotes[id].upVoted) {
            voice.votes--;
            userTopVotes[id].upVoted = false;
        }
        voice.votes = Math.max(0, voice.votes - 1);
        userTopVotes[id].downVoted = true;
    }

    localStorage.setItem('topVoices', JSON.stringify(topVoices));
    localStorage.setItem('userTopVotes', JSON.stringify(userTopVotes));
    renderTopVoices();
}

/* ---------- Ansicht wechseln (Tab‑Navigation) ---------- */
function switchView(view, event) {
    document.querySelectorAll('.view-button').forEach(btn => btn.classList.remove('active'));
    if (event) event.target.classList.add('active');

    const currentView = document.getElementById('currentView');
    const statsSection = document.getElementById('statsSection');
    const badgesSection = document.getElementById('badgesSection');

    if (currentView) currentView.style.display = (view === 'current') ? 'grid' : 'none';
    if (statsSection) statsSection.style.display = (view === 'stats') ? 'block' : 'none';
    if (badgesSection) badgesSection.style.display = (view === 'week') ? 'block' : 'none';
}

/* ---------- Stimmungs‑Smileys ---------- */
function restoreSelections() {
    for (const [key, value] of Object.entries(userVotes)) {
        if (value) {
            const smiley = document.querySelector(`[onclick*="'${key}'"][onclick*="'${value}'"]`);
            if (smiley) smiley.classList.add('selected');
        }
    }
}

function selectSmiley(category, value, element) {
    const parent = element.parentElement;
    parent.querySelectorAll('.smiley').forEach(s => s.classList.remove('selected'));
    element.classList.add('selected');
    userVotes[category] = value;

    element.style.transform = 'scale(1.25)';
    setTimeout(() => {
        if (element.classList.contains('selected')) {
            element.style.transform = 'scale(1.2)';
        }
    }, 100);
}

function submitVotes(e) {
    e.preventDefault();

    if (!userVotes.satisfaction || !userVotes.energy || !userVotes.workload) {
        alert('⚠️ Bitte alle 3 Kategorien bewerten!');
        return;
    }

    localStorage.setItem('userVotes', JSON.stringify(userVotes));

    const history = JSON.parse(localStorage.getItem('votingHistory')) || [];
    history.push({
        date: new Date().toLocaleDateString('de-DE'),
        votes: { ...userVotes }
    });
    localStorage.setItem('votingHistory', JSON.stringify(history));

    const feedback = document.getElementById('feedback');
    if (feedback) {
        feedback.classList.add('active');
        setTimeout(() => feedback.classList.remove('active'), 4000);
    }
}


/*****************************************************
 *  EVENT LISTENER
 *****************************************************/
document.addEventListener('mousemove', moveDrag);
document.addEventListener('mouseup', endDrag);
document.addEventListener('touchmove', moveDrag, { passive: false });
document.addEventListener('touchend', endDrag);

const concernTextArea = document.getElementById('concernText');
if (concernTextArea) {
    concernTextArea.addEventListener('input', function () {
        const charCountEl = document.getElementById('charCount');
        if (charCountEl) charCountEl.textContent = this.value.length;
    });
}

window.addEventListener('click', function (event) {
    const modal = document.getElementById('addConcernModal');
    if (modal && event.target === modal) closeAddConcernModal();
});


/*****************************************************
 *  APP-LIKE INTERACTIONS (MODERNE ERWEITERUNGEN)
 *****************************************************/

// 1. Bottom-Navigation – haptisches Feedback
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (navigator.vibrate) navigator.vibrate(10);
  });
});

// 2. FAB – Ripple-Effekt (nur auf concerns.html vorhanden)
const fab = document.getElementById('fabButton');
if (fab) {
  fab.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = fab.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size/2}px`;
    ripple.style.top = `${e.clientY - rect.top - size/2}px`;
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255,255,255,0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s ease-out';
    fab.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

// 3. Progress-Bars animieren, sobald sie sichtbar sind
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.progress-fill').forEach(bar => progressObserver.observe(bar));

// 4. Stat-Counter sanft hochzählen (wenn vorhanden)
function animateCounter(el, target) {
  let current = 0;
  const step = target / 40;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current);
    }
  }, 20);
}

document.querySelectorAll('.stat-value').forEach(stat => {
  const target = parseInt(stat.textContent);
  if (target) animateCounter(stat, target);
});

// 5. Pull-to-Refresh (einfaches Feedback)
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  const touchY = e.touches[0].clientY;
  if (touchY - touchStartY > 80 && window.scrollY === 0) {
    document.body.style.setProperty('--refresh-offset', `${Math.min(touchY - touchStartY - 80, 60)}px`);
  }
}, { passive: true });

document.addEventListener('touchend', () => {
  const offset = parseInt(getComputedStyle(document.body).getPropertyValue('--refresh-offset'));
  if (offset > 40) location.reload();
  document.body.style.setProperty('--refresh-offset', '0px');
});


/*****************************************************
 *  INITIALISIERUNG
 *****************************************************/
renderSticky();
renderTopVoices();
restoreSelections();
