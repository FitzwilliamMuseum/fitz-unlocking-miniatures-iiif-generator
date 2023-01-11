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
    const response = await fetch(apiBase + "items/micrographs/" + id);
    return (await response.json()).data;
}

export async function fetchAllMaXrf() {
    const response = await fetch(apiBase + "items/ma_xrf_scans");
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
    const response = await fetch(apiBase + "files/" + id);
    return (await response.json()).data;
}