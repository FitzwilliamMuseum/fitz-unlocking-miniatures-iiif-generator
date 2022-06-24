export default {
    apiBase: "https://api.example.com/",
    basePath: "http://iiif.example.com/",
    accessToken: "ACCESS_TOKEN",
    downloadImages: true,
    imagesPublicPath: "images/",
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
        dimensionsHeight: "dimensions_unframed_height",
        dimensionsWidth: "dimensions_unframed_width",
        annotation: {
            key: "micrographs",
            description: "description",
            x: "coordinates_x",
            y: "coordinates_y",
            w: "coordinates_width",
            h: "coordinates_height"
        }
    },
    attribution: "Fitzwilliam Museum",
    license: "https://creativecommons.org/licenses/by/3.0/",
}