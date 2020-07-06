import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: '#eee'
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
    },
    paper: {
        width: '450px',
        margin: 'auto',
        marginTop: '20px',
        backgroundColor: '#fff',
        border: '1px solid #eee'
    }
}));

export const PrivateRoute = ({ component: Component, ...rest }) => {
    const classes = useStyles();
    let user = JSON.parse(localStorage.getItem('user'))
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        Demonstração
                        </Typography>
                    <Button color="inherit">Logout</Button>
                </Toolbar>
            </AppBar>
            <Route {...rest} render={props => (
                user ? <Component {...props} user={user} />
                    : <Redirect to={{ pathname: '/account/login', state: { from: props.location } }} />
            )} />
        </>
    )
}