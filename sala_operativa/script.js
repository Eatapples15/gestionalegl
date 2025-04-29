import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';

// Your web app's Firebase configuration (assicurati che sia corretto)
const firebaseConfig = {
    apiKey: "AIzaSyDkVEFv5WIfIJYNqjWSRA5viFjhHr9Ps0c",
    authDomain: "glgest.firebaseapp.com",
    projectId: "glgest",
    storageBucket: "glgest.firebasestorage.app",
    messagingSenderId: "423155306554",
    appId: "1:423155306554:web:c598640f199e296d276503"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
        if (tipo === 'success') notifica.classList.add('success');
        if (tipo === 'error') notifica.classList.add('error');
        if (tipo === 'warning') notifica.classList.add('warning');
        notificheContainer.appendChild(notifica);
        setTimeout(() => {
            notifica.remove();
        }, 5000); // La notifica scompare dopo 5 secondi
    }

    // Funzione per recuperare le sedi da Firestore e popolare la select
    async function recuperaSedi() {
        try {
            const sediCollection = collection(db, 'sedi');
            const querySnapshot = await getDocs(sediCollection);
            sedeInterventoSelect.innerHTML = '<option value="">Seleziona Sede</option>';
            querySnapshot.forEach((doc) => {
                const sedeData = doc.data();
                const option = document.createElement('option');
                option.value = doc.id; // Usa l'ID del documento come valore
                option.textContent = sedeData.nome + (sedeData.indirizzo ? ` - ${sedeData.indirizzo}` : '');
                sedeInterventoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Errore nel recupero delle sedi da Firestore:', error);
            mostraNotifica('Errore nel caricamento delle sedi.', 'error');
        }
    }

    // Funzione per recuperare le squadre disponibili per una data sede da Firestore
    async function recuperaSquadre(sedeId) {
        squadraInterventoSelect.innerHTML = '<option value="">Seleziona Squadra</option>'; // Reset delle opzioni
        if (sedeId) {
            try {
                const squadreCollection = collection(db, 'squadre');
                const querySnapshot = await getDocs(squadreCollection);
                querySnapshot.forEach((doc) => {
                    const squadraData = doc.data();
                    // Assumi che ogni squadra abbia un campo 'sede_id' che corrisponde all'ID della sede
                    if (squadraData.sede_id === sedeId) {
                        const option = document.createElement('option');
                        option.value = doc.id; // Usa l'ID del documento come valore
                        option.textContent = squadraData.nome;
                        squadraInterventoSelect.appendChild(option);
                    }
                });
            } catch (error) {
                console.error('Errore nel recupero delle squadre da Firestore:', error);
                mostraNotifica('Errore nel caricamento delle squadre.', 'error');
            }
        }
    }

    // Evento change sulla select della sede per caricare le squadre
    sedeInterventoSelect.addEventListener('change', (event) => {
        const sedeId = event.target.value;
        recuperaSquadre(sedeId);
    });

    // Funzione per creare una nuova emergenza in Firestore
    async function creaNuovaEmergenza(formData) {
        try {
            const emergenzeCollection = collection(db, 'emergenze');
            const docRef = await setDoc(doc(emergenzeCollection), {
                ...formData,
                stato: 'attivo',
                diario: [],
                informazioni_utili: '',
                data_creazione: new Date().toISOString(),
            });
            mostraNotifica(`Emergenza "${formData.tipo}" creata con successo!`, 'success');
            formNuovaEmergenza.reset();
            caricaEventiAttivi(); // Ricarica la lista degli eventi attivi
        } catch (error) {
            console.error('Errore nella creazione dell\'emergenza in Firestore:', error);
            mostraNotifica('Errore nella creazione dell\'emergenza.', 'error');
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
        };

        await creaNuovaEmergenza(nuovaEmergenza);
    });

    // Funzione per caricare gli eventi attivi da Firestore e sottoscrivere agli aggiornamenti in tempo reale
    function caricaEventiAttivi() {
        const emergenzeCollection = collection(db, 'emergenze');
        // Query per ottenere solo gli eventi con stato 'attivo'
        const q = query(emergenzeCollection, where("stato", "==", "attivo"));

        onSnapshot(q, (snapshot) => {
            eventiAttivi = [];
            snapshot.forEach((doc) => {
                eventiAttivi.push({ id: doc.id, ...doc.data() });
            });
            renderEventiAttivi();
        }, (error) => {
            console.error('Errore nella sottoscrizione agli eventi attivi da Firestore:', error);
            mostraNotifica('Errore nel caricamento degli eventi attivi.', 'error');
        });
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

    // Funzione per caricare i dettagli di un evento specifico da Firestore
    async function caricaDettagliEvento(eventoId) {
        try {
            const eventoDocRef = doc(db, 'emergenze', eventoId);
            const docSnap = await getDoc(eventoDocRef);
            if (docSnap.exists()) {
                eventoSelezionato = { id: docSnap.id, ...docSnap.data() };
                renderDettagliEvento(eventoSelezionato);
                renderDiarioEvento(eventoSelezionato.diario);
                informazioniUtiliDiv.textContent = eventoSelezionato.informazioni_utili || '';
            } else {
                console.error(`Nessun evento trovato con ID: ${eventoId}`);
                mostraNotifica('Evento non trovato.', 'warning');
            }
        } catch (error) {
            console.error('Errore nel recupero dei dettagli dell\'evento da Firestore:', error);
            mostraNotifica('Errore nel caricamento dei dettagli dell\'evento.', 'error');
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
            <p><strong>Sede Intervento ID:</strong> ${evento.sede_intervento_id || 'N/A'}</p>
            <p><strong>Squadra Intervento ID:</strong> ${evento.squadra_intervento_id || 'N/A'}</p>
            <p><strong>Stato:</strong> ${evento.stato}</p>
            <p><strong>Data Creazione:</strong> ${new Date(evento.data_creazione).toLocaleString()}</p>
        `;
        // Potresti voler recuperare i nomi reali di sede e squadra usando i loro ID
        // facendo ulteriori query a Firestore.
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

    // Funzione per aggiungere una voce al diario dell'evento in Firestore
    async function aggiungiVoceDiario(eventoId, testo) {
        try {
            const eventoDocRef = doc(db, 'emergenze', eventoId);
            await updateDoc(eventoDocRef, {
                diario: arrayUnion({
                    testo: testo,
                    data: new Date().toISOString(),
                    operatore: 'OPERATORE_LOGGATO' // Dovresti gestire l'operatore loggato
                })
            });
            // Dopo l'aggiornamento, il listener onSnapshot in caricaDettagliEvento
            // si attiverà e aggiornerà automaticamente la modale.
            nuovaVoceDiarioInput.value = '';
        } catch (error) {
            console.error('Errore nell\'aggiunta della voce al diario in Firestore:', error);
            mostraNotifica('Errore nell\'aggiunta della voce al diario.', 'error');
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

    // --- Logica per il Dispatcher (Notifiche Real-time - Concettuale con Firestore) ---
    // Potresti "allertare" aggiornando un campo nell'oggetto evento su Firestore.
    // Un listener onSnapshot sui dettagli dell'evento o su una collezione separata
    // di "allarmi" potrebbe notificare gli utenti interessati in tempo reale.

    async function allertaSquadra(eventoId, squadraId) {
        try {
            const eventoDocRef = doc(db, 'emergenze', eventoId);
            await updateDoc(eventoDocRef, {
                squadra_allertata_id: squadraId,
                // Potresti aggiungere un timestamp di allerta, uno stato dell'allerta, ecc.
            });
            mostraNotifica(`Squadra ${squadraId} allertata per l'evento ${eventoId}.`, 'success');
            // Qui, un altro listener Firestore lato client (per i volontari/squadre)
            // potrebbe reagire a questo aggiornamento.
        } catch (error) {
            console.error('Errore nell\'invio dell\'allerta a Firestore:', error);
            mostraNotifica('Errore nell\'invio dell\'allerta.', 'error');
        }
    }

    // Potresti aggiungere un bottone nella modale dei dettagli dell'evento
    // per "Allertare Squadra" e collegarlo a questa funzione, passando
    // l'ID dell'evento e l'ID della squadra selezionata.

});
