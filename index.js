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
    const response = await fetch(apiBase + "items/micrographs");
    return (await response.json()).data;
}

async function fetchMicrograph(id) {
    const response = await fetch(apiBase + "items/micrographs/" + id);
    return (await response.json()).data;
}

async function fetchAllMaXrf() {
    const response = await fetch(apiBase + "items/ma_xrf_scans");
    return (await response.json()).data;
}

async function downloadImage(id, outputFilePath, imageOptions) {
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

async function fetchFileObject(id) {
    const response = await fetch(apiBase + "files/" + id);
    return (await response.json()).data;
}

async function main() {

    const { fieldMap } = config;

    //Download all miniature ovjects from their API listing
    const miniatureAll = await fetchMiniatureAll();
    //Download all MA XRF Scan objects from API listing
    const maXrfAll = await fetchAllMaXrf();

    //For each miniature
    for (let i = 0; i < miniatureAll.length; i++) {

        const data = miniatureAll[i];
        const miniatureId = data[fieldMap.publicPath];
        const basePath = config.basePath + miniatureId + "/";
        const manifestId = basePath + "manifest.json";
        const canvasId = basePath + "canvas/0";

        if (data[fieldMap.published] != "published") continue;

        console.log(`miniature: ${i} ${miniatureId}`);

        //Create output directory for this miniature
        const outputFilePath = path.join(config.outputDir, miniatureId);
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

            //Optionaly download image file and create iiif image info.json
            if (config.imageDownload) {

                const imageBasePath = config.image.publicPath + imageData[fieldMap.imagePublicPath].toUpperCase().replace(/\s/g, '_');
                const imageFullPath = imageBasePath + "/full/max/0";

                const imageId = config.basePath + path.join(miniatureId, imageFullPath, "default.jpg");
                const imageServiceId = config.basePath + path.join(miniatureId, imageBasePath);
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

                let workingImageWidth = imageData.width;
                let workingImageHeight = imageData.height;
                const imageScaleList = [];
                do {
                    const imageSizePath = path.join(
                        imageBasePath,
                        "full",
                        workingImageWidth == imageData.width ? "max" : workingImageWidth + "," + workingImageHeight,
                        "0"
                    );
                    const imageDownloadDir = path.join(outputFilePath, imageSizePath);
                    const imageDownloadFile = path.join(outputFilePath, imageSizePath, "default.jpg");
                    try {
                        await fsPromises.mkdir(imageDownloadDir, { recursive: true });
                    }
                    catch (error) {

                    }
                    await downloadImage(imageData.id, imageDownloadFile, { width: workingImageWidth, height: workingImageHeight });
                    imageScaleList.push({
                        "width": workingImageWidth,
                        "height": workingImageHeight,
                    })
                    workingImageWidth = Math.ceil(workingImageWidth * config.image.scaleIncrement);
                    workingImageHeight = Math.ceil(workingImageHeight * config.image.scaleIncrement);
                } while (config.image.scale && workingImageWidth > config.image.scaleMinWidth)

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
                    "sizes": imageScaleList
                }

                await fsPromises.writeFile(imageInfoFile, JSON.stringify(imageInfo, null, "    "));
            }

            if (config.imageAPI) {

                const imageExtension = imageData.type == "image/tiff" ? "tif" : "jpg";
                const imageAPIBase = config.imageAPI + imageData.filename_disk;
                const imageId = imageAPIBase + "/full/max/0/default." + imageExtension;

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
                            "id": imageAPIBase,
                            "type": "ImageService3",
                            "profile": "level2"
                        }
                    ]
                });
            }
        }

        //add MA-XRF Scan image
        if (config.imageAPI && data[config.fieldMap.maXrf]) {
            for (let j = 0; j < data[config.fieldMap.maXrf].length; j++) {
                const foundScan = maXrfAll.find(s => s.id == data[config.fieldMap.maXrf][j]);
                if (foundScan && foundScan.ma_xrf_scan) {

                    console.log("MA-XRF", j);
                    const imageData = await fetchFileObject(foundScan.ma_xrf_scan);

                    const imageExtension = imageData.type == "image/tiff" ? "tif" : "jpg";
                    const imageAPIBase = config.imageAPI + imageData.filename_disk;
                    const imageId = imageAPIBase + "/full/max/0/default." + imageExtension;
                    const maXrfLabel = 'MA-XRF ' + foundScan.element_investigated;

                    images.push({
                        "id": imageId,
                        "type": "Image",
                        "format": imageData.type,
                        "height": imageData.height,
                        "width": imageData.width,
                        "label": {
                            "en": [
                                maXrfLabel
                            ]
                        },
                        "service": [
                            {
                                "id": imageAPIBase,
                                "type": "ImageService3",
                                "profile": "level2"
                            }
                        ]
                    });
                }
            }
        }

        const canvasHeight = images[0]?.height || 1800;
        const canvasWidth = images[0]?.width || 1200;

        const annotationPageId = basePath + "page/0/0";
        const annotationPaintingId = basePath + "painting/0";

        //Calculate physical scale - used for ruler.
        const physicalScale = +(data[fieldMap.dimensionsHeight] / canvasHeight).toFixed(4);

        //Build iiif annotation for each miniature annotation marked with 'hotspot'.
        //Including coordinates.
        const annotationItems = [];
        if (Array.isArray(data[fieldMap.annotation.key])) {
            for (let j = 0; j < data[fieldMap.annotation.key].length; j++) {
                const micrographId = data[fieldMap.annotation.key][j];

                const currentItem = await fetchMicrograph(micrographId);
                if (!currentItem || !currentItem.hotspot) continue
                console.log("micrograph", j);

                const annotationItemId = basePath + path.join("annotation/tag/", currentItem.id.toString());
                const targetCoords = `${currentItem[fieldMap.annotation.x]},${currentItem[fieldMap.annotation.y]},${currentItem[fieldMap.annotation.w]},${currentItem[fieldMap.annotation.h]}`;
                const target = canvasId + "#xywh=" + targetCoords;
                const micrographLink = config.micrographBasePath + currentItem[fieldMap.annotation.uuid] + '?' + fieldMap.annotation.fullSizeURLParameters;
                const value = `<div><p>${currentItem[fieldMap.annotation.description]}</p><a href=${micrographLink} target="__blank">Open micrograph</a></div>`;

                annotationItems.push({
                    "id": annotationItemId,
                    "type": "Annotation",
                    "motivation": "commenting",
                    "body": {
                        "type": "TextualBody",
                        "value": value,
                        "language": "en",
                        "format": "text/html"
                    },
                    "target": target
                });
            }
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
            "summary": {
                "en": [
                    ...fieldMap.description.map(item => data[item]).filter(item => item)
                ]
            },
            "requiredStatement": {
                "label": {
                    "en": [
                        "Collection"
                    ]
                },
                "value": {
                    "en": [
                        config.collection
                    ]
                }
            },
            "rights": config.license,
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
                    //This is an old definition of Physical Dimensions which fails validation
                    //https://iiif.io/api/annex/services/#physical-dimensions
                    // "service": {
                    //     "@context": "http://iiif.io/api/annex/services/physdim/1/context.json",
                    //     "profile": "http://iiif.io/api/annex/services/physdim",
                    //     "physicalScale": physicalScale,
                    //     "physicalUnits": config.dimensionsUnits
                    // },
                    //Using new extension style decleration described here:
                    //https://github.com/IIIF/api/issues/1358
                    //https://gist.github.com/workergnome/01a3c617b0f5a6ee8a2fb51fc44666bf
                    "physicalDimensions": {
                        "type": "PhysicalDimension",
                        "profile": "http://iiif.io/api/annex/extensions/physdim",
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
