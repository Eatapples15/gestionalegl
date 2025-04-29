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

    // Funzione per recuperare le sedi dal database e popolare la select
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
                });
            } else {
                console.error('Errore nel recupero delle sedi.');
                mostraNotifica('Errore nel caricamento delle sedi.', 'error');
            }
        } catch (error) {
            console.error('Impossibile connettersi al server per le sedi.', error);
            mostraNotifica('Impossibile caricare le sedi.', 'error');
        }
    }

    // Funzione per recuperare le squadre disponibili per una data sede
    async function recuperaSquadre(sedeId) {
        squadraInterventoSelect.innerHTML = '<option value="">Seleziona Squadra</option>'; // Reset delle opzioni
        if (sedeId) {
            try {
                const response = await fetch(`/api/sedi/${sedeId}/squadre`); // Endpoint API per le squadre della sede
                if (response.ok) {
                    const squadre = await response.json();
                    squadre.forEach(squadra => {
                        const option = document.createElement('option');
                        option.value = squadra.id;
                        option.textContent = squadra.nome;
                        squadraInterventoSelect.appendChild(option);
                    });
                } else {
                    console.error('Errore nel recupero delle squadre per la sede.', response.status);
                    mostraNotifica('Errore nel caricamento delle squadre.', 'error');
                }
            } catch (error) {
                console.error('Impossibile connettersi al server per le squadre.', error);
                mostraNotifica('Impossibile caricare le squadre.', 'error');
            }
        }
    }

    // Evento change sulla select della sede per caricare le squadre
    sedeInterventoSelect.addEventListener('change', (event) => {
        const sedeId = event.target.value;
        recuperaSquadre(sedeId);
    });

    // Funzione per creare una nuova emergenza
    async function creaNuovaEmergenza(formData) {
        try {
            const response = await fetch('/api/emergenze', { // Endpoint API per creare emergenze
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const nuovaEmergenza = await response.json();
                mostraNotifica(`Emergenza "${nuovaEmergenza.tipo}" creata con successo!`, 'success');
                formNuovaEmergenza.reset();
                caricaEventiAttivi(); // Ricarica la lista degli eventi attivi
            } else {
                console.error('Errore nella creazione dell\'emergenza.', response.status);
                mostraNotifica('Errore nella creazione dell\'emergenza.', 'error');
            }
        } catch (error) {
            console.error('Impossibile connettersi al server per creare l\'emergenza.', error);
            mostraNotifica('Impossibile creare l\'emergenza.', 'error');
        }
    }

    // Evento submit del form per la nuova emergenza
    formNuovaEmergenza.addEventListener('submit', async (event) => {
        event.preventDefault();
        const tipo = document.getElementById('tipo-emergenza').value;
        const descrizione = document.getElementById('descrizione').value;
        const localita = document.getElementById('localita').value;
        const coordinate = document.getElementById('coordinate').value;
        const priorita = document.getElementById('priorita').value;
        const sedeInterventoId = sedeInterventoSelect.value;
        const squadraInterventoId = squadraInterventoSelect.value;

        const nuovaEmergenza = {
            tipo,
            descrizione,
            localita,
            coordinate,
            priorita,
            sede_intervento_id: sedeInterventoId,
            squadra_intervento_id: squadraInterventoId,
            stato: 'attivo', // Imposta lo stato iniziale
            diario: [],
            informazioni_utili: '',
            data_creazione: new Date().toISOString(),
        };

        await creaNuovaEmergenza(nuovaEmergenza);
    });

    // Funzione per caricare gli eventi attivi dal database
    async function caricaEventiAttivi() {
        try {
            const response = await fetch('/api/emergenze/attive'); // Endpoint API per gli eventi attivi
            if (response.ok) {
                eventiAttivi = await response.json();
                renderEventiAttivi();
            } else {
                console.error('Errore nel recupero degli eventi attivi.', response.status);
                mostraNotifica('Errore nel caricamento degli eventi attivi.', 'error');
            }
        } catch (error) {
            console.error('Impossibile connettersi al server per gli eventi attivi.', error);
            mostraNotifica('Impossibile caricare gli eventi attivi.', 'error');
        }
    }

    // Funzione per renderizzare la lista degli eventi attivi
    function renderEventiAttivi() {
        listaEventiAttivi.innerHTML = '';
        eventiAttivi.forEach(evento => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${evento.tipo} - ${evento.localita} (${evento.priorita})</span>
                <button class="dettagli-evento-btn" data-evento-id="${evento.id}">Dettagli</button>
            `;
            listaEventiAttivi.appendChild(listItem);
        });

        // Aggiungi event listener ai bottoni "Dettagli"
        const dettagliBtns = document.querySelectorAll('.dettagli-evento-btn');
        dettagliBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const eventoId = btn.dataset.eventoId;
                await caricaDettagliEvento(eventoId);
                modalDettagliEvento.style.display = 'block';
            });
        });
    }

    // Funzione per caricare i dettagli di un evento specifico
    async function caricaDettagliEvento(eventoId) {
        try {
            const response = await fetch(`/api/emergenze/${eventoId}`); // Endpoint API per i dettagli dell'evento
            if (response.ok) {
                eventoSelezionato = await response.json();
                renderDettagliEvento(eventoSelezionato);
                renderDiarioEvento(eventoSelezionato.diario);
                informazioniUtiliDiv.textContent = eventoSelezionato.informazioni_utili || '';
            } else {
                console.error(`Errore nel recupero dei dettagli dell'evento ${eventoId}.`, response.status);
                mostraNotifica('Errore nel caricamento dei dettagli dell\'evento.', 'error');
            }
        } catch (error) {
            console.error('Impossibile connettersi al server per i dettagli dell\'evento.', error);
            mostraNotifica('Impossibile caricare i dettagli dell\'evento.', 'error');
        }
    }

    // Funzione per renderizzare i dettagli dell'evento nella modale
    function renderDettagliEvento(evento) {
        dettagliEventoContainer.innerHTML = `
            <p><strong>Tipo:</strong> ${evento.tipo}</p>
            <p><strong>Descrizione:</strong> ${evento.descrizione}</p>
            <p><strong>Località:</strong> ${evento.localita}</p>
            <p><strong>Coordinate:</strong> ${evento.coordinate || 'N/A'}</p>
            <p><strong>Priorità:</strong> ${evento.priorita}</p>
            <p><strong>Sede Intervento:</strong> ${evento.sede_intervento ? evento.sede_intervento.nome : 'N/A'}</p>
            <p><strong>Squadra Intervento:</strong> ${evento.squadra_intervento ? evento.squadra_intervento.nome : 'N/A'}</p>
            <p><strong>Stato:</strong> ${evento.stato}</p>
            <p><strong>Data Creazione:</strong> ${new Date(evento.data_creazione).toLocaleString()}</p>
        `;
    }

    // Funzione per renderizzare il diario dell'evento
    function renderDiarioEvento(diario) {
        diarioEventoLista.innerHTML = '';
        diario.forEach(voce => {
            const listItem = document.createElement('li');
            listItem.textContent = `${new Date(voce.data).toLocaleString()} - ${voce.testo} (Operatore: ${voce.operatore})`;
            diarioEventoLista.appendChild(listItem);
        });
    }

    // Funzione per aggiungere una voce al diario dell'evento
    async function aggiungiVoceDiario(eventoId, testo) {
        try {
            const response = await fetch(`/api/emergenze/${eventoId}/diario`, { // Endpoint API per aggiungere al diario
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ testo }),
            });

            if (response.ok) {
                const updatedEvento = await response.json();
                renderDiarioEvento(updatedEvento.diario);
                nuovaVoceDiarioInput.value = '';
            } else {
                console.error('Errore nell\'aggiunta della voce al diario.', response.status);
                mostraNotifica('Errore nell\'aggiunta della voce al diario.', 'error');
            }
        } catch (error) {
            console.error('Impossibile connettersi al server per aggiungere al diario.', error);
            mostraNotifica('Impossibile aggiungere la voce al diario.', 'error');
        }
    }

    // Evento click sul bottone per aggiungere una voce al diario
    aggiungiVoceDiarioBtn.addEventListener('click', async () => {
        if (eventoSelezionato && nuovaVoceDiarioInput.value.trim() !== '') {
            await aggiungiVoceDiario(eventoSelezionato.id, nuovaVoceDiarioInput.value);
        } else if (!eventoSelezionato) {
            mostraNotifica('Nessun evento selezionato.', 'warning');
        } else {
            mostraNotifica('Inserisci del testo per la voce del diario.', 'warning');
        }
    });

    // Evento click sul bottone di chiusura della modale
    chiudiModalBtn.addEventListener('click', () => {
        modalDettagliEvento.style.display = 'none';
        eventoSelezionato = null; // Resetta l'evento selezionato quando la modale è chiusa
    });

    // Chiudi la modale se si clicca fuori
    window.addEventListener('click', (event) => {
        if (event.target === modalDettagliEvento) {
            modalDettagliEvento.style.display = 'none';
            eventoSelezionato = null;
        }
    });

    // Inizializzazione: carica le sedi e gli eventi attivi all'avvio
    recuperaSedi();
    caricaEventiAttivi();

    // --- Logica per il Dispatcher (Notifiche Real-time - Concettuale) ---
    // Per implementare un vero dispatcher real-time, avresti bisogno di:
    // 1. Una tecnologia real-time come WebSockets (Socket.IO, WebSocket API).
    // 2. Un sistema lato server che gestisce le connessioni e invia notifiche
    //    agli operatori/volontari interessati.
    //
    // Ecco un esempio concettuale di come potresti gestire l'invio di un'allerta:
    async function allertaSquadra(eventoId, squadraId) {
        try {
            const response = await fetch(`/api/emergenze/${eventoId}/allerta`, { // Endpoint API per l'allerta
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ squadra_id: squadraId }),
            });

            if (response.ok) {
                mostraNotifica(`Squadra ${squadraId} allertata per l'evento ${eventoId}.`, 'success');
                // Qui dovresti anche inviare una notifica real-time agli utenti (tramite WebSockets, ecc.)
            } else {
                console.error('Errore nell\'invio dell\'allerta.', response.status);
                mostraNotifica('Errore nell\'invio dell\'allerta.', 'error');
            }
        } catch (error) {
            console.error('Impossibile connettersi al server per l\'allerta.', error);
            mostraNotifica('Impossibile inviare l\'allerta.', 'error');
        }
    }

    // Potresti aggiungere un bottone nella modale dei dettagli dell'evento
    // per "Allertare Squadra" e collegarlo a questa funzione, passando
    // l'ID dell'evento e l'ID della squadra selezionata.

});
