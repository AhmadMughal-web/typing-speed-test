// ── Word Bank ──
const WORDS = [
  'the','be','to','of','and','a','in','that','have','it','for','not','on','with',
  'he','as','you','do','at','this','but','his','by','from','they','we','say','her',
  'she','or','an','will','my','one','all','would','there','their','what','so','up',
  'out','if','about','who','get','which','go','me','when','make','can','like','time',
  'no','just','him','know','take','people','into','year','your','good','some','could',
  'them','see','other','than','then','now','look','only','come','its','over','think',
  'also','back','after','use','two','how','our','work','first','well','way','even',
  'new','want','because','any','these','give','day','most','us','great','between',
  'need','large','often','hand','high','place','hold','turn','follow','act','ask',
  'men','change','off','play','spell','air','away','animal','house','point','page',
  'letter','mother','answer','found','study','still','learn','plant','cover','food',
  'sun','four','between','state','keep','eye','never','last','let','thought','city',
  'tree','cross','farm','hard','start','might','story','saw','far','sea','draw',
  'left','late','run','while','press','close','night','real','life','few','north',
  'open','seem','together','next','white','children','begin','got','walk','example',
  'ease','paper','group','always','music','those','both','mark','often','book',
];

function pickWords(count) {
  const result = []
  for (let i = 0; i < count; i++) {
    result.push(WORDS[Math.floor(Math.random() * WORDS.length)])
  }
  return result
}

// ── State ──
let words        = []
let currentWord  = 0
let currentLetter= 0
let correctChars = 0
let totalChars   = 0
let errors       = 0
let started      = false
let finished     = false
let timeLeft     = 60
let totalTime    = 60
let timerInterval= null
let wordOffset   = 0  // for scrolling

// ── Elements ──
const wordsEl    = document.getElementById('words')
const typeInput  = document.getElementById('typeInput')
const wpmVal     = document.getElementById('wpmVal')
const accVal     = document.getElementById('accVal')
const timeVal    = document.getElementById('timeVal')
const errVal     = document.getElementById('errVal')
const progressFill= document.getElementById('progressFill')
const resultScreen= document.getElementById('resultScreen')
const finalWpm   = document.getElementById('finalWpm')
const finalAcc   = document.getElementById('finalAcc')
const finalChars = document.getElementById('finalChars')
const finalErrors= document.getElementById('finalErrors')
const finalTime  = document.getElementById('finalTime')
const resultGrade= document.getElementById('resultGrade')
const restartBtn = document.getElementById('restartBtn')
const resetBtn   = document.getElementById('resetBtn')
const startHint  = document.getElementById('startHint')
const timeChips  = document.querySelectorAll('.time-chip')

// ── Build Words ──
function buildWords() {
  words = pickWords(80)
  wordsEl.innerHTML = ''
  wordOffset = 0

  words.forEach((word, wi) => {
    const wordEl = document.createElement('span')
    wordEl.className = 'word'
    wordEl.dataset.index = wi

    word.split('').forEach((char, li) => {
      const span = document.createElement('span')
      span.className = 'letter'
      span.textContent = char
      span.dataset.word = wi
      span.dataset.letter = li
      wordEl.appendChild(span)
    })
    wordsEl.appendChild(wordEl)
  })

  // Set cursor on first letter
  setCursor(0, 0)
}

function getLetter(wi, li) {
  const wordEl = wordsEl.querySelector(`[data-index="${wi}"]`)
  if (!wordEl) return null
  return wordEl.querySelectorAll('.letter')[li] || null
}

function getWordEl(wi) {
  return wordsEl.querySelector(`[data-index="${wi}"]`)
}

function setCursor(wi, li) {
  // Remove existing cursor
  wordsEl.querySelectorAll('.cursor').forEach(el => el.classList.remove('cursor'))
  const letter = getLetter(wi, li)
  if (letter) letter.classList.add('cursor')
}

// ── Scroll words ──
function scrollToCurrentWord() {
  const wordEl = getWordEl(currentWord)
  if (!wordEl) return
  const container = document.querySelector('.words-container')
  const wordTop   = wordEl.offsetTop
  const rowHeight = 36 // approx line height

  if (wordTop > rowHeight) {
    wordsEl.style.transform = `translateY(-${wordTop - rowHeight}px)`
  }
}

// ── Timer ──
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--
    timeVal.textContent = timeLeft
    progressFill.style.width = `${((totalTime - timeLeft) / totalTime) * 100}%`

    // Live WPM
    const elapsed = (totalTime - timeLeft) / 60
    if (elapsed > 0) {
      const wpm = Math.round((correctChars / 5) / elapsed)
      wpmVal.textContent = wpm
      wpmVal.style.color = wpm > 60 ? '#16a34a' : wpm > 40 ? '#2563eb' : '#1a1814'
    }

    if (timeLeft <= 0) finishTest()
  }, 1000)
}

// ── Input Handler ──
typeInput.addEventListener('input', (e) => {
  if (finished) return

  if (!started) {
    started = true
    startTimer()
    startHint.style.opacity = '0'
  }

  const val   = typeInput.value
  const word  = words[currentWord]

  // Space pressed = next word
  if (val.endsWith(' ')) {
    const typed = val.trim()
    totalChars += typed.length

    if (typed === word) {
      correctChars += word.length
      getWordEl(currentWord)?.classList.remove('wrong-word')
    } else {
      errors++
      errVal.textContent = errors
      getWordEl(currentWord)?.classList.add('wrong-word')
    }

    // Mark remaining letters of current word wrong if skipped
    const wordLetters = getWordEl(currentWord)?.querySelectorAll('.letter')
    wordLetters?.forEach((l, i) => {
      if (!l.classList.contains('correct') && !l.classList.contains('wrong')) {
        l.classList.add('wrong')
      }
    })

    currentWord++
    currentLetter = 0
    typeInput.value = ''
    scrollToCurrentWord()
    setCursor(currentWord, 0)

    // Refill words if running low
    if (currentWord >= words.length - 20) {
      const more = pickWords(40)
      more.forEach((w, i) => {
        const wi = words.length + i
        words.push(w)
        const wordEl = document.createElement('span')
        wordEl.className = 'word'
        wordEl.dataset.index = wi
        w.split('').forEach((char, li) => {
          const span = document.createElement('span')
          span.className = 'letter'
          span.textContent = char
          span.dataset.word = wi
          span.dataset.letter = li
          wordEl.appendChild(span)
        })
        wordsEl.appendChild(wordEl)
      })
    }

    // Update accuracy
    updateAccuracy()
    return
  }

  // Letter by letter feedback
  const wordLetters = getWordEl(currentWord)?.querySelectorAll('.letter')
  if (!wordLetters) return

  val.split('').forEach((char, i) => {
    const letter = wordLetters[i]
    if (!letter) return
    letter.classList.remove('correct', 'wrong', 'cursor')
    if (char === word[i]) letter.classList.add('correct')
    else                   letter.classList.add('wrong')
  })

  // Reset letters beyond current input
  for (let i = val.length; i < wordLetters.length; i++) {
    wordLetters[i].classList.remove('correct', 'wrong', 'cursor')
  }

  currentLetter = val.length
  setCursor(currentWord, currentLetter < word.length ? currentLetter : word.length - 1)
  updateAccuracy()
})

function updateAccuracy() {
  if (totalChars === 0 && correctChars === 0) return
  const acc = totalChars > 0
    ? Math.round((correctChars / (totalChars || 1)) * 100)
    : 100
  accVal.textContent = acc + '%'
  accVal.style.color = acc >= 95 ? '#16a34a' : acc >= 80 ? '#2563eb' : '#dc2626'
}

// ── Finish ──
function finishTest() {
  clearInterval(timerInterval)
  finished = true
  typeInput.disabled = true

  const elapsed = totalTime / 60
  const wpm     = Math.round((correctChars / 5) / elapsed)
  const acc     = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0

  finalWpm.textContent    = wpm
  finalAcc.textContent    = acc + '%'
  finalChars.textContent  = correctChars
  finalErrors.textContent = errors
  finalTime.textContent   = totalTime + 's'

  const grade =
    wpm >= 80 ? '🏆 Outstanding performance!'  :
    wpm >= 60 ? '⭐ Excellent typing speed!'    :
    wpm >= 40 ? '👍 Good job, keep practising!' :
    wpm >= 20 ? '📈 You\'re improving!'          :
                '🌱 Keep practising daily!'

  resultGrade.textContent = grade
  resultScreen.classList.remove('hidden')
}

// ── Reset ──
function resetTest() {
  clearInterval(timerInterval)
  started   = false
  finished  = false
  currentWord   = 0
  currentLetter = 0
  correctChars  = 0
  totalChars    = 0
  errors        = 0
  timeLeft      = totalTime
  wordOffset    = 0
  wordsEl.style.transform = 'translateY(0)'

  typeInput.value   = ''
  typeInput.disabled = false
  wpmVal.textContent = '—'
  accVal.textContent = '—'
  errVal.textContent = '0'
  timeVal.textContent = totalTime
  progressFill.style.width = '0%'
  wpmVal.style.color = ''
  accVal.style.color = ''
  startHint.style.opacity = '1'
  resultScreen.classList.add('hidden')

  buildWords()
  typeInput.focus()
}

// ── Time Chips ──
timeChips.forEach(chip => {
  chip.addEventListener('click', () => {
    timeChips.forEach(c => c.classList.remove('active'))
    chip.classList.add('active')
    totalTime = parseInt(chip.dataset.time)
    resetTest()
  })
})

// ── Buttons ──
restartBtn.addEventListener('click', resetTest)
resetBtn.addEventListener('click', resetTest)

// ── Click input to start ──
typeInput.addEventListener('focus', () => {
  if (!started && !finished) {
    startHint.textContent = 'Start typing!'
  }
})

// ── Keyboard shortcut: Tab to reset ──
document.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault()
    resetTest()
  }
})

// ── Init ──
buildWords()
