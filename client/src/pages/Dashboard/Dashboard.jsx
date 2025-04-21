import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketInstance from '../../VideoCallSocket';
import { Howl } from 'howler';
import Peer from 'simple-peer';
import apiClient from '../../apiClient';
import { useUser } from '../../context/UserContextApi';
import {
  FaBars,
  FaTimes,
  FaPhoneAlt,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaHandPaper
} from 'react-icons/fa';
import { RiLogoutBoxLine } from 'react-icons/ri';

export const Dashboard = () => {
  const { username: routeUsername } = useParams();
  const { user: currentUser, updateUser } = useUser();
  const navigate = useNavigate();
  const displayName = (routeUsername || currentUser?.username || 'GUEST').toUpperCase();
  const greetingText = `GOOD MORNING ${displayName}`;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState('');
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [receiveCall, setReceiveCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callerName, setCallerName] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callerWaiting, setCallerWaiting] = useState(false);
  const [callRejectedPopUp, setCallRejectedPopUp] = useState(false);
  const [rejectorData, setRejectorData] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  const myVideo = useRef(null);
  const receiverVideo = useRef(null);
  const connectionRef = useRef(null);
  const hasJoined = useRef(false);

  const ringtone = new Howl({ src: ['/ringtone.mp3'], loop: false, volume: 1.0 });
  const socket = socketInstance.getSocket();

  useEffect(() => {
    if (currentUser && socket && !hasJoined.current) {
      socket.emit('join', { id: currentUser._id, name: currentUser.username });
      hasJoined.current = true;
    }
    socket.on('me', id => setMe(id));
    socket.on('online-users', list => setOnlineUsers(list));
    socket.on('callToUser', data => {
      if (receiveCall) return; // Ignore new calls if one is active
      setReceiveCall(true);
      setCaller(data);
      setCallerName(data.name);
      setCallerSignal(data.signal);
      ringtone.play();
    });
    socket.on('callRejected', data => {
      setCallRejectedPopUp(true);
      setRejectorData(data);
      ringtone.stop();
    });
    socket.on('callEnded', () => {
      ringtone.stop();
      endCallCleanup();
    });
    socket.on('userUnavailable', data => alert(data.message || 'User is not available.'));
    socket.on('userBusy', data => alert(data.message || 'User is busy.'));
    socket.on('disconnect', () => {
      alert('Lost connection to the server.');
      endCallCleanup();
    });
    return () => {
      socket.off('me');
      socket.off('online-users');
      socket.off('callToUser');
      socket.off('callRejected');
      socket.off('callEnded');
      socket.off('userUnavailable');
      socket.off('userBusy');
      socket.off('disconnect');
      hasJoined.current = false;
    };
  }, [currentUser, socket]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/user');
        if (res.data.users) setUsers(res.data.users);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Unable to load users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const isOnline = id => onlineUsers.some(u => u.userId === id);

  const startCall = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setStream(currentStream);
      if (myVideo.current) myVideo.current.srcObject = currentStream;
      myVideo.current.muted = true;
      setCallerWaiting(true);
      setShowUserDetailModal(false);

      const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });
      peer.on('signal', sig => {
        socket.emit('callToUser', {
          callToUserId: modalUser._id,
          signal: sig,
          from: me,
          name: currentUser.username,
          email: currentUser.email,
          profilepic: currentUser.profilepic,
        });
      });
      peer.on('stream', remoteStream => {
        if (receiverVideo.current) receiverVideo.current.srcObject = remoteStream;
      });
      socket.once('callAccepted', data => {
        setCallAccepted(true);
        setCallerWaiting(false);
        peer.signal(data.signal);
      });
      connectionRef.current = peer;
    } catch (err) {
      console.error('Media error:', err);
      alert('Please allow camera and microphone access to proceed.');
      endCallCleanup();
    }
  };

  const handleAcceptCall = async () => {
    ringtone.stop();
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setStream(currentStream);
      if (myVideo.current) myVideo.current.srcObject = currentStream;
      setCallAccepted(true);
      setCallerWaiting(false);
      setShowUserDetailModal(false);

      const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });
      peer.on('signal', sig => {
        socket.emit('answeredCall', { signal: sig, from: me, to: caller.from });
      });
      peer.on('stream', remoteStream => {
        if (receiverVideo.current) receiverVideo.current.srcObject = remoteStream;
      });
      peer.signal(callerSignal);
      connectionRef.current = peer;
    } catch (err) {
      console.error('Media error:', err);
      alert('Please allow camera and microphone access to proceed.');
      endCallCleanup();
    }
  };

  const handleRejectCall = () => {
    ringtone.stop();
    setReceiveCall(false);
    setCallAccepted(false);
    socket.emit('reject-call', {
      to: caller.from,
      name: currentUser.username,
      profilepic: currentUser.profilepic
    });
  };

  const handleEndCall = () => {
    ringtone.stop();
    socket.emit('call-ended', { to: caller?.from || selectedUser, name: currentUser.username });
    endCallCleanup();
  };

  const endCallCleanup = () => {
    stream?.getTracks().forEach(t => t.stop());
    if (receiverVideo.current) receiverVideo.current.srcObject = null;
    if (myVideo.current) myVideo.current.srcObject = null;
    connectionRef.current?.destroy();
    setCallerWaiting(false);
    setStream(null);
    setReceiveCall(false);
    setCallAccepted(false);
    setSelectedUser(null);
  };

  const toggleMic = () => {
    const track = stream?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMicOn(track.enabled); }
  };

  const toggleCam = () => {
    const track = stream?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCamOn(track.enabled); }
  };

  const handleLogout = async () => {
    if (callAccepted || receiveCall) return alert('End call before logout');
    try {
      await apiClient.post('/auth/logout');
      socket.disconnect();
      updateUser(null);
      localStorage.removeItem('userData');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      alert('Failed to logout. Please try again.');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {isSidebarOpen && <div className="fixed inset-0 z-10 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`bg-gray-800 text-white w-64 p-4 fixed z-20 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Users</h1>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}><FaTimes size={20} /></button>
        </div>
        <input
          type="text"
          placeholder="Search user..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-white text-gray-900 border border-gray-300 mb-4"
        />
        <ul className="space-y-3 overflow-y-auto h-[70vh]">
          {loading ? (
            <div className="text-center text-gray-500">Loading users...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            filteredUsers.map(u => (
              <li
                key={u._id}
                onClick={() => { setModalUser(u); setShowUserDetailModal(true); }}
                className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="relative">
                  <img src={u.profilepic || '/default-avatar.png'} alt={u.username} className="w-10 h-10 rounded-full border border-gray-300" />
                  {isOnline(u._id) && <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{u.username}</span>
                  <span className="text-xs text-gray-300 truncate w-32">{u.email}</span>
                </div>
              </li>
            ))
          )}
        </ul>
        <div className="mt-6">
          <button onClick={handleLogout} className="flex items-center gap-2 bg-gray-600 px-4 py-2 rounded-md w-full hover:bg-red-500 transition-colors">
            <RiLogoutBoxLine size={20} /> Logout
          </button>
        </div>
      </aside>

      {(selectedUser || receiveCall || callAccepted) ? (
        <div className="relative w-full h-screen bg-gray-900 flex items-center justify-center">
          {callerWaiting ? (
            <div className="flex flex-col items-center text-white">
              <p className="font-black text-xl mb-2">Calling...</p>
              <img src={modalUser.profilepic || '/default-avatar.png'} alt="User" className="w-20 h-20 rounded-full border-4 border-gray-300" />
              <h3 className="text-lg font-bold mt-3">{modalUser.username}</h3>
              <p className="text-sm text-gray-400">Waiting for response...</p>
            </div>
          ) : (
            <video ref={receiverVideo} autoPlay playsInline className="absolute inset-0 w-full h-full object-contain" />
          )}
          <div className="absolute bottom-20 right-4 bg-gray-800 rounded-lg p-1 shadow-lg">
            <video ref={myVideo} autoPlay playsInline muted className="w-32 h-48 rounded-lg object-cover" />
          </div>
          <div className="absolute top-4 left-4 flex items-center gap-2 text-white text-lg">
            <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}><FaBars size={20} /></button>
            {callerName || displayName}
          </div>
          <div className="absolute bottom-4 w-full flex justify-center gap-6">
            <button className="bg-red-500 p-4 rounded-full text-white hover:bg-red-600" onClick={handleEndCall}><FaPhoneSlash size={20} /></button>
            <button className={`p-4 rounded-full text-white ${isMicOn ? 'bg-green-500' : 'bg-gray-600'} hover:bg-gray-700`} onClick={toggleMic}>
              {isMicOn ? <FaMicrophone size={20}/> : <FaMicrophoneSlash size={20}/>}
            </button>
            <button className={`p-4 rounded-full text-white ${isCamOn ? 'bg-green-500' : 'bg-gray-600'} hover:bg-gray-700`} onClick={toggleCam}>
              {isCamOn ? <FaVideo size={20}/> : <FaVideoSlash size={20}/>}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 md:ml-64 text-gray-900">
          <button className="md:hidden mb-4 text-2xl" onClick={() => setIsSidebarOpen(true)}><FaBars /></button>
          <div className="bg-white p-5 rounded-lg shadow-md">
            <div className="flex items-center gap-5 mb-6">
              <FaHandPaper size={80} className="text-gray-500" />
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900">{greetingText}</h1>
                <p className="text-lg text-gray-700 mt-2">
                  Ready to <strong>connect with friends instantly?</strong> Just <strong>select a user</strong> to start your video call! 🎥✨
                </p>
              </div>
            </div>
            <div className="text-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">💡 How to Start a Video Call?</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>📌 Open the sidebar to see online users.</li>
                <li>🔍 Use the search bar to find someone.</li>
                <li>🎥 Click on a user to start a video call.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {showUserDetailModal && modalUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full">
            <div className="flex flex-col items-center">
              <p className="font-black text-xl text-gray-900 mb-2">User Details</p>
              <img src={modalUser.profilepic || '/default-avatar.png'} alt="User" className="w-20 h-20 rounded-full border-4 border-gray-300" />
              <h3 className="text-lg font-bold text-gray-900 mt-3">{modalUser.username}</h3>
              <p className="text-sm text-gray-500">{modalUser.email}</p>
              <div className="flex gap-4 mt-5">
                <button onClick={() => { setSelectedUser(modalUser._id); startCall(); setShowUserDetailModal(false); }} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center gap-2">
                  Call <FaPhoneAlt size={20} />
                </button>
                <button onClick={() => setShowUserDetailModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {callRejectedPopUp && rejectorData && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full">
            <div className="flex flex-col items-center">
              <p className="font-black text-xl text-gray-900 mb-2">Call Rejected By</p>
              <img src={rejectorData.profilepic || '/default-avatar.png'} alt="Caller" className="w-20 h-20 rounded-full border-4 border-red-500" />
              <h3 className="text-lg font-bold text-gray-900 mt-3">{rejectorData.name}</h3>
              <div className="flex gap-4 mt-5">
                <button onClick={startCall} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center gap-2">
                  Call Again <FaPhoneAlt size={20} />
                </button>
                <button onClick={() => { endCallCleanup(); setCallRejectedPopUp(false); }} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
                  Back <FaPhoneSlash size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {receiveCall && !callAccepted && caller && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full">
            <div className="flex flex-col items-center">
              <p className="font-black text-xl text-gray-900 mb-2">Call From</p>
              <img src={caller.profilepic || '/default-avatar.png'} alt="Caller" className="w-20 h-20 rounded-full border-4 border-gray-300" />
              <h3 className="text-lg font-bold text-gray-900 mt-3">{callerName}</h3>
              <p className="text-sm text-gray-500">{caller.email}</p>
              <div className="flex gap-4 mt-5">
                <button onClick={handleAcceptCall} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center gap-2">
                  Accept <FaPhoneAlt size={20} />
                </button>
                <button onClick={handleRejectCall} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center gap-2">
                  Reject <FaPhoneSlash size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

