export default {
    apiBase: "https://api.example.com/",
    basePath: "http://iiif.example.com/",
    accessToken: "ACCESS_TOKEN",
    imageBasePath: "http://iiif.example.com/images/",
    imageDefaultId: "/full/max/0/default.jpg",
    dimensionsUnits: "mm",
    fieldMap: {
        label: "title",
        description: ["description_content", "description_physical"],
        image: [
            {
                "key": "image_normal_light",
                "label": "Natural Light",
                "publicPath": "FM_3868_NL"
            },
            {
                "key": "image_raking_light",
                "label": "Raking Light",
                "publicPath": "FM_3868_RL"

            },
            {
                "key": "image_infrared",
                "label": "Infrared",
                "publicPath": "FM_3868_NIR"
            },
            {
                "key": "image_uv",
                "label": "Ultraviolet",
                "publicPath": "FM_3868_UV"
            },
            {
                "key": "image_xray",
                "label": "X-ray",
                "publicPath": "FM_3868_x-ray"
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