const components = require('./components')

module.exports = (sender_psid, received_message, callSendAPI) => {

    let response;

    // Check if the message contains text
    if (received_message.text) {

        // Create the payload for a basic text message
        response = {
            "text": `You sent the message: "${received_message.text}".`
        }
        var buttons = [{
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
            },
            {
                "type": "postback",
                "title": "No!",
                "payload": "no",
            }
        ]
        response = components.template_generic('Responda sim ou não', 'Sim ou não', null, buttons)
    } else if (received_message.attachments) {

        // Gets the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;

    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}