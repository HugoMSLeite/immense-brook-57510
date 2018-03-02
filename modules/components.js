module.exports.template_generic = (title, subtitle, img_url, buttons) => {
    return {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": title,
                    "subtitle": subtitle,
                    "image_url": img_url,
                    "buttons": buttons,
                }]
            }
        }
    }
}