import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { api, Websocket } from '../../api';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Grid from '@material-ui/core/Grid';
import { Delete as DeleteIcon, Input as InputIcon, Add as AddIcon, Lock as LockIcon } from '@material-ui/icons';
import TextField from '@material-ui/core/TextField';
import Modal from '@material-ui/core/Modal';

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

function HomePage(props) {
    const history = useHistory();

    const [user, setUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        api.defaults.headers.Authorization = `Bearer ${props.user.token}`;
        api.defaults.headers.TokenId = props.user.id;
    }, []);

    useEffect(() => {
        if (ws)
            ws.listarSalas();
    }, [ws]);

    useEffect(() => {
        setUser(props.user);
        setWs(Websocket({ handleUpdateRoomList: handleUpdateRoomList }, socket));
        setSocket(socket);
    }, [setUser, setWs, setSocket]);



    const [inputs, setInputs] = useState({
        roomName: null,
        password: null
    });

    const [rooms, setRooms] = useState([]);
    const [open, setOpen] = useState(false);
    const [openModalPass, setOpenModalPass] = useState(false);

    function handleChange(e) {
        const { name, value } = e.target;
        inputs[name] = value
        setInputs(inputs);
    }

    function handleUpdateRoomList(list) {
        if (list) {
            setRooms(list);
        }
    }

    function handleOpen(room) {
        if (room.password) {
            setOpenModalPass(true)
        } else {
            props.history.push('/room/' + room.salaId)
        }
    }

    function handleRemoveRoom(room) {
        ws.removeRoom(room.salaId)
    }

    function generateItens() {
        return rooms.map((item, index) => {
            return (
                <ListItem key={index}>
                    <ListItemText
                        style={{ flexDirection: "row", display: "flex" }}
                        disableTypography={true}
                        children={<>
                            <Typography>Sala: {item.roomName}</Typography>
                            {item.password &&
                                <LockIcon style={{ fontSize: 18, color: '#aaa' }}
                                ></LockIcon>
                            }
                        </>}
                    />
                    <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="entrar" onClick={() => handleOpen(item)}>
                            <InputIcon />
                        </IconButton>
                        {item.createUser === user.user.id &&
                            <IconButton onClick={() => handleRemoveRoom(item)} edge="end" aria-label="delete">
                                <DeleteIcon />
                            </IconButton>
                        }
                    </ListItemSecondaryAction>
                </ListItem>
            );
        });
    }

    function createRoom(e) {
        let room = {
            roomName: inputs.roomName,
            password: inputs.password,
            createUser: user.user.id
        }
        ws.createRoom(room)
        setOpen(false)
    }

    function handleClose() {
        setOpen(false)
    }

    const classes = useStyles();

    const body = (
        <div className={classes.paper}>
            <h2 id="simple-modal-title">Criar sala</h2>
            <Paper id="simple-modal-description" style={{ padding: 10 }}>
                <Grid container>
                    <Grid item xs={12}>
                        <TextField
                            required
                            id="roomName"
                            fullWidth
                            type="text"
                            label="Nome da sala"
                            name="roomName"
                            autoFocus
                            onChange={handleChange} />
                        <TextField
                            fullWidth
                            name="password"
                            label="Senha"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            onChange={handleChange} />
                        <Button variant="contained" color="primary" style={{ alignSelf: 'end', marginTop: 10 }} onClick={() => { createRoom(this) }}>
                            Criar sala
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </div>
    );

    return (
        <div>
            <Grid container direction="row" style={{ backgroundColor: '#eee', height: '100%' }}>
                <Paper className={classes.paper}>
                    <div>
                        <AppBar position="relative" style={{ flexDirection: 'row', padding: '5px' }}>
                            <Typography variant="h6" className={classes.title} style={{ paddingTop: '5px' }}>
                                Salas
                            </Typography>
                            <IconButton aria-label="Adicionar" onClick={() => { setOpen(!open) }}>
                                <AddIcon style={{ color: '#fff' }} />
                            </IconButton>
                        </AppBar>
                    </div>
                    <Grid container>
                        <Grid item xs={12}>
                            <div>
                                {rooms.length == 0 && (<Typography>Nenhuma sala encontrada</Typography>)}
                                {rooms.length > 0 && (
                                    <List dense={true}>
                                        {generateItens()}
                                    </List>
                                )}
                            </div>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
            >
                {body}
            </Modal>
        </div >
    );
}

export { HomePage };