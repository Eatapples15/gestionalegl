document.addEventListener('DOMContentLoaded', () => {
    const formNuovaEmergenza = document.getElementById('form-nuova-emergenza');
    const listaEventiAttivi = document.getElementById('lista-eventi-attivi');
    const notificheContainer = document.getElementById('notifiche-container');
    const modalDettagliEvento = document.getElementById('modal-dettagli-evento');
    const dettagliEventoContainer = document.getElementById('dettagli-evento-container');
    const diarioEventoLista = document.getElementById('diario-evento-lista');
    const nuovaVoceDiarioInput = document.getElementById('nuova-voce-diario');
    const aggiungiVoceDiarioBtn = document.getElementById('aggiungi-voce-diario-btn');
    const informazioniUtiliDiv = document.getElementById('informazioni-utili');
    const chiudiModalBtn = modalDettagliEvento.querySelector('.close-button');
    const sedeInterventoSelect = document.getElementById('sede-intervento');
    const squadraInterventoSelect = document.getElementById('squadra-intervento');

    let eventiAttivi = [];
    let eventoSelezionato = null;

    // Funzione per mostrare una notifica
    function mostraNotifica(messaggio, tipo = 'info') {
        const notifica = document.createElement('div');
        notifica.classList.add('notifica');
        notifica.textContent = messaggio;
        notificheContainer.appendChild(notifica);
        setTimeout(() => {
            notifica.remove();
        }, 5000); // La notifica scompare dopo 5 secondi
    }

    // Funzione per recuperare le sedi dal database
    async function recuperaSedi() {
        try {
            const response = await fetch('/api/sedi'); // Endpoint API per le sedi
            if (response.ok) {
                const sedi = await response.json();
                sedi.forEach(sede => {
                    const option = document.createElement('option');
                    option.value = sede.id;
                    option.textContent = sede.nome;
                    sedeInterventoSelect.appendChild(option);
