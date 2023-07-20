import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, updateProfile } from 'firebase/auth';
import { getFirestore, collection, getDocs, onSnapshot, where, query, doc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
import { app } from '../app';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import StarIcon from '@mui/icons-material/Star';
import AccountCircleSharpIcon from '@mui/icons-material/AccountCircleSharp';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/system';
import { styled } from '@mui/system';

const auth = getAuth(app);
const db = getFirestore(app);

const CountText = styled(Typography)(({ theme }) => ({
    fontSize: '2rem',
    color: '#209cee',
    cursor: 'pointer',
}));

const LabelText = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    color: 'black',
    cursor: 'pointer',
}));

export default function Profile() {
    const [bio, setBio] = useState("");
    const [followers, setFollowers] = useState([]);
    const [followings, setFollowings] = useState([]);
    const [users, setUsers] = useState([]);
    const [openFollowings, setOpenFollowings] = useState(false);
    const [openFollowers, setOpenFollowers] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [profileUserId, setProfileUserId] = useState(null);
    const [searchText, setSearchText] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchUsersData = async () => {
            const q = await getDocs(collection(db, "users"));
            const usersArray = q.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setUsers(usersArray);
        };
        fetchUsersData();
    }, []);

    useEffect(() => {
        const fetchFollowings = () => {
            const unsub = onSnapshot(query(collection(db, "connections"), where('follower', '==', auth.currentUser.uid)), (snapshot) => {
                const followingArray = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setFollowings(followingArray);
            });
            return unsub;
        };

        const fetchFollowers = () => {
            const unsub = onSnapshot(query(collection(db, "connections"), where('following', '==', auth.currentUser.uid)), (snapshot) => {
                const followersArray = snapshot.docs.map((doc) => doc.data().follower);
                setFollowers(followersArray);
            });
            return unsub;
        };

        if (auth.currentUser) {
            const unsubFollowings = fetchFollowings();
            const unsubFollowers = fetchFollowers();
            return () => {
                unsubFollowings();
                unsubFollowers();
            }
        }
    }, []);

    const handleUnfollow = async (connectionId) => {
        await deleteDoc(doc(db, "connections", connectionId));
    };

    const handleBioUpdate = async () => {
        await updateProfile(auth.currentUser, { displayName: bio });
    }

    const handleCloseProfile = () => {
        setOpenProfile(false);
    };

    const handleOpenProfile = (userId) => {
        setProfileUserId(userId);
        setOpenProfile(true);
    };

    const filteredFollowings = searchText
        ? followings.filter((following) =>
            users.find(user => user.id === following.following)?.email.toLowerCase().includes(searchText.toLowerCase())
        )
        : followings;

    const filteredFollowers = searchText
        ? followers.filter((followerId) =>
            users.find(user => user.id === followerId)?.email.toLowerCase().includes(searchText.toLowerCase())
        )
        : followers;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <Box sx={{ flex: '1 1', p: 2 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <AccountCircleSharpIcon sx={{ width: 200, height: 200, color: '#808080', fontSize: '2.5rem', margin: '0 auto' }}>
                        {auth.currentUser?.email[0].toUpperCase()}
                    </AccountCircleSharpIcon>
                    <Typography variant="h6" align="center" style={{ marginTop: '1em', fontWeight: 'bold' }}>
                        {auth.currentUser?.email}
                    </Typography>
                </Box>
                <Box display="flex" justifyContent="center" flexDirection="row" alignItems="center" marginTop="2em">
                    <Box display="flex" flexDirection="column" alignItems="center" onClick={() => setOpenFollowers(true)} marginX="1em">
                        <CountText variant="h2" sx={{ fontWeight: 'bold' }}>{followers.length} </CountText>
                        <LabelText variant="body1">Followers</LabelText>
                    </Box>
                    <Box display="flex" flexDirection="column" alignItems="center" onClick={() => setOpenFollowings(true)} marginX="1em">
                        <CountText variant="h2" sx={{ fontWeight: 'bold' }}>{followings.length}</CountText>
                        <LabelText variant="body1">Following</LabelText>
                    </Box>
                </Box>
                <FormControl fullWidth>
                    <FormLabel>Bio</FormLabel>
                    <TextField value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Your bio..." />
                    <Box display="flex" justifyContent="center" style={{ marginTop: '1em' }}>
                        <Button onClick={handleBioUpdate} style={{ color: '#209cee', fontWeight: 'bold', whiteSpace: 'nowrap' }} sx={{ fontSize: '1.2rem', p: '1em', width: '150px' }}>Update Bio</Button>
                    </Box>
                </FormControl>

            </Box>
            <Box sx={{ flex: '1 1', p: 2 }}>
                <Typography variant="h5">Will be adding user badges and water streak here !!!</Typography>
            </Box>

            {/* The rest of your Dialogs and Dialog components here */}
            <Dialog onClose={() => setOpenFollowers(false)} open={openFollowers}>
                {/* User Profile Dialog */}
                <Dialog open={openProfile} onClose={handleCloseProfile}>
                    <DialogTitle>User Profile</DialogTitle>
                    <DialogContent>
                        {/* Here you should render the user profile information */}
                        <DialogContentText>
                            User ID: {profileUserId}
                            {/* Add the rest of the user information here */}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseProfile}>Close</Button>
                    </DialogActions>
                </Dialog>

                <DialogTitle>Followers</DialogTitle>
                <TextField
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search followers..."
                    fullWidth
                />
                <List>
                    {filteredFollowers.map((followerId) => (
                        <ListItem key={followerId}>
                            <Typography>{users.find(user => user.id === followerId)?.email}</Typography>
                            {followings.find(following => following.following === followerId) && <StarIcon />}
                            <Button onClick={() => handleOpenProfile(followerId)} style={{ color: '#209cee' }}>Profile</Button>
                        </ListItem>
                    ))}
                </List>
            </Dialog>

            <Dialog onClose={() => setOpenFollowings(false)} open={openFollowings}>
                {/* User Profile Dialog */}
                <Dialog open={openProfile} onClose={handleCloseProfile}>
                    <DialogTitle>User Profile</DialogTitle>
                    <DialogContent>
                        {/* Here you should render the user profile information */}
                        <DialogContentText>
                            User ID: {profileUserId}
                            {/* Add the rest of the user information here */}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseProfile}>Close</Button>
                    </DialogActions>
                </Dialog>

                <DialogTitle>Followings</DialogTitle>
                <TextField
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search followings..."
                    fullWidth
                />
                <List>
                    {filteredFollowings.map((following) => (
                        <ListItem key={following.id}>
                            <Typography>{users.find(user => user.id === following.following)?.email}</Typography>
                            {followers.includes(following.following) && <StarIcon />}
                            <Button onClick={() => handleOpenProfile(following.following)} style={{ color: '#209cee' }}>Profile</Button>
                            <Button onClick={() => handleUnfollow(following.id)} style={{ color: '#209cee' }}>Unfollow</Button>
                        </ListItem>
                    ))}
                </List>
            </Dialog>

        </Box >
    );
}




