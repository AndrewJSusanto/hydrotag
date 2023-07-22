//this is a component for displaying any user's profile
//it might pop up when you click another user's name.

//send in all the relevant data in the 'user' prop:
//ex. <UserProfile user={user} />

import React, { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, serverTimestamp, Timestamp, getDoc} from 'firebase/firestore';
import { app } from '../app';
import AccountCircleSharpIcon from '@mui/icons-material/AccountCircleSharp';
import Typography from '@mui/material/Typography';
import DirectionsBoatFilledSharpIcon from '@mui/icons-material/DirectionsBoatFilledSharp';
import Diversity1SharpIcon from '@mui/icons-material/Diversity1Sharp';
import WaterDropSharpIcon from '@mui/icons-material/WaterDropSharp';
import VerifiedSharpIcon from '@mui/icons-material/VerifiedSharp';
import RateReviewSharpIcon from '@mui/icons-material/RateReviewSharp';
import EmojiEventsSharpIcon from '@mui/icons-material/EmojiEventsSharp';
import Tooltip from '@mui/material/Tooltip';
import { Box } from '@mui/system';
import { styled } from '@mui/system';
import { ContactSupportOutlined } from '@mui/icons-material';

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

const auth = getAuth(app);
const db = getFirestore(app);

export default function UserProfile(props) {

    //didn't want to get data here but it's necessary to check if you're at the top of the leaderboard
    // want to get data of most recent timestamp
    const [users, setUsers] = useState([]);
    const [recentTime, setRecent] = useState('');
    const userLatest = getDoc(collection(db, 'users', auth.currentUser.uid, 'lastActive'));

    const fetchUsersData = async () => {
        const q = await getDocs(collection(db, "users"));
        const usersArray = q.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setUsers(usersArray);
        console.log('Users:' + users)
    };

    const handleLastActive = async () => {
        const current = Timestamp.now();
        const recent = u.lastActive;
        const difference = current - recent;
        let minutes = Math.round(difference / 60)
        // difference is in seconds. if difference / 60 less than 1, then express in minutes. if minutes / 60 less than 1, say just now.
        console.log(recent)
        if (minutes > 1) {
            setRecent(Math.round(minutes).toString() + ' minutes ago')
            //console.log('Around ' + Math.round(minutes) + ' minutes ago' );
        }
        else if ((minutes / 60) > 1) {
            let hours = minutes / 60;
            setRecent(Math.round(hours).toString() + ' hours ago')
            //console.log('Around ' + Math.round(hours) + ' hours ago' );
        }
        else {
            setRecent('Now')
        }
        console.log('Current time: ' + current + '\nLast Active: ' + recent + '\nDifference: ' + difference);
    }
    handleLastActive();

    useEffect(() => {
        fetchUsersData();
    }, []);

    return props.user && (
        <div>
            <Box sx={{ flex: '1 1', p: 2 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <AccountCircleSharpIcon sx={{ width: 200, height: 200, color: '#808080', fontSize: '2.5rem', margin: '0 auto' }}>
                        {props.user.name}
                    </AccountCircleSharpIcon>
                    <Typography variant="h4" align="center" style={{ marginTop: '1em', fontWeight: 'bold' }}>
                        {props.user.name}
                    </Typography>
                    <Typography variant="h6" align="center" style={{ marginTop: '1em', fontWeight: 'bold' }}>
                        {props.user.email}
                    </Typography>
                </Box>
                <Box display="flex" justifyContent="center" flexDirection="row" alignItems="center" marginTop="2em">
                    <Box display="flex" flexDirection="column" alignItems="center" marginX="1em">
                        <CountText variant="h2" sx={{ fontWeight: 'bold' }}>{props.user.followers} </CountText>
                        <LabelText variant="body1">Followers</LabelText>
                    </Box>
                    <Box display="flex" flexDirection="column" alignItems="center" marginX="1em">
                        <CountText variant="h2" sx={{ fontWeight: 'bold' }}>{props.user.following}</CountText>
                        <LabelText variant="body1">Following</LabelText>
                    </Box>
                    <Box display="flex" flexDirection="column" alignItems="center" marginX="1em">
                        <CountText variant="h2" sx={{ fontWeight: 'bold' }}>{props.user.streak} </CountText>
                        <LabelText variant="body1">🔥Daily Streak🔥</LabelText>
                        <CountText variant="h3">{recentTime}</CountText>
                        <LabelText variant="body2" color="secondary">Last Active</LabelText>
                    </Box>
                </Box>

            </Box>
            <Typography variant="p" sx={{ marginLeft: '50px' }}>{props.user.bio}</Typography>
            <Box sx={{ flex: '1 1', p: 2 }}>
                <Typography variant="h5">Badges</Typography>
                <Box display="flex" flexDirection="column" alignItems="center" marginTop="2em">
                    {/* First Row */}
                    <Box display="flex" justifyContent="center" alignItems="center">
                        {/* Badge 1 */}
                        <Tooltip title="Awarded for joining the HydroTag community">
                            <Box display="flex" flexDirection="column" alignItems="center" marginX="2em" onClick={() => handleOpenBadgeDetails("Welcome Aboard")} style={{ cursor: "pointer" }}>
                                <DirectionsBoatFilledSharpIcon sx={{ fontSize: '3rem', color: 'gold' }} />
                                <Typography variant="h6">Welcome Aboard</Typography>
                            </Box>
                        </Tooltip>
                        {/* Badge 2 */}
                        <Tooltip title="Given for following someone on HydroTag">
                            <Box display="flex" flexDirection="column" alignItems="center" marginX="2em" onClick={() => handleOpenBadgeDetails("Social Hydrator")} style={{ cursor: "pointer" }}>
                                <Diversity1SharpIcon sx={{ fontSize: '3rem', color: props.user.following > 0 ? 'gold' : 'grey' }} />
                                <Typography variant="h6">Social Hydrator</Typography>
                            </Box>
                        </Tooltip>
                        {/* Badge 3 */}
                        < Tooltip title="Given for pinning their first water marker" >
                            <Box display="flex" flexDirection="column" alignItems="center" marginX="2em" onClick={() => handleOpenBadgeDetails("Water Tracker Pioneer")} style={{ cursor: "pointer" }}>
                                <WaterDropSharpIcon sx={{ fontSize: '3rem', color: props.user.markers > 0 ? 'gold' : 'grey' }} />
                                <Typography variant="h6">Water Tracker Pioneer</Typography>
                            </Box>
                        </Tooltip >
                    </Box>
                    {/* Second Row */}
                    <Box display="flex" justifyContent="center" alignItems="center" marginTop="2em" onClick={() => handleOpenBadgeDetails("Hydro Influencer")} style={{ cursor: "pointer" }}>
                        {/* Badge 4 */}
                        < Tooltip title="Awarded for having five followers on HydroTag" >
                            <Box display="flex" flexDirection="column" alignItems="center" marginX="2em">
                                <VerifiedSharpIcon sx={{ fontSize: '3rem', color: props.user.followers >= 5 ? 'gold' : 'grey' }} />
                                <Typography variant="h6">Hydro Influencer</Typography>
                            </Box>
                        </Tooltip >
                        {/* Badge 5 */}
                        < Tooltip title="Given for writing their first review on HydroTag" >
                            <Box display="flex" flexDirection="column" alignItems="center" marginX="2em" onClick={() => handleOpenBadgeDetails("Hydro Critic")} style={{ cursor: "pointer" }}>
                                <RateReviewSharpIcon sx={{ fontSize: '3rem', color: props.user.reviews > 0 ? 'gold' : 'grey' }} />
                                <Typography variant="h6">Hydro Critic</Typography>
                            </Box>
                        </Tooltip >
                        {/* Badge 6 */}
                        <Tooltip title="Awarded for being number 1 on the HydroTag leaderboard">
                            <Box display="flex" flexDirection="column" alignItems="center" marginX="2em" onClick={() => handleOpenBadgeDetails("Aquatic Ace")} style={{ cursor: "pointer" }}>
                                <EmojiEventsSharpIcon sx={{ fontSize: '3rem', color: props.user.markers >= Math.max(...users.map(user => user.markers ?? 0)) ? 'gold' : 'grey' }} />
                                <Typography variant="h6">Aquatic Ace</Typography>
                            </Box>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>

        </div>
    );
}