import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { userActions } from '../../actions';

import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

function Copyright() {
    return (
        <Typography variant="body2" color="textSecondary" align="center">
            {'Copyright © Hugo Leite'}
            {' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

function LoginPage(props) {
    const [inputs, setInputs] = useState({});
    const [submited, setSubmited] = useState(false);

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(userActions.logout());
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;
        setInputs(inputs => ({ ...inputs, [name]: value }));
    }

    function handleSubmit(e) {
        e.preventDefault();

        setSubmited(true);
        const { email, password } = inputs;
        if (email && !/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
            setInputs({ ...inputs, emailInvalid: true })
        }
        if (email && password) {
            dispatch(userActions.login(email, password, props.history));
        }
    }

    const { email, password, submitted, emailInvalid } = inputs;

    const classes = makeStyles((theme) => ({
        paper: {
            marginTop: theme.spacing(8),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        },
        avatar: {
            margin: theme.spacing(1),
            backgroundColor: theme.palette.secondary.main,
        },
        form: {
            width: '100%', // Fix IE 11 issue.
            marginTop: theme.spacing(1),
        },
        submit: {
            margin: theme.spacing(3, 0, 2),
        },
    }));

    return (
        <div style={{
            padding: '1px 0 0 0',
            margin: '-1px auto 0 auto'
        }}>
            <Container component="div" maxWidth="xs" style={{ backgroundColor: '#fff', marginTop: '60px', padding: '24px' }}>
                <CssBaseline />
                <div className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign in
                    </Typography>
                    <form className={classes.form} onSubmit={handleSubmit} noValidate>
                        <TextField
                            error={(submitted && !email) || emailInvalid}
                            variant="outlined"
                            required
                            margin="normal"
                            fullWidth
                            id="email"
                            type="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            helperText={emailInvalid ? 'Invalid' : null}
                            onChange={handleChange} />
                        <TextField
                            error={submitted && !password}
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            onChange={handleChange} />
                        <FormControlLabel
                            control={<Checkbox value="remember" color="primary" />}
                            label="Remember me" />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}>
                            Sign In
                        </Button>
                        <Grid container>
                            <Grid item xs>
                                <Link href="#" variant="body2">
                                    Forgot password?
                                </Link>
                            </Grid>
                            <Grid item>
                                <Link href="#" variant="body2">
                                    {"Don't have an account? Sign Up"}
                                </Link>
                            </Grid>
                        </Grid>
                    </form>
                </div>
                <Box mt={8}>
                    <Copyright />
                </Box>
            </Container>
        </div>
    );
}

export { LoginPage };