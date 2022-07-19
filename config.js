export default {
    apiBase: "https://unlocking-miniatures.fitz.ms/",
    basePath: "https://miniatures.fitz.ms/iiif/",
    // imageDownload: {
    //     publicPath: "images/",
    //     scale: false,
    //     scaleMinWidth: 50,
    //     scaleIncrement: 0.5,
    // },
    imageAPI: "https://iiif.fitz.ms/iiif/3/",
    micrographBasePath: "https://unlocking-miniatures.fitz.ms/assets/",
    dimensionsUnits: "mm",
    fieldMap: {
        publicPath: "accession_number",
        label: "title",
        description: ["description_content", "description_physical"],
        imagePublicPath: "title",
        image: [
            {
                "key": "image_normal_light",
                "label": "Natural Light"
            },
            {
                "key": "image_raking_light",
                "label": "Raking Light"
            },
            {
                "key": "image_infrared",
                "label": "Infrared"
            },
            {
                "key": "image_uv",
                "label": "Ultraviolet"
            },
            {
                "key": "image_xray",
                "label": "X-ray"
            }
        ],
        maXrf: "images_ma_xrf_scans",
        dimensionsHeight: "dimensions_unframed_height",
        dimensionsWidth: "dimensions_unframed_width",
        annotation: {
            key: "images_micrographs",
            fileName: "file_name",
            description: "description",
            x: "coordinates_x",
            y: "coordinates_y",
            w: "coordinates_width",
            h: "coordinates_height",
            uuid: "micrograph",
            fullSizeURLParameters: "format=jpg"
        },
        published: "status"
    },
    attribution: "Fitzwilliam Museum",
    license: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
}