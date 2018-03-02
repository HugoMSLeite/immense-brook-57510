module.exports = (sender_psid, received_postback, callSendAPI) => {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { "text": "Você respondeu sim!" }
    } else if (payload === 'no') {
        response = { "text": "Você respondeu não" }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}