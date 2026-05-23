/* ==========================================================================
   Lógica de CompilaQuest - El Desafío del Compilador
   ========================================================================== */

// --- MOTOR DE AUDIO NATIVO (Sintetizador Web Audio API) ---
class CyberAudioEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    playOsc(freq, type, duration, gainStart = 0.1) {
        if (this.muted) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gainNode.gain.setValueAtTime(gainStart, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playBeep(freq = 600, duration = 0.1) {
        this.playOsc(freq, 'square', duration, 0.05);
    }

    playSuccess() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.playOsc(freq, 'triangle', 0.15, 0.08);
            }, index * 80);
        });
    }

    playFailure() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        // Buzz pesado descendente
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.4);
        
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.4);
    }

    playLaser() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);
        
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.start();
        osc.stop(now + 0.25);
    }

    playWinFanfare() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const fanfare = [
            { f: 523.25, d: 0.15 }, // C5
            { f: 523.25, d: 0.15 }, 
            { f: 523.25, d: 0.15 }, 
            { f: 659.25, d: 0.3 },  // E5
            { f: 587.33, d: 0.3 },  // D5
            { f: 659.25, d: 0.3 },  // E5
            { f: 783.99, d: 0.3 },  // G5
            { f: 1046.50, d: 0.8 }  // C6
        ];
        let cumulativeTime = 0;
        fanfare.forEach((note) => {
            setTimeout(() => {
                this.playOsc(note.f, 'square', note.d, 0.08);
            }, cumulativeTime);
            cumulativeTime += note.d * 1000 + 50;
        });
    }
}

const audio = new CyberAudioEngine();

// --- CONFIGURACIÓN E INFORMACIÓN DE LOS JUEGOS ---

const SEMANTIC_CHALLENGES = [
    {
        code: `int x = "hola";`,
        correct: false,
        log: "Error semántico: Imposible asignar literal de tipo const char* a variable de tipo int."
    },
    {
        code: `float f = 3.14 + 5;`,
        correct: true,
        log: "Correcto: Coerción implícita admitida. El compilador promueve 5 a float (5.0)."
    },
    {
        code: `int a = 10;\nchar b = 'c';\na = b;`,
        correct: true,
        log: "Correcto: La conversión de tipo char a int es admisible (valores numéricos ASCII)."
    },
    {
        code: `string s = 25;`,
        correct: false,
        log: "Error semántico: Inicialización inválida de string utilizando una constante entera."
    },
    {
        code: `int x;\nx = y + 5;`,
        correct: false,
        log: "Error semántico: La variable 'y' no está declarada en este ámbito."
    },
    {
        code: `void calc() {\n    return 5;\n}`,
        correct: false,
        log: "Error semántico: No se puede retornar un valor entero en una función con retorno void."
    },
    {
        code: `int sum(int a, int b) {\n    return a + b;\n}\n\nint x = sum(5);`,
        correct: false,
        log: "Error semántico: Número de argumentos inválido en la llamada. Esperados: 2, Proporcionados: 1."
    },
    {
        code: `int* ptr = NULL;\nif (ptr == NULL) {\n    ptr = 0;\n}`,
        correct: true,
        log: "Correcto: NULL o valor 0 es compatible con punteros."
    },
    {
        code: `const int MAX = 100;\nMAX = 200;`,
        correct: false,
        log: "Error semántico: Asignación denegada. No se puede modificar una variable calificada como const."
    },
    {
        code: `bool b = true;\nif (b) {\n    b = !b;\n}`,
        correct: true,
        log: "Correcto: Evaluación lógica y operadores compatibles con el tipo booleano."
    }
];

const INTERMEDIATE_CHALLENGES = [
    {
        infix: "A + B * C",
        tokens: ["A", "B", "C", "*", "+"],
        postfix: ["A", "B", "C", "*", "+"],
        desc: "Traduce la expresión respetando la jerarquía de operadores (multiplicación primero)."
    },
    {
        infix: "(A + B) * C",
        tokens: ["A", "B", "+", "C", "*"],
        postfix: ["A", "B", "+", "C", "*"],
        desc: "Traduce la expresión. El uso de paréntesis prioriza la suma antes de la multiplicación."
    },
    {
        infix: "x = y",
        tokens: ["x", "y", "="],
        postfix: ["x", "y", "="],
        desc: "Las asignaciones colocan su operador de asignación al final."
    },
    {
        infix: "A * B + C * D",
        tokens: ["A", "B", "*", "C", "D", "*", "+"],
        postfix: ["A", "B", "*", "C", "D", "*", "+"],
        desc: "Ambas multiplicaciones tienen precedencia y se operan antes de la suma final."
    }
];

const PEEPHOLE_CHALLENGES = [
    {
        title: "Bloque de Ensamblador 1",
        instructions: [
            { text: "MOV EAX, EBX", redundant: false },
            { text: "MOV EBX, EAX", redundant: true, log: "Eliminado: Carga redundante. EBX ya posee el valor de EAX." },
            { text: "ADD EAX, 1", redundant: false },
            { text: "SUB ECX, 0", redundant: true, log: "Eliminado: Álgebra trivial. Restar 0 es una operación nula." }
        ]
    },
    {
        title: "Bloque de Ensamblador 2",
        instructions: [
            { text: "JMP L1", redundant: false },
            { text: "L1: JMP L2", redundant: true, log: "Eliminado: Salto a salto. Optimizado saltando directamente a L2." },
            { text: "MOV EDX, #10", redundant: false },
            { text: "ADD EDX, 0", redundant: true, log: "Eliminado: Álgebra trivial. Sumar 0 no altera el registro." }
        ]
    },
    {
        title: "Bloque de Ensamblador 3",
        instructions: [
            { text: "STR R1, [SP]", redundant: false },
            { text: "LDR R1, [SP]", redundant: true, log: "Eliminado: Almacenar y cargar inmediatamente el mismo registro de memoria." },
            { text: "MUL R2, R2, #2", redundant: false, extraDesc: "Se puede optimizar por corrimiento (LSL), pero no es redundancia directa." },
            { text: "MOV R3, R3", redundant: true, log: "Eliminado: Operación identidad inútil." }
        ]
    }
];

const MEMORY_ITEMS = [
    { text: "int local_var = 5;", segment: "stack", log: "Stack: Se apilan variables locales correspondientes a marcos de llamada." },
    { text: "void* p = malloc(64);", segment: "heap", log: "Heap: Espacio dinámico para reservas manuales (malloc/new)." },
    { text: "int global_width = 1920;", segment: "data", log: "Data: Variables globales e inicializadas en tiempo de carga." },
    { text: "Instrucción: ADD EAX, EBX", segment: "code", log: "Code: Segmento persistente de solo lectura para instrucciones binarias." },
    { text: "static int counter = 0;", segment: "data", log: "Data/BSS: Variables estáticas y globales." },
    { text: "char* array = new char[100];", segment: "heap", log: "Heap: El puntero dinámico se aloja en el montículo." },
    { text: "Llamada a funcion: draw()", segment: "stack", log: "Stack: La pila almacena los datos temporales del registro de activación." },
    { text: "Instrucción: JMP 0x00FF8E", segment: "code", log: "Code: Saltos y bifurcaciones ejecutables residen en el bloque de código." },
    { text: "double local_delta = 0.05;", segment: "stack", log: "Stack: Variables efímeras declaradas localmente." }
];

// --- ESTADOS GLOBAL DEL JUEGO ---
let score = 0;
let stability = 100;
let currentPhase = 0; // 0 = bienvenida, 1 = semántico, 2 = intermedio, 3 = peephole, 4 = memoria, 5 = victoria
let phaseScore = 0;

// Variables específicas de fases
let activeSemanticChallenge = null;
let activeIntermediateChallenge = null;
let selectedPostfixTokens = [];
let activePeepholeChallenge = null;
let peepholeZappedCount = 0;
let phase3Timer = null;
let phase3SecondsLeft = 30;
let activeMemoryItem = null;

// --- ELEMENTOS DEL DOM ---
const logoBtn = document.getElementById('logoBtn');
const helpBtn = document.getElementById('helpBtn');
const muteBtn = document.getElementById('muteBtn');
const helpDrawer = document.getElementById('helpDrawer');
const closeHelpBtn = document.getElementById('closeHelpBtn');
const helpBackdrop = document.getElementById('helpBackdrop');

const stabilityBar = document.getElementById('stabilityBar');
const stabilityText = document.getElementById('stabilityText');
const scoreText = document.getElementById('scoreText');
const phaseText = document.getElementById('phaseText');
const logLines = document.getElementById('logLines');

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');

const gameScreen = document.getElementById('gameScreen');

// Pantallas
const screenWelcome = document.getElementById('screenWelcome');
const screenPhase1 = document.getElementById('screenPhase1');
const screenPhase2 = document.getElementById('screenPhase2');
const screenPhase3 = document.getElementById('screenPhase3');
const screenPhase4 = document.getElementById('screenPhase4');
const screenVictory = document.getElementById('screenVictory');

// Pantalla 1: Bienvenida
const startGameBtn = document.getElementById('startGameBtn');

// Pantalla 2: Semántico
const semanticCode = document.getElementById('semanticCode');
const semanticCorrectBtn = document.getElementById('semanticCorrectBtn');
const semanticIncorrectBtn = document.getElementById('semanticIncorrectBtn');
const semanticProgressText = document.getElementById('semanticProgressText');

// Pantalla 3: Intermedio
const phase2Desc = document.getElementById('phase2Desc');
const infixExpression = document.getElementById('infixExpression');
const translationSlots = document.getElementById('translationSlots');
const blocksContainer = document.getElementById('blocksContainer');
const resetPhase2Btn = document.getElementById('resetPhase2Btn');
const submitPhase2Btn = document.getElementById('submitPhase2Btn');
const intermediateProgressText = document.getElementById('intermediateProgressText');

// Pantalla 4: Peephole
const timerText = document.getElementById('timerText');
const peepholeGrid = document.getElementById('peepholeGrid');
const peepholeProgressText = document.getElementById('peepholeProgressText');

// Pantalla 5: Memoria
const fallingItem = document.getElementById('fallingItem');
const memoryProgressText = document.getElementById('memoryProgressText');

// Pantalla 6: Victoria
const playerTitle = document.getElementById('playerTitle');
const finalScore = document.getElementById('finalScore');
const restartGameBtn = document.getElementById('restartGameBtn');


// --- EVENTOS BASE ---

logoBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Control de Mute
muteBtn.addEventListener('click', () => {
    const isMuted = audio.toggleMute();
    if (isMuted) {
        muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Silenciado';
    } else {
        muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Sonido';
        audio.playBeep(700, 0.05);
    }
});

// Sidebar Drawer de Ayuda
helpBtn.addEventListener('click', () => {
    audio.playBeep(800, 0.05);
    helpDrawer.classList.add('open');
    helpBackdrop.classList.add('open');
});

const closeHelp = () => {
    helpDrawer.classList.remove('open');
    helpBackdrop.classList.remove('open');
};
closeHelpBtn.addEventListener('click', closeHelp);
helpBackdrop.addEventListener('click', closeHelp);


// --- LÓGICA DE ACTUALIZACIÓN DEL PANEL ---

function addLog(text, type = 'text-info') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.innerText = `> ${text}`;
    logLines.appendChild(line);
    logLines.scrollTop = logLines.scrollHeight;
    
    // Suave sonido tic-tac para el log
    if (type === 'text-success') audio.playBeep(1200, 0.08);
    else if (type === 'text-error') audio.playBeep(250, 0.15);
    else audio.playBeep(900, 0.03);
}

function updateHUD() {
    scoreText.innerText = String(score).padStart(4, '0');
    stabilityText.innerText = `${stability}%`;
    stabilityBar.style.width = `${stability}%`;

    // Cambiar color de barra de estabilidad en base al %
    if (stability <= 25) {
        stabilityBar.style.boxShadow = '0 0 15px #ff3131';
    } else if (stability <= 50) {
        stabilityBar.style.boxShadow = '0 0 15px #ffea00';
    } else {
        stabilityBar.style.boxShadow = '0 0 15px #39ff14';
    }

    if (currentPhase > 0 && currentPhase <= 4) {
        phaseText.innerText = `${currentPhase} / 4`;
    } else {
        phaseText.innerText = '---';
    }

    // Actualizar estados visuales de los steps en sidebar
    const steps = [step1, step2, step3, step4];
    steps.forEach((step, idx) => {
        const stepNum = idx + 1;
        step.classList.remove('active', 'completed');
        if (currentPhase === stepNum) {
            step.classList.add('active');
        } else if (currentPhase > stepNum) {
            step.classList.add('completed');
        }
    });

    // Validar caída fatal de estabilidad
    if (stability <= 0) {
        triggerCompilerCollapse();
    }
}

// Sacudir la pantalla al cometer errores
function triggerScreenShake() {
    gameScreen.classList.add('screen-shake');
    setTimeout(() => {
        gameScreen.classList.remove('screen-shake');
    }, 400);
}

// Ajustar estabilidad
function adjustStability(amount) {
    stability = Math.max(0, Math.min(100, stability + amount));
    updateHUD();
}


// --- FLUJO DE TRANSICIÓN DE PANTALLAS ---

function showScreen(screenId) {
    const screens = [screenWelcome, screenPhase1, screenPhase2, screenPhase3, screenPhase4, screenVictory];
    screens.forEach(screen => screen.classList.remove('active'));
    screenId.classList.add('active');
}

function changePhase(newPhase) {
    // Limpiar temporizadores
    if (phase3Timer) {
        clearInterval(phase3Timer);
        phase3Timer = null;
    }

    currentPhase = newPhase;
    phaseScore = 0;

    switch (newPhase) {
        case 1:
            addLog("Módulo 1 de Diagnóstico en línea. Analizando gramáticas semánticas...", "text-info");
            initPhase1();
            showScreen(screenPhase1);
            break;
        case 2:
            addLog("Módulo 2 de Diagnóstico en línea. Procesando código intermedio...", "text-info");
            initPhase2();
            showScreen(screenPhase2);
            break;
        case 3:
            addLog("Módulo 3 en línea. ADVERTENCIA: Bloques redundantes sobrecargando registros.", "text-warning");
            initPhase3();
            showScreen(screenPhase3);
            break;
        case 4:
            addLog("Módulo 4 en línea. Asignando variables al controlador de memoria física.", "text-info");
            initPhase4();
            showScreen(screenPhase4);
            break;
        case 5:
            addLog("Núcleo completamente reparado. Generando reporte...", "text-success");
            initVictory();
            showScreen(screenVictory);
            break;
    }
    updateHUD();
}


// --- GESTIÓN DE FALLOS CRÍTICOS (GAME OVER / REBOOT) ---

function triggerCompilerCollapse() {
    audio.playFailure();
    triggerScreenShake();
    
    // Parar timer si aplica
    if (phase3Timer) {
        clearInterval(phase3Timer);
        phase3Timer = null;
    }

    addLog(`!!! NÚCLEO COLAPSADO EN FASE ${currentPhase} !!! REBOOTING NODE...`, "text-error");

    // Permitir reiniciar el nivel actual con estabilidad restaurada
    alert(`🔴 El núcleo del compilador se ha desestabilizado (0%). Reiniciando diagnóstico en la Fase ${currentPhase} para re-calibrar.`);
    
    stability = 100;
    phaseScore = 0;
    
    // Relanzar la fase actual
    changePhase(currentPhase);
}


// --- IMPLEMENTACIÓN: FASE 1 - ANÁLISIS SEMÁNTICO ---

function initPhase1() {
    phaseScore = 0;
    semanticProgressText.innerText = "0 / 100";
    loadNewSemanticChallenge();
}

function loadNewSemanticChallenge() {
    const randomIndex = Math.floor(Math.random() * SEMANTIC_CHALLENGES.length);
    activeSemanticChallenge = SEMANTIC_CHALLENGES[randomIndex];
    semanticCode.innerText = activeSemanticChallenge.code;
}

function handleSemanticAnswer(userAnswerCorrect) {
    if (userAnswerCorrect === activeSemanticChallenge.correct) {
        audio.playSuccess();
        score += 20;
        phaseScore += 20;
        adjustStability(10);
        addLog(activeSemanticChallenge.log, "text-success");
    } else {
        audio.playFailure();
        triggerScreenShake();
        adjustStability(-20);
        addLog(`ERROR SEMÁNTICO MAL EVALUADO. ${activeSemanticChallenge.log}`, "text-error");
    }

    semanticProgressText.innerText = `${phaseScore} / 100`;
    updateHUD();

    if (phaseScore >= 100) {
        addLog("Diagnóstico semántico exitoso. Estabilidad de tipos en orden.", "text-success");
        setTimeout(() => {
            changePhase(2);
        }, 1200);
    } else {
        setTimeout(loadNewSemanticChallenge, 800);
    }
}

semanticCorrectBtn.addEventListener('click', () => handleSemanticAnswer(true));
semanticIncorrectBtn.addEventListener('click', () => handleSemanticAnswer(false));


// --- IMPLEMENTACIÓN: FASE 2 - CÓDIGO INTERMEDIO (POSTFIJO) ---

function initPhase2() {
    phaseScore = 0;
    intermediateProgressText.innerText = "0 / 100";
    loadNewIntermediateChallenge();
}

function loadNewIntermediateChallenge() {
    selectedPostfixTokens = [];
    translationSlots.innerHTML = '<span class="placeholder-slot">Selecciona los bloques de abajo...</span>';
    
    const randomIndex = Math.floor(Math.random() * INTERMEDIATE_CHALLENGES.length);
    activeIntermediateChallenge = INTERMEDIATE_CHALLENGES[randomIndex];
    
    infixExpression.innerText = activeIntermediateChallenge.infix;
    phase2Desc.innerText = activeIntermediateChallenge.desc;

    // Crear bloques en orden aleatorio
    blocksContainer.innerHTML = '';
    const shuffledTokens = [...activeIntermediateChallenge.tokens].sort(() => Math.random() - 0.5);
    
    shuffledTokens.forEach(token => {
        const btn = document.createElement('button');
        btn.className = 'token-block';
        btn.innerText = token;
        btn.addEventListener('click', () => selectTokenBlock(btn, token));
        blocksContainer.appendChild(btn);
    });
}

function selectTokenBlock(btn, token) {
    audio.playBeep(700, 0.05);
    
    // Si es el primer token, limpiar placeholders
    if (selectedPostfixTokens.length === 0) {
        translationSlots.innerHTML = '';
    }

    selectedPostfixTokens.push(token);
    btn.classList.add('disabled');

    // Añadir slot visual
    const slot = document.createElement('span');
    slot.className = 'translation-block';
    slot.innerText = token;
    translationSlots.appendChild(slot);
}

resetPhase2Btn.addEventListener('click', () => {
    audio.playBeep(400, 0.08);
    loadNewIntermediateChallenge();
});

submitPhase2Btn.addEventListener('click', () => {
    // Validar si la traducción coincide
    const expected = activeIntermediateChallenge.postfix;
    let isCorrect = (selectedPostfixTokens.length === expected.length);
    
    if (isCorrect) {
        for (let i = 0; i < expected.length; i++) {
            if (selectedPostfixTokens[i] !== expected[i]) {
                isCorrect = false;
                break;
            }
        }
    }

    if (isCorrect) {
        audio.playSuccess();
        score += 25;
        phaseScore += 25;
        adjustStability(15);
        addLog(`Código Intermedio Correcto: '${infixExpression.innerText}' se compiló en '${expected.join(" ")}'.`, "text-success");
    } else {
        audio.playFailure();
        triggerScreenShake();
        adjustStability(-20);
        addLog(`Código Intermedio Incorrecto. Se esperaba '${expected.join(" ")}'.`, "text-error");
    }

    intermediateProgressText.innerText = `${phaseScore} / 100`;
    updateHUD();

    if (phaseScore >= 100) {
        addLog("Notaciones intermedias validadas. Listo para optimizar.", "text-success");
        setTimeout(() => {
            changePhase(3);
        }, 1200);
    } else {
        setTimeout(loadNewIntermediateChallenge, 800);
    }
});


// --- IMPLEMENTACIÓN: FASE 3 - OPTIMIZACIÓN PEEPHOLE (ARCADE) ---

function initPhase3() {
    peepholeZappedCount = 0;
    phase3SecondsLeft = 30;
    timerText.innerText = "30s";
    peepholeProgressText.innerText = "0 / 4";
    
    loadNewPeepholeChallenge();
    
    // Iniciar temporizador
    phase3Timer = setInterval(() => {
        phase3SecondsLeft--;
        timerText.innerText = `${phase3SecondsLeft}s`;
        
        if (phase3SecondsLeft <= 5) {
            timerText.style.color = '#ff3131';
            timerText.style.boxShadow = '0 0 10px #ff3131';
            audio.playBeep(1000, 0.03);
        } else {
            timerText.style.color = 'var(--neon-yellow)';
            timerText.style.boxShadow = 'none';
        }

        if (phase3SecondsLeft <= 0) {
            clearInterval(phase3Timer);
            phase3Timer = null;
            addLog("TIEMPO AGOTADO. No pudiste optimizar los registros antes del desbordamiento.", "text-error");
            adjustStability(-35);
        }
    }, 1000);
}

function loadNewPeepholeChallenge() {
    peepholeGrid.innerHTML = '';
    
    const randomIndex = Math.floor(Math.random() * PEEPHOLE_CHALLENGES.length);
    activePeepholeChallenge = PEEPHOLE_CHALLENGES[randomIndex];
    
    activePeepholeChallenge.instructions.forEach(inst => {
        const row = document.createElement('div');
        row.className = 'peephole-row';
        if (inst.redundant) {
            row.classList.add('redundant-laser');
        }

        const textSpan = document.createElement('span');
        textSpan.className = 'inst-text';
        textSpan.innerText = inst.text;
        
        const laserSpan = document.createElement('span');
        laserSpan.className = 'laser-sight';
        laserSpan.innerText = inst.redundant ? "[💡 OPTIMIZABLE]" : "[✓ EFICIENTE]";

        row.appendChild(textSpan);
        row.appendChild(laserSpan);

        row.addEventListener('click', () => handlePeepholeClick(row, inst));
        peepholeGrid.appendChild(row);
    });
}

function handlePeepholeClick(row, inst) {
    if (row.classList.contains('zapped')) return;

    if (inst.redundant) {
        audio.playLaser();
        row.classList.add('zapped');
        peepholeZappedCount++;
        score += 25;
        addLog(inst.log, "text-success");
        peepholeProgressText.innerText = `${peepholeZappedCount} / 4`;
        
        // Comprobar victoria de fase
        if (peepholeZappedCount >= 4) {
            clearInterval(phase3Timer);
            phase3Timer = null;
            addLog("Optimizaciones aplicadas satisfactoriamente. Sobrecarga de registros solucionada.", "text-success");
            setTimeout(() => {
                changePhase(4);
            }, 1200);
        } else {
            // Si el bloque actual se queda sin redundancias, recargar otro
            const remainingRedundant = activePeepholeChallenge.instructions.some(i => i.redundant && !document.querySelectorAll('.peephole-row.redundant-laser.zapped').length);
            // Cargar otro juego para seguir zappeando
            setTimeout(() => {
                let allActiveZapped = true;
                const rows = peepholeGrid.querySelectorAll('.peephole-row');
                rows.forEach(r => {
                    if (r.classList.contains('redundant-laser') && !r.classList.contains('zapped')) {
                        allActiveZapped = false;
                    }
                });
                if (allActiveZapped) {
                    loadNewPeepholeChallenge();
                }
            }, 600);
        }
    } else {
        audio.playFailure();
        triggerScreenShake();
        adjustStability(-15);
        addLog(`ERROR: Destruiste instrucción válida: '${inst.text}'. Estabilidad del CPU comprometida.`, "text-error");
    }
}


// --- IMPLEMENTACIÓN: FASE 4 - CLASIFICADOR DE MEMORIA ---

function initPhase4() {
    phaseScore = 0;
    memoryProgressText.innerText = "0 / 100";
    loadNewMemoryItem();
}

function loadNewMemoryItem() {
    const randomIndex = Math.floor(Math.random() * MEMORY_ITEMS.length);
    activeMemoryItem = MEMORY_ITEMS[randomIndex];

    fallingItem.innerText = activeMemoryItem.text;
    fallingItem.classList.add('pop-change');
    setTimeout(() => {
        fallingItem.classList.remove('pop-change');
    }, 300);
}

// Configurar clics en los buckets de memoria
const bucketBtns = document.querySelectorAll('.bucket-btn');
bucketBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const selectedSegment = btn.getAttribute('data-segment');
        handleMemorySelection(selectedSegment);
    });
});

function handleMemorySelection(segment) {
    if (!activeMemoryItem) return;

    if (segment === activeMemoryItem.segment) {
        audio.playSuccess();
        score += 25;
        phaseScore += 25;
        adjustStability(10);
        addLog(activeMemoryItem.log, "text-success");
    } else {
        audio.playFailure();
        triggerScreenShake();
        adjustStability(-20);
        addLog(`ASIGNACIÓN FALLIDA. Se intentó guardar en '${segment.toUpperCase()}', pero reside en '${activeMemoryItem.segment.toUpperCase()}'.`, "text-error");
    }

    memoryProgressText.innerText = `${phaseScore} / 100`;
    updateHUD();

    if (phaseScore >= 100) {
        addLog("Generación de código objeto y mapeo de memoria físico completados.", "text-success");
        setTimeout(() => {
            changePhase(5);
        }, 1200);
    } else {
        setTimeout(loadNewMemoryItem, 800);
    }
}


// --- PANTALLA FINAL: VICTORIA ---

function initVictory() {
    audio.playWinFanfare();
    
    // Determinar título en base a score final
    let title = "INGENIERO DE COMPILADORES JUNIOR";
    if (score >= 450) {
        title = "ARQUITECTO DE LENGUAJES LEGENDARIO";
    } else if (score >= 380) {
        title = "INGENIERO DE COMPILADORES PRINCIPAL (STAFF)";
    } else if (score >= 300) {
        title = "INGENIERO DE COMPILADORES SENIOR";
    } else if (score >= 200) {
        title = "OPTIMIZADOR DE CÓDIGO EXPERTO";
    }

    playerTitle.innerText = title;
    finalScore.innerText = String(score).padStart(4, '0');
    
    addLog(`--- SISTEMA TOTALMENTE OPERATIVO --- PUNTAJE FINAL: ${score} PTS`, "text-success");
}


// --- FLUJO DE INICIO Y REINICIO ---

function startGame() {
    score = 0;
    stability = 100;
    
    logLines.innerHTML = '';
    addLog("Inicializando rutinas de arranque...", "text-info");
    addLog("Calibrando osciladores y pila semántica...", "text-info");
    
    setTimeout(() => {
        changePhase(1);
    }, 1000);
}

startGameBtn.addEventListener('click', () => {
    // Lanzar audio context en respuesta a acción de usuario
    audio.init();
    startGame();
});

restartGameBtn.addEventListener('click', () => {
    startGame();
});
