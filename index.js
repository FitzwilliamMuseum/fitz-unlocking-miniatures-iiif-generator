import fetch from 'node-fetch';
import { promises as fsPromises } from 'fs';
import config from './config.js';
import path from 'path';

const { apiBase } = config;

//Directus APi endpoints

async function fetchMiniatureAll() {
    const response = await fetch(apiBase + "items/miniatures");
    return (await response.json()).data;
}

async function fetchMiniature(id) {
    const response = await fetch(apiBase + "items/miniatures/" + id);
    return (await response.json()).data;
}

async function fetchMicrographAll() {
    const response = await fetch(apiBase + "items/miniatures_micrographs");
    return (await response.json()).data;
}

async function fetchMicrograph(id) {
    const response = await fetch(apiBase + "items/miniatures_micrographs/" + id);
    return (await response.json()).data;
}

async function downloadImage(id, outputFilePath) {
    const options = {
        headers: {
            "Authorization": "Bearer " + config.accessToken
        }
    }
    const response = await fetch(apiBase + "assets/" + id + "?height=1024&quality=80", options);
    return fsPromises.writeFile(outputFilePath, response.body);
}

async function fetchFileObject(id) {
    const options = {
        headers: {
            "Authorization": "Bearer " + config.accessToken
        }
    }
    const response = await fetch(apiBase + "files/" + id, options);
    return (await response.json()).data;
}

async function main() {

    const { fieldMap } = config;

    //Download all migrographs and miniatures from their API listing
    const micrographData = await fetchMicrographAll();
    const miniatureAll = await fetchMiniatureAll();

    //For each miniature
    for (let i = 0; i < miniatureAll.length; i++) {

        const data = miniatureAll[i];
        const miniatureId = data[fieldMap.publicPath];
        const basePath = config.host + path.join(config.basePath, miniatureId);
        const manifestId = path.join(basePath, "manifest.json");
        const canvasId = path.join(basePath, "canvas/0");

        console.log(`miniature: ${i} ${miniatureId}`);

        //Create output directory for this miniature
        const outputFilePath = "output/" + miniatureId;
        try {
            await fsPromises.mkdir(outputFilePath, { recursive: true });
        }
        catch (error) {

        }

        //Download directus object data for each image.
        //Including format, width/height
        const images = [];
        for (let j = 0; j < fieldMap.image.length; j++) {
            const item = fieldMap.image[j];
            if (!data[item.key]) continue;
            console.log("image", j);
            const imageData = await fetchFileObject(data[item.key]);

            const imageBasePath = config.imagesPublicPath + imageData[fieldMap.imagePublicPath].toUpperCase().replace(/\s/g, '_');
            const imageFullPath = imageBasePath + "/full/max/0";

            const imageId = config.host + path.join(config.basePath, miniatureId, imageFullPath, "default.jpg");
            const imageServiceId = config.host + path.join(config.basePath, miniatureId, imageBasePath);
            const imageDownloadDir = path.join(outputFilePath, imageFullPath);
            const imageDownloadFile = path.join(outputFilePath, imageFullPath, "default.jpg");
            const imageInfoFile = path.join(outputFilePath, imageBasePath, "info.json");

            images.push({
                "id": imageId,
                "type": "Image",
                "format": imageData.type,
                "height": imageData.height,
                "width": imageData.width,
                "label": {
                    "en": [
                        item.label
                    ]
                },
                "service": [
                    {
                        "id": imageServiceId,
                        "type": "ImageService3",
                        "profile": "level0"
                    }
                ]
            });

            //Optionaly download image file and create iiif image info.json
            if (config.downloadImages) {
                try {
                    await fsPromises.mkdir(imageDownloadDir, { recursive: true });
                }
                catch (error) {

                }
                await downloadImage(imageData.id, imageDownloadFile);

                const imageInfo = {
                    "@context": "http://iiif.io/api/image/3/context.json",
                    "id": imageServiceId,
                    "type": "ImageService3",
                    "profile": "level0",
                    "protocol": "http://iiif.io/api/image",
                    "height": imageData.height,
                    "width": imageData.width,
                    "extraFormats": [
                        "jpg"
                    ],
                    "extraQualities": [
                        "default"
                    ],
                    "extraFeatures": [],
                    "tiles": [
                        {
                            "scaleFactors": [
                                1
                            ],
                            "height": imageData.height,
                            "width": imageData.width,
                        }
                    ],
                    "sizes": [
                        {
                            "height": imageData.height,
                            "width": imageData.width,
                        }
                    ]
                }

                await fsPromises.writeFile(imageInfoFile, JSON.stringify(imageInfo, null, "    "));
            }
        }

        const canvasHeight = images[0]?.height || 1800;
        const canvasWidth = images[0]?.width || 1200;

        const annotationPageId = path.join(basePath, "page/0/0");
        const annotationPaintingId = path.join(basePath, "painting/0");

        //Calculate physical scale - used for ruler.
        const physicalScale = +(data[fieldMap.dimensionsHeight] / canvasHeight).toFixed(4);

        //Build iiif annotation for each miniature annotation marked with 'hotspot'.
        //Including coordinates.
        const annotationItems = [];
        for (let j = 0; j < data[fieldMap.annotation.key].length; j++) {
            const micrographId = data[fieldMap.annotation.key][j];
            const currentItem = micrographData[micrographId];
            if (!currentItem || !currentItem.hotspot) continue
            console.log("micrograph", j);
            const annotationItemId = path.join(basePath, "annotation/tag/", currentItem.id);
            const targetCoords = `${currentItem[fieldMap.annotation.x]},${currentItem[fieldMap.annotation.y]},${currentItem[fieldMap.annotation.w]},${currentItem[fieldMap.annotation.h]}`;
            const target = canvasId + "#xywh=" + targetCoords;
            annotationItems.push({
                "id": annotationItemId,
                "type": "Annotation",
                "motivation": "commenting",
                "body": {
                    "type": "TextualBody",
                    "value": currentItem[fieldMap.annotation.description],
                    "language": "en",
                    "format": "text/html"
                },
                "target": target
            });
        }

        //Build iiif presentation manifest
        const manifest = {
            "@context": "http://iiif.io/api/presentation/3/context.json",
            "id": manifestId,
            "type": "Manifest",
            "label": {
                "en": [
                    data[fieldMap.label]
                ]
            },
            "description": {
                "en": [
                    ...fieldMap.description.map(item => data[item]).filter(item => item)
                ]
            },
            "attribution": config.attribution,
            "license": config.license,
            "items": [
                {
                    "id": canvasId,
                    "type": "Canvas",
                    "height": canvasHeight,
                    "width": canvasWidth,
                    "items": [
                        {
                            "id": annotationPageId,
                            "type": "AnnotationPage",
                            "items": [
                                {
                                    "id": annotationPaintingId,
                                    "type": "Annotation",
                                    "motivation": "painting",
                                    "body": {
                                        "type": "Choice",
                                        "items": images
                                    },
                                    "target": canvasId
                                }
                            ]
                        }
                    ],
                    "service": {
                        "@context": "http://iiif.io/api/annex/services/physdim/1/context.json",
                        "profile": "http://iiif.io/api/annex/services/physdim",
                        "physicalScale": physicalScale,
                        "physicalUnits": config.dimensionsUnits
                    },
                    "annotations": [
                        {
                            "id": annotationPageId,
                            "type": "AnnotationPage",
                            "items": annotationItems
                        }
                    ]
                },
            ],
        }

        await fsPromises.writeFile(path.join(outputFilePath, "manifest.json"), JSON.stringify(manifest, null, "    "));
    }
}

main();
