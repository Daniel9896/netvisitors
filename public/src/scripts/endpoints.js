// @filename: endpoints.ts
// Imports
import { SignIn } from "./login.js";
// GENERAL URL
// ===================================================
const NetliinksUrl = 'https://backend.netliinks.com:443/rest/entities/';
// ===================================================
// TOOLS
// ===================================================
export let token = localStorage.getItem('access_token');
export const _userAgent = navigator.userAgent;
// ===================================================
// HEADERS
// ===================================================
let headers = new Headers();
headers.append('Authorization', `Bearer ${token}`);
headers.append('Content-Type', "application/json");
headers.append('Cookie', "JSESSIONID=CDD208A868EAABD1F523BB6F3C8946AF");
// ===================================================
// GET TOKEN
// ===================================================
/**
 *
 * @param mail is the username
 * @param password
 * @returns token
 */
export const getToken = async (mail, password) => {
    const URL = 'https://backend.netliinks.com:443/oauth/token';
    const ReqOptions = {
        method: 'POST',
        body: `grant_type=password&username=${mail}&password=${password}`,
        headers: {
            Accept: 'application/json',
            "User-agent": `${_userAgent}`,
            Authorization: 'Basic YzNjMDM1MzQ2MjoyZmM5ZjFiZTVkN2IwZDE4ZjI1YmU2NDJiM2FmMWU1Yg==',
            "Content-Type": 'application/x-www-form-urlencoded',
            Cookie: "JSESSIONID=CDD208A868EAABD1F523BB6F3C8946AF",
        }
    };
    const res = await fetch(URL, ReqOptions);
    return res.json();
};
// ===================================================
// GET USER INFORMATION
// ===================================================
/**
 *
 * @returns user information, type, business,
 * customers, guards and more
 */
export const getUserInfo = async () => {
    const userInfo = {
        url: 'https://backend.netliinks.com:443/rest/userInfo?fetchPlan=full',
        method: 'GET'
    };
    const options = {
        method: userInfo.method,
        headers: headers,
        redirect: 'follow'
    };
    let userData = await fetch(userInfo.url, options)
        .then((req) => req.json());
    // .then((req) => {
    //     console.log(req)
    //     // if (req.error === 'invalid_token') {
    //     //     new SignIn().showLogin()
    //     // }
    // })
    return userData;
};
// ===================================================
/**
 *
 * @param url
 *
 * @returns a specific data from url
 */
// export async function getData(url: RequestInfo): Endpoint
export const getData = async (url) => {
    let ReqOptions = {
        method: 'GET',
        headers: headers,
        redirect: 'follow'
    };
    const res = await fetch(url, ReqOptions);
    return await res.json()
        .catch(err => new SignIn().signOut());
};
/**
 *
 * @param entities name of a specific entity to get.
 *
 * @returns all content of a specific
 * entity (all bussines data for example).
 */
export const getEntitiesData = async (entities) => {
    const URL = `${NetliinksUrl}${entities}?fetchPlan=full&orderBy=createdDate`;
    return await getData(URL);
};
/**
 *
 * @param entities name of a specific entity to search.
 * @param entity name of a specific entity to get.
 *
 * @returns all data of specified entity.
 */
export const getEntityData = async (entities, entity) => {
    const URL = `${NetliinksUrl}${entities}/${entity}?fetchPlan=full&sort=-creationDate`;
    return getData(URL);
};
export const updateEntity = async (entities, entity, raw) => {
    const URL = `${NetliinksUrl}${entities}/${entity}`;
    const ReqOptions = {
        method: 'PUT',
        headers: headers,
        body: raw,
        redirect: 'follow'
    };
    await fetch(URL, ReqOptions)
        .then(res => res.json())
        .catch(err => console.error('Error: ', err));
};
export const deleteEntity = async (entities, entity) => {
    const URL = `${NetliinksUrl}${entities}/${entity}?fetchPlan=full`;
    const ReqOptions = {
        method: 'DELETE',
        headers: headers,
        redirect: 'follow'
    };
    await fetch(URL, ReqOptions)
        .then(res => res.json())
        .catch(err => console.error('Error:' + err));
};
export const registerEntity = async (raw, type) => {
    const req = {
        url: 'https://backend.netliinks.com:443/rest/entities/',
        method: 'POST'
    };
    const requestOptions = {
        method: req.method,
        headers: headers,
        body: raw,
        redirect: 'follow'
    };
    fetch(req.url + type, requestOptions)
        .then(res => res.json());
};
export const filterEntities = async (user) => { };
export const setPassword = async (raw) => {
    const req = {
        url: 'https://backend.netliinks.com:443/rest/services/UserServiceBean/updatePassword',
        method: 'POST'
    };
    const requestOptions = {
        method: req.method,
        headers: headers,
        body: raw,
        redirect: 'follow'
    };
    fetch(req.url, requestOptions)
        .then(response => response.json())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));
};
export const setUserRole = async (raw) => {
    const req = {
        url: 'https://backend.netliinks.com:443/rest/services/UserServiceBean/assignRol',
        method: 'POST'
    };
    const requestOptions = {
        method: req.method,
        headers: headers,
        body: raw,
        redirect: 'follow'
    };
    fetch(req.url, requestOptions)
        .then(response => response.json())
        .then(result => console.log(result))
        .catch(error => console.log('error', error));
};
export const getFile = async (fileUrl) => {
    const url = 'https://backend.netliinks.com:443/rest/files?fileRef=';
    const requestOptions = {
        method: 'GET',
        headers: headers,
        redirect: 'follow'
    };
    const file = await fetch(url + fileUrl, requestOptions)
        .then((res) => res.blob())
        .then(blob => {
        let file = window.URL.createObjectURL(blob);
        return file;
    });
    return file;
};
