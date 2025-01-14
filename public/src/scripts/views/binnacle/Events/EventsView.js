// @filename: EvetnsView.ts
import { Config } from "../../../Configs.js";
import { getEntityData, getEntitiesData, getUserInfo } from "../../../endpoints.js";
import { CloseDialog, renderRightSidebar, filterDataByHeaderType, inputObserver, generateCsv } from "../../../tools.js";
import { UIContentLayout, UIRightSidebar } from "./Layout.js";
import { UITableSkeletonTemplate } from "./Template.js";
// Local configs
const tableRows = Config.tableRows;
let currentPage = Config.currentPage;
const pageName = 'Eventos';
const currentUserData = async() => {
    const currentUser = await getUserInfo();
    const user = await getEntityData('User', `${currentUser.attributes.id}`);
    return user;
}
const getEvents = async () => {
    const currentUser = await currentUserData(); //usuario logueado
    const events = await getEntitiesData('Notification');
    // notificationType.name
    const removeVisitsFromList = events.filter((data) => data.notificationType.name !== "Visita");
    const removeVehicularFromList = removeVisitsFromList.filter((data) => data.notificationType.name !== 'Vehicular');
    const FCustomer = removeVehicularFromList.filter(async (data) => {
        const userCustomer = await getEntityData('User', `${data.user.id}`);
        userCustomer.customer.id === `${currentUser.customer.id}`
    });
    return FCustomer;
};
export class Events {
    constructor() {
        this.dialogContainer = document.getElementById('app-dialogs');
        this.siebarDialogContainer = document.getElementById('entity-editor-container');
        this.appContainer = document.getElementById('datatable-container');
        this.render = async () => {
            let eventsArray = await getEvents();
            this.appContainer.innerHTML = '';
            this.appContainer.innerHTML = UIContentLayout;
            // Getting interface elements
            const viewTitle = document.getElementById('view-title');
            const tableBody = document.getElementById('datatable-body');
            // Changing interface element content
            viewTitle.innerText = pageName;
            tableBody.innerHTML = UITableSkeletonTemplate.repeat(tableRows);
            // Exec functions
            this.load(tableBody, currentPage, eventsArray);
            this.searchNotes(tableBody, eventsArray);
            new filterDataByHeaderType().filter();
            this.pagination(eventsArray, tableRows, currentPage);
            this.export();
            // Rendering icons
        };
        this.load = (tableBody, currentPage, events) => {
            tableBody.innerHTML = ''; // clean table
            // configuring max table row size
            currentPage--;
            let start = tableRows * currentPage;
            let end = start + tableRows;
            let paginatedItems = events.slice(start, end);
            // Show message if page is empty
            if (events.length === 0) {
                let row = document.createElement('TR');
                row.innerHTML = `
            <td>No existen datos<td>
            <td></td>
            <td></td>
            `;
                tableBody.appendChild(row);
            }
            else {
                for (let i = 0; i < paginatedItems.length; i++) {
                    let event = paginatedItems[i]; // getting note items
                    let row = document.createElement('TR');
                    row.innerHTML += `
                    <td>${event.title}</td>
                    <td>${event.description}</td>
                    <td id="table-date">${event.creationDate}</td>
                    <td>
                        <button class="button" id="entity-details" data-entityId="${event.id}">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                    </td>
                `;
                    tableBody.appendChild(row);
                    this.previewEvent(event.id);
                    // TODO: Corret this fixer
                    // fixDate()
                }
            }
        };
        this.searchNotes = async (tableBody, events) => {
            const search = document.getElementById('search');
            await search.addEventListener('keyup', () => {
                const arrayEvents = events.filter((event) => `${event.title}
                ${event.description}
                ${event.creationDate}`
                    .toLowerCase()
                    .includes(search.value.toLowerCase()));
                let filteredEvents = arrayEvents.length;
                let result = arrayEvents;
                if (filteredEvents >= Config.tableRows)
                    filteredEvents = Config.tableRows;
                this.load(tableBody, currentPage, result);
                this.pagination(result, tableRows, currentPage);
                // Rendering icons
            });
        };
        this.previewEvent = async (noteID) => {
            const openPreview = document.querySelectorAll('#entity-details');
            openPreview.forEach((preview) => {
                let currentEventId = preview.dataset.entityid;
                preview.addEventListener('click', () => {
                    previewBox(currentEventId);
                });
            });
            const previewBox = async (noteId) => {
                const event = await getEntityData('Notification', noteId);
                renderRightSidebar(UIRightSidebar);
                const sidebarContainer = document.getElementById('entity-editor-container');
                const closeSidebar = document.getElementById('close');
                closeSidebar.addEventListener('click', () => {
                    new CloseDialog().x(sidebarContainer);
                });
                // Event details
                const _details = {
                    title: document.getElementById('event-title'),
                    content: document.getElementById('event-content'),
                    author: document.getElementById('event-author'),
                    authorId: document.getElementById('event-author-id'),
                    date: document.getElementById('creation-date'),
                    time: document.getElementById('creation-time')
                };
                const eventCreationDateAndTime = event.creationDate.split('T');
                const eventCreationTime = eventCreationDateAndTime[1];
                const eventCreationDate = eventCreationDateAndTime[0];
                _details.title.innerText = event.title;
                _details.content.innerText = event.description;
                _details.author.value = `${event.user.firstName} ${event.user.lastName}`;
                _details.authorId.value = event.createdBy;
                _details.date.value = eventCreationDate;
                _details.time.value = event.creationTime;
            };
        };
        this.closeRightSidebar = () => {
            const closeButton = document.getElementById('close');
            const editor = document.getElementById('entity-editor-container');
            closeButton.addEventListener('click', () => {
                new CloseDialog().x(editor);
            });
        };
        this.export = () => {
            const exportNotes = document.getElementById('export-entities');
            exportNotes.addEventListener('click', async() => {
                this.dialogContainer.style.display = 'block';
                this.dialogContainer.innerHTML = `
                    <div class="dialog_content" id="dialog-content">
                        <div class="dialog">
                            <div class="dialog_container padding_8">
                                <div class="dialog_header">
                                    <h2>Seleccionar la fecha</h2>
                                </div>

                                <div class="dialog_message padding_8">
                                    <div class="form_group">
                                        <div class="form_input">
                                            <label class="form_label" for="start-date">Desde:</label>
                                            <input type="date" class="input_date input_date-start" id="start-date" name="start-date">
                                        </div>
                        
                                        <div class="form_input">
                                            <label class="form_label" for="end-date">Hasta:</label>
                                            <input type="date" class="input_date input_date-end" id="end-date" name="end-date">
                                        </div>
                                    </div>
                                </div>

                                <div class="dialog_footer">
                                    <button class="btn btn_primary" id="cancel">Cancelar</button>
                                    <button class="btn btn_danger" id="export-data">Exportar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                let fecha = new Date(); //Fecha actual
                let mes = fecha.getMonth()+1; //obteniendo mes
                let dia = fecha.getDate(); //obteniendo dia
                let anio = fecha.getFullYear(); //obteniendo año
                if(dia<10)
                    dia='0'+dia; //agrega cero si el menor de 10
                if(mes<10)
                    mes='0'+mes //agrega cero si el menor de 10

                document.getElementById("start-date").value = anio+"-"+mes+"-"+dia;
                document.getElementById("end-date").value = anio+"-"+mes+"-"+dia;
                inputObserver();
                const _closeButton = document.getElementById('cancel');
                const exportButton = document.getElementById('export-data');
                const _dialog = document.getElementById('dialog-content');
                exportButton.addEventListener('click', async() => {
                    let rows = [];
                    const _values = {
                        start: document.getElementById('start-date'),
                        end: document.getElementById('end-date'),
                    }
                    const events = await getEvents();
                    for(let i=0; i < events.length; i++){
                        let event = events[i]
                        if(event.creationDate >= _values.start.value && event.creationDate <= _values.end.value){
                            let obj = {
                                "Título": `${event.title.split("\n").join("(salto)")}`,
                                "Fecha": `${event.creationDate}`,
                                "Hora": `${event.creationTime}`,
                                "Usuario": `${event.user.firstName} ${event.user.lastName}`,
                                "Descripción": `${event.description.split("\n").join("(salto)")}`
                              }
                              rows.push(obj);
                        }
                        
                    }
                    generateCsv(rows, "Eventos");
                    
                    
                });
                _closeButton.onclick = () => {
                    new CloseDialog().x(_dialog);
                };
            });
        };
    }
    pagination(items, limitRows, currentPage) {
        const tableBody = document.getElementById('datatable-body');
        const paginationWrapper = document.getElementById('pagination-container');
        paginationWrapper.innerHTML = '';
        let pageCount;
        pageCount = Math.ceil(items.length / limitRows);
        let button;
        for (let i = 1; i < pageCount + 1; i++) {
            button = setupButtons(i, items, currentPage, tableBody, limitRows);
            paginationWrapper.appendChild(button);
        }
        function setupButtons(page, items, currentPage, tableBody, limitRows) {
            const button = document.createElement('button');
            button.classList.add('pagination_button');
            button.innerText = page;
            button.addEventListener('click', () => {
                currentPage = page;
                new Events().load(tableBody, page, items);
            });
            return button;
        }
    }
}
