import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';
import { updateDoc, increment, getFirestore, collection, getDocs, onSnapshot, where, query, doc, serverTimestamp, addDoc, deleteDoc } from 'firebase/firestore';
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
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import DirectionsBoatFilledSharpIcon from '@mui/icons-material/DirectionsBoatFilledSharp';
import Diversity1SharpIcon from '@mui/icons-material/Diversity1Sharp';
import WaterDropSharpIcon from '@mui/icons-material/WaterDropSharp';
import VerifiedSharpIcon from '@mui/icons-material/VerifiedSharp';
import RateReviewSharpIcon from '@mui/icons-material/RateReviewSharp';
import EmojiEventsSharpIcon from '@mui/icons-material/EmojiEventsSharp';
import Tooltip from '@mui/material/Tooltip';
import { Box } from '@mui/system';
import { styled } from '@mui/system';

import UserProfile from './UserProfile';

const auth = getAuth(app);
const db = getFirestore(app);



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
    const [openReport, setOpenReport] = useState(false);
    const [reportType, setReportType] = useState("");
    const [reportText, setReportText] = useState("");
    const [userIdToReport, setUserIdToReport] = useState(null);
    const reportTypes = ["Falsely pinning a water source", "Inappropriate reviews", "Spamming", "Being a bully"];

    const fetchUsersData = async () => {
        const q = await getDocs(collection(db, "users"));
        const usersArray = q.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setUsers(usersArray);
        setBio(usersArray.find(user => user.id === auth.currentUser.uid).bio);
    };

    useEffect(() => {
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
                const followersArray = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

    const handleFollow = async (userId) => {
        const time = serverTimestamp();
        await addDoc(collection(db, "connections"), {
            follower: auth.currentUser.uid,
            following: userId,
            timestamp: time
        });
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            following: increment(1)
        });
        await updateDoc(doc(db, 'users', userId), {
            followers: increment(1)
        });
        fetchUsersData();
    };

    const handleUnfollow = async (connection) => {
        await deleteDoc(doc(db, "connections", connection.id));
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            following: increment(-1)
        });
        await updateDoc(doc(db, 'users', connection.following), {
            followers: increment(-1)
        });
        fetchUsersData();
    };
    const handleBioUpdate = async () => {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            bio: bio
        });
        fetchUsersData();
    }

    const handleCloseProfile = () => {
        setOpenProfile(false);
    };

    const handleOpenProfile = (userId) => {
        setProfileUserId(userId);
        setOpenProfile(true);
    };

    const handleCloseReport = () => {
        setOpenReport(false);
    };

    const handleOpenReport = (userId) => {
        setUserIdToReport(userId);
        setOpenReport(true);
    };

    const handleSubmitReport = async () => {
        if (reportType && reportText) {
            const time = serverTimestamp();
            await addDoc(collection(db, "reports"), {
                reporter: auth.currentUser.uid,
                reportedUser: userIdToReport,
                timestamp: time,
                type: reportType,
                description: reportText
            });
            setReportType("");
            setReportText("");
            handleCloseReport();
            alert("Your report has been submitted and is being reviewed.");
        } else {
            alert("Please fill in all fields to submit a report.");
        }
    };

    const filteredFollowings = searchText
        ? followings.filter((following) =>
            (users.find(user => user.id === following.following)?.name ?? "no name").toLowerCase().includes(searchText.toLowerCase())
        )
        : followings;

    const filteredFollowers = searchText
        ? followers.filter((follower) =>
            (users.find(user => user.id === follower.follower)?.name ?? "no name").toLowerCase().includes(searchText.toLowerCase())
        )
        : followers;
    const handleReport = (userId) => {
        handleOpenReport(userId);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            <div>
            <Button onClick={() => setOpenFollowers(true)}>
                Followers
            </Button>
            <Button onClick={() => setOpenFollowings(true)}>
                Following
            </Button>
            <FormControl fullWidth>
                    <FormLabel>Update Your Bio</FormLabel>
                    <TextField value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Your bio..." />
                    <Box display="flex" justifyContent="center" style={{ marginTop: '1em' }}>
                        <Button onClick={handleBioUpdate} style={{ color: '#209cee', fontWeight: 'bold', whiteSpace: 'nowrap' }} sx={{ fontSize: '1.2rem', p: '1em', width: '150px' }}>Update Bio</Button>
                    </Box>
                </FormControl>
            </div>

            {/* Report User Dialog */}
            <Dialog open={openReport} onClose={handleCloseReport}>
                <DialogTitle>Report User</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please fill in the following details for your report.
                    </DialogContentText>
                    <FormControl fullWidth>
                        <InputLabel>Report Type</InputLabel>
                        <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                            {reportTypes.map((type, index) => (
                                <MenuItem value={type} key={index}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        margin="dense"
                        label="Report Description"
                        type="text"
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReport}>Cancel</Button>
                    <Button onClick={handleSubmitReport}>Submit Report</Button>
                </DialogActions>
            </Dialog>

            {/* The rest of your Dialogs and Dialog components here */}
            <Dialog onClose={() => setOpenFollowers(false)} open={openFollowers}>
                {/* User Profile Dialog */}
                <Dialog open={openProfile} onClose={handleCloseProfile}>
                    <DialogTitle>User Profile</DialogTitle>
                    <DialogContent>
                        {/* Here you should render the user profile information */}
                        <UserProfile user={users.find(user => user.id === profileUserId)} />
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
                    {filteredFollowers.map((follower) => (
                        <ListItem key={follower.id}>
                            <Typography>{users.find(user => user.id === follower.follower)?.name}</Typography>
                            {followings.find(following => following.following === follower.follower) && <StarIcon />}
                            {(followings.find(following => following.following === follower.follower)
                                ? <Button onClick={() => handleUnfollow(followings.find(following => following.following === follower.follower))} style={{ color: '#209cee' }}>Unfollow</Button>
                                : <Button onClick={() => handleFollow(follower.follower)} style={{ color: '#209cee' }}>Follow</Button>
                            )}
                            <Button onClick={() => handleReport(follower.follower)} style={{ color: '#209cee' }}>Report</Button>
                            <Button onClick={() => handleOpenProfile(follower.follower)} style={{ color: '#209cee' }}>Profile</Button>
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
                            <UserProfile user={users.find(user => user.id === profileUserId)} />
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseProfile}>Close</Button>
                    </DialogActions>
                </Dialog>

                <DialogTitle>Following</DialogTitle>
                <TextField
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search people you follow..."
                    fullWidth
                />
                <List>
                    {filteredFollowings.map((following) => (
                        <ListItem key={following.id}>
                            <Typography>{users.find(user => user.id === following.following)?.name}</Typography>
                            {followers.find(follower => follower.fallower = following.following) && <StarIcon />}
                            <Button onClick={() => handleUnfollow(following)} style={{ color: '#209cee' }}>Unfollow</Button>
                            <Button onClick={() => handleReport(following.following)} style={{ color: '#209cee' }}>Report</Button>
                            <Button onClick={() => handleOpenProfile(following.following)} style={{ color: '#209cee' }}>Profile</Button>
                        </ListItem>
                    ))}
                </List>
            </Dialog>
            <UserProfile user={users.find(user => user.id === auth.currentUser.uid)} />
        </Box >
    );
}












