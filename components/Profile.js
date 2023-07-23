import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  updateDoc,
  increment,
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  where,
  query,
  doc,
  serverTimestamp,
  addDoc,
  deleteDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { app } from '../app';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import StarIcon from '@mui/icons-material/Star';
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
import Divider from '@mui/material/Divider';
import { Box, borders, styled } from '@mui/system';
import UserProfile from './UserProfile';

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
  const [bio, setBio] = useState('');
  const [followers, setFollowers] = useState([]);
  const [followings, setFollowings] = useState([]);
  const [users, setUsers] = useState([]);
  const [openFollowings, setOpenFollowings] = useState(false);
  const [openFollowers, setOpenFollowers] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [openReport, setOpenReport] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportText, setReportText] = useState('');
  const [userIdToReport, setUserIdToReport] = useState(null);
  const reportTypes = ['Falsely pinning a water source', 'Inappropriate reviews', 'Spamming', 'Being a bully'];

  const fetchUsersData = async () => {
    const q = await getDocs(collection(db, 'users'));
    const usersArray = q.docs.map(doc => ({
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
      const unsub = onSnapshot(
        query(collection(db, 'connections'), where('follower', '==', auth.currentUser.uid)),
        snapshot => {
          const followingArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setFollowings(followingArray);
        }
      );
      return unsub;
    };

    const fetchFollowers = () => {
      const unsub = onSnapshot(
        query(collection(db, 'connections'), where('following', '==', auth.currentUser.uid)),
        snapshot => {
          const followersArray = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setFollowers(followersArray);
        }
      );
      return unsub;
    };

    if (auth.currentUser) {
      const unsubFollowings = fetchFollowings();
      const unsubFollowers = fetchFollowers();
      return () => {
        unsubFollowings();
        unsubFollowers();
      };
    }
  }, []);

  const handleFollow = async userId => {
    const time = serverTimestamp();
    await addDoc(collection(db, 'connections'), {
      follower: auth.currentUser.uid,
      following: userId,
      timestamp: time,
    });
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      following: increment(1),
    });
    await updateDoc(doc(db, 'users', userId), {
      followers: increment(1),
    });
    fetchUsersData();
  };

  const handleUnfollow = async connection => {
    await deleteDoc(doc(db, 'connections', connection.id));
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      following: increment(-1),
    });
    await updateDoc(doc(db, 'users', connection.following), {
      followers: increment(-1),
    });
    fetchUsersData();
  };
  const handleBioUpdate = async () => {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      bio: bio,
    });
    fetchUsersData();
  };

  const handleCloseProfile = () => {
    setOpenProfile(false);
  };

  const handleOpenProfile = userId => {
    setProfileUserId(userId);
    setOpenProfile(true);
  };

  const handleCloseReport = () => {
    setOpenReport(false);
  };

  const handleOpenReport = userId => {
    setUserIdToReport(userId);
    setOpenReport(true);
  };

  const handleSubmitReport = async () => {
    if (reportType && reportText) {
      const time = serverTimestamp();
      await addDoc(collection(db, 'reports'), {
        reporter: auth.currentUser.uid,
        reportedUser: userIdToReport,
        timestamp: time,
        type: reportType,
        description: reportText,
      });
      setReportType('');
      setReportText('');
      handleCloseReport();
      alert('Your report has been submitted and is being reviewed.');
    } else {
      alert('Please fill in all fields to submit a report.');
    }
  };

  const filteredFollowings = searchText
    ? followings.filter(following =>
        (users.find(user => user.id === following.following)?.name ?? 'no name')
          .toLowerCase()
          .includes(searchText.toLowerCase())
      )
    : followings;

  const filteredFollowers = searchText
    ? followers.filter(follower =>
        (users.find(user => user.id === follower.follower)?.name ?? 'no name')
          .toLowerCase()
          .includes(searchText.toLowerCase())
      )
    : followers;
  const handleReport = userId => {
    handleOpenReport(userId);
  };
  const [oz, setOz] = useState(0); // amount of water intake in ounces
  const [waterIntakelog, setWaterIntakelog] = useState([]); // array to intake log entries
  const [resultValue, setResultVal] = useState(''); // display the result

  // collects data on water intake
  const addWaterIntake = async () => {
    try {
      await addDoc(collection(db, 'waterIntake'), {
        amount: oz,
        timestamp: serverTimestamp(),
        userId: auth.currentUser.uid,
      });

      console.log('water intake added successfully');
      setOz(0);
      return Promise.resolve();
    } catch (error) {
      console.error('error in adding water intake', error);
      return Promise.reject(error);
    }
  };
  const handleSubmitIntake = () => {
    addWaterIntake()
      .then(() => {
        console.log('Water intake submitted successfully.');
      })
      .catch(error => {
        console.error('Error in handleSubmitIntake:', error);
      });
  };

  const handleIncrease = () => {
    setOz(prevValue => prevValue + 1);
  };
  const handleDecrease = () => {
    setOz(prevValue => prevValue - 1);
  };
  const handleInput = event => {
    const newValue = parseInt(event.target.value);
    setOz(isNaN(newValue) ? 0 : newValue);
  };
  const formatTimestamp = timestamp => {
    if (timestamp instanceof Date) {
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      };
      return new Intl.DateTimeFormat('en-US', options).format(timestamp);
    } else if (timestamp && timestamp.seconds) {
      const dateObject = new Date(timestamp.seconds * 1000);
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      };
      return new Intl.DateTimeFormat('en-US', options).format(dateObject);
    } else {
      // Handle the case when timestamp is null or invalid
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'waterIntake'), where('userId', '==', auth.currentUser.uid), orderBy('timestamp', 'desc')),
      snapshot => {
        const logData = snapshot.docs.map(doc => doc.data());
        setWaterIntakelog(logData);
      }
    );
    return () => unsub();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <div>
        <Box display="flex" justifyContent="center" style={{ marginTop: '1em' }}>
          <Button onClick={() => setOpenFollowers(true)}>
            <LabelText border={2} borderRadius="16px" style={{ color: '#209cee' }}>
              &nbsp;Followers&nbsp;
            </LabelText>
          </Button>
          <Button onClick={() => setOpenFollowings(true)}>
            <LabelText border={2} borderRadius="16px" style={{ color: '#209cee' }}>
              &nbsp;Following&nbsp;
            </LabelText>
          </Button>
        </Box>
        <FormControl fullWidth>
          <FormLabel>Update Your Bio</FormLabel>
          <TextField sx={{ mr: '22px' }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Your bio..." />
          <Box display="flex" justifyContent="center" style={{ marginTop: '1em' }}>
            <Button
              onClick={handleBioUpdate}
              style={{ color: '#209cee', fontWeight: 'bold', whiteSpace: 'nowrap' }}
              sx={{ fontSize: '1.2rem', p: '1em', width: '150px' }}
            >
              Update Bio
            </Button>
          </Box>
        </FormControl>
        <div>
          <br></br>
          <FormLabel>Record water intake (oz):</FormLabel>
          <Box display="flex" justifyContent="center" style={{ marginTop: '1em' }}>
            <button onClick={handleDecrease} style={{ fontSize: '28px' }}>
              –
            </button>
            <input
              type="number"
              value={oz}
              onChange={handleInput}
              style={{ textAlign: 'center', fontSize: '28px', width: '50%' }}
            />
            <button onClick={handleIncrease} style={{ fontSize: '28px' }}>
              +
            </button>
            <br></br>
            {/*<button onClick={() => addWaterIntake(oz)} style={{ fontSize: '22px' }}>Submit</button>*/}
            <button onClick={handleSubmitIntake} style={{ fontSize: '20px' }}>
              Record
            </button>
          </Box>
          {waterIntakelog.map((entry, index) => (
            <p key={index} style={{}}>{`Thirst Quenched 💦 — ${entry.amount} oz at ${entry.timestamp
              .toDate()
              .toLocaleTimeString('en-US')}`}</p>
          ))}
        </div>
      </div>
      <Divider orientation="vertical" flexItem />

      {/* Report User Dialog */}
      <Dialog open={openReport} onClose={handleCloseReport}>
        <DialogTitle>Report User</DialogTitle>
        <DialogContent>
          <DialogContentText>Please fill in the following details for your report.</DialogContentText>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select value={reportType} onChange={e => setReportType(e.target.value)}>
              {reportTypes.map((type, index) => (
                <MenuItem value={type} key={index}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="dense"
            label="Report Description"
            type="text"
            value={reportText}
            onChange={e => setReportText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReport}>Cancel</Button>
          <Button onClick={handleSubmitReport}>Submit Report</Button>
        </DialogActions>
      </Dialog>

      {/* The rest of your Dialogs and Dialog components here */}
      <Dialog
        onClose={() => {
          setOpenFollowers(false);
          setSearchText('');
        }}
        open={openFollowers}
      >
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
          onChange={e => setSearchText(e.target.value)}
          placeholder="Search followers..."
          fullWidth
        />
        <List>
          {filteredFollowers.map(follower => (
            <ListItem key={follower.id}>
              <Typography>{users.find(user => user.id === follower.follower)?.name}</Typography>
              {followings.find(following => following.following === follower.follower) && <StarIcon />}
              {followings.find(following => following.following === follower.follower) ? (
                <Button
                  onClick={() =>
                    handleUnfollow(followings.find(following => following.following === follower.follower))
                  }
                  style={{ color: '#209cee' }}
                >
                  Unfollow
                </Button>
              ) : (
                <Button onClick={() => handleFollow(follower.follower)} style={{ color: '#209cee' }}>
                  Follow
                </Button>
              )}
              <Button onClick={() => handleReport(follower.follower)} style={{ color: '#209cee' }}>
                Report
              </Button>
              <Button onClick={() => handleOpenProfile(follower.follower)} style={{ color: '#209cee' }}>
                Profile
              </Button>
            </ListItem>
          ))}
        </List>
      </Dialog>

      <Dialog
        onClose={() => {
          setOpenFollowings(false);
          setSearchText('');
        }}
        open={openFollowings}
      >
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
          onChange={e => setSearchText(e.target.value)}
          placeholder="Search people you follow..."
          fullWidth
        />
        <List>
          {filteredFollowings.map(following => (
            <ListItem key={following.id}>
              <Typography>{users.find(user => user.id === following.following)?.name}</Typography>
              {followers.find(follower => (follower.fallower = following.following)) && <StarIcon />}
              <Button onClick={() => handleUnfollow(following)} style={{ color: '#209cee' }}>
                Unfollow
              </Button>
              <Button onClick={() => handleReport(following.following)} style={{ color: '#209cee' }}>
                Report
              </Button>
              <Button onClick={() => handleOpenProfile(following.following)} style={{ color: '#209cee' }}>
                Profile
              </Button>
            </ListItem>
          ))}
        </List>
      </Dialog>
      <UserProfile user={users.find(user => user.id === auth.currentUser.uid)} />
    </Box>
  );
}
