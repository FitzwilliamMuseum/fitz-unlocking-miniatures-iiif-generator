import fetch from 'node-fetch';
import fs from 'fs';
import config from './config.js';

const { apiBase } = config;

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
    const micrographData = await fetchMicrographAll();

    const miniatureId = "1";
    const data = await fetchMiniature(miniatureId);

    const { fieldMap } = config;
    const manifestId = config.basePath + "manifest.json";
    const canvasId = config.basePath + "canvas/0";

    const images = await Promise.all(fieldMap.image.map(async function (item) {
        const imageData = await fetchFileObject(data[item.key]);
        const imagePath = config.imageBasePath + item.publicPath;
        const imageId = imagePath + config.imageDefaultId;
        return {
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
                    "id": imagePath,
                    "type": "ImageService3",
                    "profile": "level0"
                }
            ]
        }
    }));

    const canvasHeight = images[0]?.height || 1800;
    const canvasWidth = images[0]?.width || 1200;

    const annotationPageId = config.basePath + "page/0/0";
    const annotationPaintingId = config.basePath + "painting/0";

    const physicalScale = +(data[fieldMap.dimensionsHeight] / canvasHeight).toFixed(4);

    const annotationItems = [];
    data[fieldMap.annotation.key].forEach(micrographId => {
        const currentItem = micrographData[micrographId];
        if (currentItem.hotspot) {
            const annotationItemId = config.basePath + "annotation/tag/" + currentItem.id;
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
    })

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
                ...fieldMap.description.map(item => data[item])
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

    fs.writeFileSync("output/manifest.json", JSON.stringify(manifest, null, "    "));
}

main();
