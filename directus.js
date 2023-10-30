import fetch from 'node-fetch';
import { promises as fsPromises } from 'fs';
import config from './config.js';

const { apiBase } = config;

export async function fetchMiniatureAll() {
    const response = await fetch(apiBase + "items/miniatures");
    return (await response.json()).data;
}

export async function fetchMiniature(id) {
    const response = await fetch(apiBase + "items/miniatures/" + id);
    return (await response.json()).data;
}

export async function fetchMicrographAll() {
    const response = await fetch(apiBase + "items/micrographs");
    return (await response.json()).data;
}

export async function fetchMicrograph(id) {
    const url = apiBase + "items/micrographs/" + id;
    console.log("fetchMicrograph url", url);
    const response = await fetch(url);
    return (await response.json()).data;
}

export async function fetchAllMaXrf() {
    const url = apiBase + "items/ma_xrf_scans?limit=-1";
    console.log("fetchAllMaXrf", url);
    const response = await fetch(url);
    return (await response.json()).data;
}

export async function downloadImage(id, outputFilePath, imageOptions) {
    let path = apiBase + "assets/" + id + "?quality=90";
    if (imageOptions.width != undefined) {
        path += "&width=" + imageOptions.width;
    }
    if (imageOptions.height != undefined) {
        path += "&height=" + imageOptions.height;
    }
    const response = await fetch(path);
    return fsPromises.writeFile(outputFilePath, response.body);
}

export async function fetchFileObject(id) {
    const url = apiBase + "files/" + id;
    console.log("fetchFileObject url",url);
    const response = await fetch(url);
    return (await response.json()).data;
}