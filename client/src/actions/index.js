import { CLICK_UPDATE_VALUE } from './actionTypes';

export const clickButton = user => {
    return dispatch => {
        return fetch("http://localhost:8080/api/v1/users", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({user})
        })
          .then(resp => resp.json())
          .then(data => {
            if (data.message) {
              // Here you should have logic to handle invalid creation of a user.
              // This assumes your Rails API will return a JSON object with a key of
              // 'message' if there is an error with creating the user, i.e. invalid username
            } else {
              localStorage.setItem("token", data.token)
              dispatch({type: CLICK_UPDATE_VALUE,
                newValue: data.user})
            }
          })
      }
  };