import {
    BehaviorSubject
} from 'rxjs';
import {
    api
} from '../api';
import history from '../helpers/history';

const userSubject = new BehaviorSubject(null);

export const userService = {
    login,
    logout,
    refreshToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    create,
    user: userSubject.asObservable(),
    get userValue() {
        return userSubject.value
    }
};

function login(email, password) {
    return api.post('/authenticate', {
        email,
        password
    }).then(res => {
        if (res.data && res.data.token) {
            localStorage.setItem('user', JSON.stringify(res.data));
            api.defaults.headers.Authorization = `Bearer ${res.data.token}`;
            api.defaults.headers.TokenId = res.data.id;
            startRefreshTokenTimer();
            return res.data;
        } else {
            return null;
        }
    }).catch(err => {
        return null;
    });
}

function logout() {
    api.post('/revoke-token', {});
    stopRefreshTokenTimer();
    userSubject.next(null);
    localStorage.removeItem('user');
    history.push('/account/login');
}

function refreshToken() {
    return api.post(`/refresh-token`, {})
        .then(user => {
            // publish user to subscribers and start timer to refresh token
            userSubject.next(user);
            startRefreshTokenTimer();
            return user;
        }).catch(err => {
            return null;
        });
}

function register(params) {
    return api.post(`/register`, params);
}

function verifyEmail(token) {
    return api.post(`/verify-email`, {
        token
    });
}

function forgotPassword(email) {
    return api.post(`/forgot-password`, {
        email
    });
}

function validateResetToken(token) {
    return api.post(`/validate-reset-token`, {
        token
    });
}

function resetPassword({
    token,
    password,
    confirmPassword
}) {
    return api.post(`/reset-password`, {
        token,
        password,
        confirmPassword
    });
}

function getAll() {
    return api.get(`/users`);
}

function create(params) {
    return api.post('', params);
}

let refreshTokenTimeout;

function startRefreshTokenTimer() {
    // parse json object from base64 encoded jwt token
    const jwtToken = JSON.parse(atob(userSubject.value.token.split('.')[1]));

    // set a timeout to refresh the token a minute before it expires
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000);
    refreshTokenTimeout = setTimeout(refreshToken, timeout);
}

function stopRefreshTokenTimer() {
    clearTimeout(refreshTokenTimeout);
}