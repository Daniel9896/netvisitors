// @filename: SuperUsers.ts

import { deleteEntity, getEntitiesData, getEntityData, registerEntity, setPassword } from "../../../endpoints.js"
import { NUsers } from "../../../namespaces.js"
import { drawTagsIntoTables, inputObserver, inputSelect, CloseDialog } from "../../../tools.js"
import { InterfaceElement } from "../../../types.js"
import { Config } from "../../../Configs.js"
import { tableLayout } from "./Layout.js"
import { tableLayoutTemplate } from "./Templates.js"

const tableRows = Config.tableRows
const currentPage = Config.currentPage
const SUser = true


const getUsers = async (superUser: boolean): Promise<void> => {
    const users: any = await getEntitiesData('User')
    const FSuper: any = users.filter((data: any) => data.isSuper === superUser)
    // const SuperUsers: any = FSuper.filter((data: any) => `${data.userType}`.includes('CUSTOMER'))
    return FSuper
}

export class SuperUsers {
    private dialogContainer: InterfaceElement =
        document.getElementById('app-dialogs')

    private entityDialogContainer: InterfaceElement =
        document.getElementById('entity-editor-container')

    private content: InterfaceElement =
        document.getElementById('datatable-container')

    public async render(): Promise<void> {
        let data: any = await getUsers(SUser)
        this.content.innerHTML = ''
        this.content.innerHTML = tableLayout
        const tableBody: InterfaceElement = document.getElementById('datatable-body')

        tableBody.innerHTML = tableLayoutTemplate.repeat(tableRows)
        this.load(tableBody, currentPage, data)

        this.searchEntity(tableBody, data)
        this.pagination(data, tableRows, currentPage)
    }

    public load(table: InterfaceElement, currentPage: number, data: any) {
        table.innerHTML = ''
        currentPage--
        let start: number = tableRows * currentPage
        let end: number = start + tableRows
        let paginatedItems: any = data.slice(start, end)
        if (data.length === 0) {
            let row: InterfaceElement = document.createElement('tr')
            row.innerHTML = `
        <td>los datos no coinciden con su búsqueda</td>
        <td></td>
        <td></td>
      `
            table.appendChild(row)
        }
        else {
            for (let i = 0; i < paginatedItems.length; i++) {
                let client = paginatedItems[i]
                let row: InterfaceElement =
                    document.createElement('tr')
                row.innerHTML += `
          <td>${client.firstName} ${client.lastName}</dt>
          <td>${client.username}</dt>
          <td class="key"><button class="button" id="change-user-password"><i class="fa-regular fa-key"></i></button></td>
          <td class="tag"><span>${client.state.name}</span></td>

          <td class="entity_options">
            <button class="button" id="edit-entity" data-entityId="${client.id}">
              <i class="fa-solid fa-pen"></i>
            </button>

            <button class="button" id="remove-entity" data-entityId="${client.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </dt>
        `
                table.appendChild(row)
                drawTagsIntoTables()
            }
        }

        this.register()
        this.import()
        this.edit(this.entityDialogContainer, data)
        this.remove()
        this.convertToSuper()
        this.changeUserPassword()
    }

    public searchEntity = async (tableBody: InterfaceElement, data: any) => {
        const search: InterfaceElement = document.getElementById('search')

        await search.addEventListener('keyup', () => {
            const arrayData: any = data.filter((user: any) =>
                `${user.firstName}
                 ${user.lastName}
                 ${user.username}`
                    .toLowerCase()
                    .includes(search.value.toLowerCase())
            )

            let filteredResult = arrayData.length
            let result = arrayData
            if (filteredResult >= tableRows) filteredResult = tableRows

            this.load(tableBody, currentPage, result)

        })

    }

    private changeUserPassword(): void {
        const changeUserPasswordKeys: InterfaceElement = document.querySelectorAll('#change-user-password')
        changeUserPasswordKeys.forEach((buttonKey: InterfaceElement): void => {
            buttonKey.addEventListener('click', async (): Promise<void> => {
                let userId: string = buttonKey.dataset.userid
                this.dialogContainer.style.display = 'block'
                this.dialogContainer.innerHTML = `
                    <div class="dialog_content" id="dialog-content">
                        <div class="dialog">
                            <div class="dialog_container padding_8">
                                <div class="dialog_header">
                                    <h2>Actualizar contraseña</h2>
                                </div>

                                <div class="dialog_message padding_8">
                                    <div class="material_input">
                                        <input type="password" id="password" autocomplete="none">
                                        <label for="entity-lastname"><i class="fa-solid fa-lock"></i> Nueva contraseña</label>
                                    </div>

                                    <div class="material_input">
                                        <input type="password" id="re-password" autocomplete="none">
                                        <label for="entity-lastname"><i class="fa-solid fa-lock"></i> Repetir contraseña</label>
                                    </div>
                                </div>

                                <div class="dialog_footer">
                                    <button class="btn btn_primary" id="cancel">Cancelar</button>
                                    <button class="btn btn_danger" id="update-password">Actualizar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `
                inputObserver()
                const _password: InterfaceElement = document.getElementById('password')
                const _repassword: InterfaceElement = document.getElementById('re-password')
                const _updatePasswordButton: InterfaceElement = document.getElementById('update-password')
                const _closeButton: InterfaceElement = document.getElementById('cancel')
                const _dialog: InterfaceElement = document.getElementById('dialog-content')

                _updatePasswordButton.addEventListener('click', () => {
                    if (_password.value === '') {
                        alert('El campo "Contraseña" no puede estar vacío.')
                    }
                    else if (_repassword.value === ' ') {
                        alert('Debe repetir la contraseña para continuar')
                    }
                    else if (_password.value === _repassword.value) {
                        let raw: string = JSON.stringify({
                            "id": `${userId}`,
                            "newPassword": `${_password.value}`
                        })

                        setPassword(raw)
                            .then((): void => {
                                setTimeout((): void => {
                                    alert('Se ha cambiado la contraseña')
                                    new CloseDialog().x(_dialog)
                                }, 1000)
                            })
                    }
                    else {
                        console.log('Las contraseñas no coinciden')
                    }
                })

                _closeButton.onclick = () => {
                    new CloseDialog().x(_dialog)
                }
            })
        })

    }

    private register() {
        // register entity
        const openEditor: InterfaceElement = document.getElementById('new-entity')
        openEditor.addEventListener('click', (): void => {
            renderInterface('User')
        })

        const renderInterface = async (entities: string): Promise<void> => {
            this.entityDialogContainer.innerHTML = ''
            this.entityDialogContainer.style.display = 'flex'
            this.entityDialogContainer.innerHTML = `
                <div class="entity_editor" id="entity-editor">
                <div class="entity_editor_header">
                    <div class="user_info">
                    <div class="avatar"><i class="fa-regular fa-user"></i></div>
                    <h1 class="entity_editor_title">Registrar <br><small>Superusuario</small></h1>
                    </div>

                    <button class="btn btn_close_editor" id="close"><i class="fa-regular fa-x"></i></button>
                </div>

                <!-- EDITOR BODY -->
                <div class="entity_editor_body">
                    <div class="material_input">
                    <input type="text" id="entity-firstname" autocomplete="none">
                    <label for="entity-firstname"><i class="fa-solid fa-user"></i> Nombre</label>
                    </div>

                    <div class="material_input">
                    <input type="text" id="entity-lastname" autocomplete="none">
                    <label for="entity-lastname"><i class="fa-solid fa-user"></i> Apellido</label>
                    </div>

                    <div class="material_input">
                    <input type="text" id="entity-secondlastname" autocomplete="none">
                    <label for="entity-secondlastname"><i class="fa-solid fa-user"></i> 2do Apellido</label>
                    </div>

                    <div class="material_input">
                    <input type="text"
                        id="entity-dni"
                        maxlength="12" autocomplete="none">
                    <label for="entity-dni"><i class="fa-solid fa-id-card"></i> DNI</label>
                    </div>

                    <div class="material_input">
                    <input type="text"
                        id="entity-phone"
                        maxlength="10" autocomplete="none">
                    <label for="entity-phone"><i class="fa-solid fa-phone"></i> Teléfono</label>
                    </div>

                    <div class="material_input">
                    <input type="text" id="entity-username" class="input_filled" placeholder="john.doe@ejemplo.com" readonly>
                    <label for="entity-username"><i class="input_locked fa-solid fa-lock"></i> Nombre de usuario</label>
                    </div>

                    <div class="material_input_select">
                    <label for="entity-state">Estado</label>
                    <input type="text" id="entity-state" class="input_select" readonly placeholder="cargando..." autocomplete="none">
                    <div id="input-options" class="input_options">
                    </div>
                    </div>

                    <div class="material_input_select" style="display: none">
                        <label for="entity-business"><i class="fa-solid fa-building"></i> Empresa</label>
                        <input type="text" id="entity-business" class="input_select" readonly placeholder="cargando..." autocomplete="none">
                        <div id="input-options" class="input_options">
                        </div>
                    </div>

                    <div class="material_input_select">
                    <label for="entity-citadel"><i class="fa-solid fa-buildings"></i> Ciudadela</label>
                    <input type="text" id="entity-citadel" class="input_select" readonly placeholder="cargando...">
                    <div id="input-options" class="input_options">
                    </div>
                    </div>

                    <div class="material_input_select" style="display: none">
                    <label for="entity-customer">Cliente</label>
                    <input type="text" id="entity-customer" class="input_select" readonly placeholder="cargando...">
                    <div id="input-options" class="input_options">
                    </div>
                    </div>

                    <div class="material_input_select" style="display: none">
                    <label for="entity-department">Departamento</label>
                    <input type="text" id="entity-department" class="input_select" readonly placeholder="cargando...">
                    <div id="input-options" class="input_options">
                    </div>
                    </div>

                    <br>
                    <div class="material_input">
                    <input type="password" id="tempPass" autocomplete="false">
                    <label for="tempPass">Contraseña</label>
                    </div>

                </div>
                <!-- END EDITOR BODY -->

                <div class="entity_editor_footer">
                    <button class="btn btn_primary btn_widder" id="register-entity">Guardar</button>
                </div>
                </div>
            `

            inputObserver()
            inputSelect('Citadel', 'entity-citadel')
            inputSelect('Customer', 'entity-customer')
            inputSelect('State', 'entity-state')
            inputSelect('Department', 'entity-department')
            inputSelect('Business', 'entity-business')
            this.close()
            this.generateUserName()

            const registerButton: InterfaceElement = document.getElementById('register-entity')
            registerButton.addEventListener('click', (): void => {
                const inputsCollection: any = {
                    firstName: document.getElementById('entity-firstname'),
                    lastName: document.getElementById('entity-lastname'),
                    secondLastName: document.getElementById('entity-secondlastname'),
                    phoneNumer: document.getElementById('entity-phone'),
                    state: document.getElementById('entity-state'),
                    customer: document.getElementById('entity-customer'),
                    username: document.getElementById('entity-username'),
                    citadel: document.getElementById('entity-citadel'),
                    temporalPass: document.getElementById('tempPass')
                }

                const raw = JSON.stringify({
                    "lastName": `${inputsCollection.lastName.value}`,
                    "secondLastName": `${inputsCollection.secondLastName.value}`,
                    "isSuper": false,
                    "email": "",
                    "temp": `${inputsCollection.temporalPass.value}`,
                    "isWebUser": false,
                    "active": true,
                    "firstName": `${inputsCollection.firstName.value}`,
                    "state": {
                        "id": `${inputsCollection.state.dataset.optionid}`
                    },
                    "contractor": {
                        "id": "06b476c4-d151-d7dc-cf0e-2a1e19295a00",
                    },
                    "customer": {
                        "id": `${inputsCollection.customer.dataset.optionid}`
                    },
                    "citadel": {
                        "id": `${inputsCollection.citadel.dataset.optionid}`
                    },
                    "phone": `${inputsCollection.phoneNumer.value}`,
                    "userType": "CUSTOMER",
                    "username": `${inputsCollection.username.value}@${inputsCollection.customer.value.toLowerCase()}.com`
                })
                reg(raw)
            })

        }

        const reg = async (raw: any) => {
            registerEntity(raw, 'User')
                .then((res) => {
                    setTimeout(async () => {
                        let data = await getUsers(true)
                        const tableBody: InterfaceElement = document.getElementById('datatable-body')
                        const container: InterfaceElement = document.getElementById('entity-editor-container')

                        new CloseDialog().x(container)
                        this.load(tableBody, currentPage, data)
                    }, 1000)
                })
        }
    }

    private generateUserName = async (): Promise<void> => {
        const firstName: InterfaceElement = document.getElementById('entity-firstname')
        const secondName: InterfaceElement = document.getElementById('')
        const lastName: InterfaceElement = document.getElementById('entity-lastname')
        const secondLastName: InterfaceElement = document.getElementById('entity-secondlastname')
        const clientName: InterfaceElement = document.getElementById('entity-customer')

        const userName: InterfaceElement = document.getElementById('entity-username')

        let UserNameFFragment: string = ''
        let UserNameLNFragment: string = ''
        let UserNameSLNFragment: string = ''


        firstName.addEventListener('keyup', (e: any): void => {
            UserNameFFragment = firstName.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            userName.setAttribute('value', `${UserNameFFragment.trim()}.${UserNameLNFragment}${UserNameSLNFragment}`)
        })

        lastName.addEventListener('keyup', (e: any): void => {
            UserNameLNFragment = lastName.value.toLowerCase()
            userName.setAttribute('value', `${UserNameFFragment.trim()}.${UserNameLNFragment}${UserNameSLNFragment}`)
        })

        secondLastName.addEventListener('keyup', (e: any): void => {
            UserNameSLNFragment = secondLastName.value.toLowerCase()
            if (secondLastName.value.length > 0) {
                UserNameFFragment[0]
                userName.setAttribute('value', `${UserNameFFragment}.${UserNameLNFragment}${UserNameSLNFragment[0]}`)
            }
            else {
                userName.setAttribute('value', `${UserNameFFragment}.${UserNameLNFragment}${UserNameSLNFragment}`)
            }
        })

    }

    public import() {
        const importButton: InterfaceElement =
            document.getElementById('import-entities')

        importButton.addEventListener('click', (): void => {
            console.log('Importing...')
        })
    }

    public edit(container: InterfaceElement, data: any) {
        // Edit entity
        const edit: InterfaceElement = document.querySelectorAll('#edit-entity')
        edit.forEach((edit: InterfaceElement) => {
            const entityId = edit.dataset.entityid
            edit.addEventListener('click', (): void => {
                RInterface('User', entityId)
            })
        })

        const RInterface = async (entities: string, entityID: string): Promise<void> => {
            const data: any = await getEntityData(entities, entityID)
            this.entityDialogContainer.innerHTML = ''
            this.entityDialogContainer.style.display = 'flex'
            this.entityDialogContainer.innerHTML = `
        <div class="entity_editor" id="entity-editor">
          <div class="entity_editor_header">
            <div class="user_info">
              <div class="avatar"><i class="fa-regular fa-user"></i></div>
              <h1 class="entity_editor_title">Editar <br><small>${data.firstName} ${data.lastName}</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-solid fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
            <div class="material_input">
              <input type="text" id="entity-firstname" class="input_filled" value="${data.firstName}">
              <label for="entity-firstname">Nombre</label>
            </div>

            <div class="material_input">
              <input type="text" id="entity-lastname" class="input_filled" value="${data.lastName}">
              <label for="entity-lastname">Apellido</label>
            </div>

            <div class="material_input">
              <input type="text" id="entity-secondlastname" class="input_filled" value="${data.secondLastName}">
              <label for="entity-secondlastname">2do Apellido</label>
            </div>

            <div class="material_input">
              <input type="text"
                id="entity-phone"
                class="input_filled"
                maxlength="10"
                value="${data.phone}">
              <label for="entity-phone">Teléfono</label>
            </div>

            <div class="material_input">
              <input type="text" id="entity-username" class="input_filled" value="${data.username}" readonly>
              <label for="entity-username">Nombre de usuario</label>
            </div>

            <div class="material_input_select">
              <label for="entity-state">Estado</label>
              <input type="text" id="entity-state" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="material_input_select">
              <label for="entity-business">Empresa</label>
              <input type="text" id="entity-business" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="material_input_select">
              <label for="entity-citadel">Ciudadela</label>
              <input type="text" id="entity-citadel" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="material_input_select">
              <label for="entity-customer">Cliente</label>
              <input type="text" id="entity-customer" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <div class="material_input_select">
              <label for="entity-department">Departamento</label>
              <input type="text" id="entity-department" class="input_select" readonly placeholder="cargando...">
              <div id="input-options" class="input_options">
              </div>
            </div>

            <br><br><br>
            <div class="material_input">
              <input type="password" id="tempPass" >
              <label for="tempPass">Clave temporal</label>
            </div>

          </div>
          <!-- END EDITOR BODY -->

          <div class="entity_editor_footer">
            <button class="btn btn_primary btn_widder" id="update-changes">Guardar</button>
          </div>
        </div>
      `


            inputObserver()
            inputSelect('Business', 'entity-citadel')
            inputSelect('Customer', 'entity-customer')
            inputSelect('State', 'entity-state', data.state.name)
            inputSelect('Department', 'entity-department')
            inputSelect('Business', 'entity-business')
            this.close()
            UUpdate(entityID)
        }

        const UUpdate = async (entityId: any): Promise<void> => {
            const updateButton: InterfaceElement =
                document.getElementById('update-changes')

            updateButton.addEventListener('click', () => {
            })
        }
    }

    public remove() {
        const remove: InterfaceElement = document.querySelectorAll('#remove-entity')
        remove.forEach((remove: InterfaceElement) => {

            const entityId = remove.dataset.entityid

            remove.addEventListener('click', (): void => {
                this.dialogContainer.style.display = 'block'
                this.dialogContainer.innerHTML = `
          <div class="dialog_content" id="dialog-content">
            <div class="dialog dialog_danger">
              <div class="dialog_container">
                <div class="dialog_header">
                  <h2>¿Deseas eliminar este cliente?</h2>
                </div>

                <div class="dialog_message">
                  <p>Esta acción no se puede revertir</p>
                </div>

                <div class="dialog_footer">
                  <button class="btn btn_primary" id="cancel">Cancelar</button>
                  <button class="btn btn_danger" id="delete">Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        `

                // delete button
                // cancel button
                // dialog content
                const deleteButton: InterfaceElement = document.getElementById('delete')
                const cancelButton: InterfaceElement = document.getElementById('cancel')
                const dialogContent: InterfaceElement = document.getElementById('dialog-content')

                deleteButton.onclick = () => {
                    deleteEntity('User', entityId)
                    new CloseDialog().x(dialogContent)
                    this.render()
                }

                cancelButton.onclick = () => {
                    new CloseDialog().x(dialogContent)
                }
            })
        })

    }

    private pagination(items: [], limitRows: number, currentPage: number) {
        const tableBody: InterfaceElement = document.getElementById('datatable-body')
        const paginationWrapper: InterfaceElement = document.getElementById('pagination-container')
        paginationWrapper.innerHTML = ''

        let pageCount: number
        pageCount = Math.ceil(items.length / limitRows)

        let button: InterfaceElement

        for (let i = 1; i < pageCount + 1; i++) {
            button = setupButtons(
                i, items, currentPage, tableBody, limitRows
            )

            paginationWrapper.appendChild(button)
        }

        function setupButtons(page: any, items: any, currentPage: number, tableBody: InterfaceElement, limitRows: number) {
            const button: InterfaceElement = document.createElement('button')
            button.classList.add('pagination_button')
            button.innerText = page

            button.addEventListener('click', (): void => {
                currentPage = page
                new SuperUsers().load(tableBody, page, items)
            })

            return button
        }
    }

    public convertToSuper() {
        const convert: InterfaceElement = document.querySelectorAll('#convert-entity')
        convert.forEach((convert: InterfaceElement) => {
            const entityId = convert.dataset.entityid
            convert.addEventListener('click', (): void => {
                alert('Converting...')
            })
        })
    }

    public close(): void {
        const closeButton: InterfaceElement = document.getElementById('close')
        const editor: InterfaceElement = document.getElementById('entity-editor-container')

        closeButton.addEventListener('click', () => {
            new CloseDialog().x(editor)
        }, false)
    }
}


export const setNewPassword: any = async (): Promise<void> => {
    const users: any = await getEntitiesData('User')
    const FNewUsers: any = users.filter((data: any) => data.isSuper === false)

    FNewUsers.forEach((newUser: any) => {

    })

}