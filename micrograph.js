import { promises as fsPromises } from 'fs';
import path from 'path';
import config from './config.js';
import { fetchFileObject } from './directus.js';

export default async function (item, miniatureId, manifestLabel) {

    const basePath = config.basePath + miniatureId + "/";

    const micrographManifestId = `${config.basePath}${miniatureId}/micrograph/${item.id}/manifest.json`;

    const micrographImageData = await fetchFileObject(item.micrograph);
    const micrographImageExtension = micrographImageData.type == "image/tiff" ? "tif" : "jpg";
    const micrographImageAPIBase = config.imageAPI + micrographImageData.filename_disk;
    const micrographImageId = micrographImageAPIBase + "/full/max/0/default." + micrographImageExtension;

    const micrographBasePath = basePath + 'micrograph/' + item.id;
    const micrographCanvasId = micrographBasePath + '/canvas/0';
    const micrographCanvasHeight = micrographImageData?.height || 1800;
    const micrographCanvasWidth = micrographImageData?.width || 1200;
    const micrographAnnotationPageId = micrographBasePath + "page/0/0";
    const micrographAnnotationPaintingId = micrographBasePath + "painting/0";

    const micrographManifest = {
        "@context": "http://iiif.io/api/presentation/3/context.json",
        "id": micrographManifestId,
        "type": "Manifest",
        "label": {
            "en": [
                manifestLabel
            ]
        },
        "summary": {
            "en": [
                item[config.fieldMap.annotation.description]
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
                "id": micrographCanvasId,
                "type": "Canvas",
                "height": micrographCanvasHeight,
                "width": micrographCanvasWidth,
                "items": [
                    {
                        "id": micrographAnnotationPageId,
                        "type": "AnnotationPage",
                        "items": [
                            {
                                "id": micrographAnnotationPaintingId,
                                "type": "Annotation",
                                "motivation": "painting",
                                "body": {
                                    "type": "Choice",
                                    "items": [
                                        {
                                            "id": micrographImageId,
                                            "type": "Image",
                                            "format": micrographImageData.type,
                                            "height": micrographImageData.height,
                                            "width": micrographImageData.width,
                                            "label": {
                                                "en": [
                                                    item[config.fieldMap.annotation.description]
                                                ]
                                            },
                                            "service": [
                                                {
                                                    "id": micrographImageAPIBase,
                                                    "type": "ImageService3",
                                                    "profile": "level2"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                "target": micrographCanvasId
                            }
                        ]
                    }
                ]
            },
        ],
    }

    const outputFilePathMicrograph = path.join(config.outputDir, `${miniatureId}/micrograph/${item.id}/manifest.json`);
    const outputFilePath = path.join(config.outputDir, miniatureId.toString(), 'micrograph', item.id.toString());
    try {
        await fsPromises.mkdir(outputFilePath, { recursive: true });
    }
    catch (error) {

    }
    await fsPromises.writeFile(outputFilePathMicrograph, JSON.stringify(micrographManifest, null, "    "));
}