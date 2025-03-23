const ludo = document.getElementById('ludo');
const mondo = document.getElementById('mondo');
const loadingDiv = document.getElementById('loading');
let posizioneX = 50; // Inizializza la posizione X del personaggio
let posizioneY = 0;
let velocitaSalto = 15;
let gravita = 0.8;
let staSaltando = false;
let movimentoAttivo = {
    sinistra: false,
    destra: false
};
let potereAttivo = false;
let puntiVita = 100;
let puntiMagia = 50;

// Audio
const audioSalto = new Audio('https://dl.dropboxusercontent.com/scl/fi/v9l33zlyyuq9cjb46axtz/SALTO.mp3?rlkey=d3v02mr5jzkq6qo7hlr67tir6&st=8vdaby30&dl=0');
const audioPotere = new Audio('https://dl.dropboxusercontent.com/scl/fi/d9xfdoy0k188jkc6vuiz2/TRASFORMAZIONE.mp3?rlkey=qebj4k1mwc24vjjchd7ynthde&st=iuqccy3a&dl=0');
const audioAzioneMagica = new Audio('https://dl.dropboxusercontent.com/scl/fi/jinys4bwayfujyx7fa9ea/MUORI.mp3?rlkey=gcwbchd4y4szx41mlpwqkdbp2&st=ry2psdef&dl=0');
const audioMovimentoNemico = new Audio('https://dl.dropboxusercontent.com/scl/fi/3tfcilsqjeicef1nwo826/Mostro-verso.mp3?rlkey=bp1zk7x2lb5ryuco0agubvtt7&st=o9mwju15&dl=0');
const audioAttaccoNemico = new Audio('https://dl.dropboxusercontent.com/scl/fi/t7h7rzokjbjgyk53k9m4g/Mostro-attacco.mp3?rlkey=2264shragrcmuu8zzesivll6c&st=9g20ffvy&dl=0');

// Variabili per i nemici
const nemici = [];
const larghezzaMondo = 800;
const immaginiSfondo = [
    'url("https://dl.dropboxusercontent.com/scl/fi/1f8lx9cczvjy67ble25vz/SFONDO1.png?rlkey=6nrwyccs6jjysqy8wup1i783u&st=jfd6m0y4&dl=0")',
    'url("https://dl.dropboxusercontent.com/scl/fi/95wo00n4u6a2t8503p05l/SFONDO-2.png?rlkey=qo7zhvx210y9hmq03exr2pilr&st=p09w49g6&dl=0")',
    'url("https://dl.dropboxusercontent.com/scl/fi/cibkiq29wwtlmbqfgaiqr/SFONDO-3.png?rlkey=o4x9u0msuwtxq9418dfbncjdu&st=dv727fbw&dl=0")',
    'url("https://dl.dropboxusercontent.com/scl/fi/pt8jcvjzc0fv7bafev1q2/SFONDO-4.png?rlkey=nrnzz42ekpteqmsu9pual58ic&st=0yv24sqg&dl=0")',
    'url("https://dl.dropboxusercontent.com/scl/fi/ibwiyg1ez60kpecn55tw9/SFONDO-5.png?rlkey=qmf1saf4obmlf5mq24boc6skz&st=8y6t6ws6&dl=0")'
];

// Caricamento delle immagini e audio
const risorse = [
    ludo.style.backgroundImage = "url('https://dl.dropboxusercontent.com/scl/fi/idtedty2ujtjhv5tde297/LUDO-MAGA-CAMMINA-DESTRA.png?rlkey=dgocaeqiuw285knrq7nholdub&st=zn0n1348&dl=0')",
    audioSalto,
    audioPotere,
    audioAzioneMagica,
    audioMovimentoNemico,
    audioAttaccoNemico,
    ...immaginiSfondo.map(img => new Image().src = img)
];

Promise.all(risorse.map(resource => {
    return new Promise((resolve) => {
        if (resource instanceof Audio) {
            resource.addEventListener('canplaythrough', resolve);
        } else if (typeof resource === 'string') {
            const img = new Image();
            img.src = resource;
            img.onload = resolve;
            img.onerror = () => resolve(); // Continua anche se c'è un errore
        } else {
            resolve();
        }
    });
})).then(() => {
    loadingDiv.style.display = 'none'; // Nascondi il messaggio di caricamento
    mondo.style.display = 'block'; // Mostra il mondo di gioco
    document.querySelector('.joystick-container').style.display = 'block'; // Mostra il joystick
    aggiornaGioco(); // Avvia il gioco
}).catch((error) => {
    console.error("Errore nel caricamento delle risorse:", error);
    loadingDiv.innerHTML = "Errore nel caricamento delle risorse. Riprova."; // Mostra un messaggio di errore
});

// Funzione per generare un nemico con immagine
function generaNemico(x, y) {
    const nemico = document.createElement('div');
    nemico.className = 'nemico';
    nemico.style.position = 'absolute';
    nemico.style.left = `${x}px`;
    nemico.style.bottom = `${y}px`;
    nemico.style.width = '50px';
    nemico.style.height = '50px';
    nemico.style.backgroundSize = 'cover';
    nemico.style.backgroundImage = "url('https://raw.githubusercontent.com/frastud/LBG/main/nemicosinistra.png')";
    document.getElementById('mondo').appendChild(nemico);
    nemici.push({
        elemento: nemico,
        direzione: 'destra',
        puntiVita: 50,
        puntiMagia: 20
    });
}

function aggiornaImmagineNemico(nemico) {
    if (nemico.direzione === 'destra') {
        nemico.elemento.style.backgroundImage = "url('https://raw.githubusercontent.com/frastud/LBG/main/nemicosinistra.png')";
    } else {
        nemico.elemento.style.backgroundImage = "url('https://raw.githubusercontent.com/frastud/LBG/main/MOSTRO.png')";
    }
}

function muoviNemici() {
    nemici.forEach(nemico => {
        const distanza = Math.abs(posizioneX - parseInt(nemico.elemento.style.left));
        if (distanza < 100) {
            nemico.direzione = posizioneX < parseInt(nemico.elemento.style.left) ? 'sinistra' : 'destra';
            aggiornaImmagineNemico(nemico);
            audioMovimentoNemico.play(); // Riproduci audio movimento nemico
            if (distanza < 50) {
                attaccaGiocatore(nemico);
            }
        }
        // Muovi il nemico verso il personaggio
        if (nemico.direzione === 'destra') {
            nemico.elemento.style.left = (parseInt(nemico.elemento.style.left) + 1) + 'px';
        } else {
            nemico.elemento.style.left = (parseInt(nemico.elemento.style.left) - 1) + 'px';
        }
    });
}

function attaccaGiocatore(nemico) {
    puntiVita -= 10;
    audioAttaccoNemico.play(); // Riproduci audio attacco nemico
    nemico.elemento.style.backgroundImage = nemico.direzione === 'destra' ? "url('https://raw.githubusercontent.com/frastud/LBG/main/N-ATTACCO.D.gif')" : "url('https://raw.githubusercontent.com/frastud/LBG/main/N-ATTACCO.S.gif')";
}

// Funzioni per il movimento
function muoviSinistra() {
    if (posizioneX > 0) {
        posizioneX -= 10;
    }
}

function muoviDestra() {
    if (posizioneX < 800 - 100) { // 800 è la larghezza del mondo, 100 è la larghezza del personaggio
        posizioneX += 10;
    }
}

function salta() {
    if (!staSaltando) {
        staSaltando = true;
        velocitaSalto = 15;
        audioSalto.play(); // Riproduci audio salto
    }
}

function attivaPotere() {
    potereAttivo = !potereAttivo;
    aggiornaImmagine();
    audioPotere.play(); // Riproduci audio attivazione potere

    // Mostra o nascondi i pulsanti di azione potere e azione magica
    const azioneMagicaButton = document.getElementById('azioneMagica');
    const azionePotereButton = document.getElementById('azionePotere');
    if (potereAttivo) {
        azioneMagicaButton.classList.remove('hidden');
        azionePotereButton.classList.remove('hidden');
    } else {
        azioneMagicaButton.classList.add('hidden');
        azionePotereButton.classList.add('hidden');
    }
}

// Nuova funzione per l'azione magica
function azioneMagica() {
    if (potereAttivo && puntiMagia >= 10) {
        puntiMagia -= 10;
        audioAzioneMagica.play(); // Riproduci audio azione magica
        const azioneMagicaImg = movimentoAttivo.destra ? "url('https://raw.githubusercontent.com/frastud/LBG/main/MAGIA%20DA%20DESTRA.gif')" : "url('https://raw.githubusercontent.com/frastud/LBG/main/MAGIA%20DA%20SINISTRA.gif')";
        ludo.style.backgroundImage = azioneMagicaImg;

        // Ripristina l'immagine dopo un breve periodo
        setTimeout(() => {
            aggiornaImmagine();
        }, 500); // Durata dell'animazione
    }
}

function aggiornaImmagine() {
    if (movimentoAttivo.destra) {
        ludo.style.backgroundImage = potereAttivo ? "url('https://raw.githubusercontent.com/frastud/LBG/main/LUDOMORTEDESTRA.png')" : "url('https://raw.githubusercontent.com/frastud/LBG/main/LUDO%20MAGA%20CAMMINA%20DESTRA.png')";
    } else if (movimentoAttivo.sinistra) {
        ludo.style.backgroundImage = potereAttivo ? "url('https://raw.githubusercontent.com/frastud/LBG/main/LUDOMORTESINISTRA.png')" : "url('https://raw.githubusercontent.com/frastud/LBG/main/LUDO%20MAGA%20CAMMINA%20SINISTRA.png')";
    } else {
        ludo.style.backgroundImage = potereAttivo ? "url('https://raw.githubusercontent.com/frastud/LBG/main/LUDOMORTEDESTRA.png')" : "url('https://raw.githubusercontent.com/frastud/LBG/main/LUDO%20MAGA%20CAMMINA%20DESTRA.png')";
    }
}

function aggiornaGioco() {
    if (movimentoAttivo.sinistra) {
        muoviSinistra();
    }
    if (movimentoAttivo.destra) {
        muoviDestra();
    }

    if (staSaltando) {
        posizioneY += velocitaSalto;
        velocitaSalto -= gravita;

        if (posizioneY <= 0) {
            posizioneY = 0;
            staSaltando = false;
        }
    }

    ludo.style.left = `${posizioneX}px`; // Mantieni il giocatore nella posizione X
    ludo.style.bottom = posizioneY + 'px';

    aggiornaImmagine();
    muoviNemici();
    requestAnimationFrame(aggiornaGioco);
}

// Gestione eventi touch per il movimento
document.getElementById('sinistra').addEventListener('touchstart', () => {
    movimentoAttivo.sinistra = true;
});

document.getElementById('destra').addEventListener('touchstart', () => {
    movimentoAttivo.destra = true;
});

document.getElementById('salto').addEventListener('touchstart', salta);
document.getElementById('potere').addEventListener('touchstart', attivaPotere);

// Nuovo evento per il tasto azione sul potere
document.getElementById('azioneMagica').addEventListener('touchstart', azioneMagica);

// Nuovo evento per il tasto touch azione potere
document.getElementById('azionePotere').addEventListener('touchstart', attivaPotere);

document.addEventListener('touchend', (evento) => {
    if (evento.target.id === 'sinistra') {
        movimentoAttivo.sinistra = false;
    } else if (evento.target.id === 'destra') {
        movimentoAttivo.destra = false;
    }
});

// Gestione eventi tastiera per il movimento
document.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowRight') {
        movimentoAttivo.destra = true;
    } else if (evento.key === 'ArrowLeft') {
        movimentoAttivo.sinistra = true;
    } else if (evento.key === 'ArrowUp') {
        salta();
    } else if (evento.key === 'a') {
        attivaPotere();
    } else if (evento.key === ' ') { // Spazio come tasto azione magica
        azioneMagica();
    }
});

document.addEventListener('keyup', (evento) => {
    if (evento.key === 'ArrowRight') {
        movimentoAttivo.destra = false;
    } else if (evento.key === 'ArrowLeft') {
        movimentoAttivo.sinistra = false;
    }
});

// Genera nemici iniziali
generaNemico(200, 0);
generaNemico(400, 0);