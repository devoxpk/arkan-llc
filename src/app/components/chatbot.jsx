// components/ChatComponent.js
import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs,getDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export default function ChatComponent() {
    // Initialize state with messages from sessionStorage if available
    const [messages, setMessages] = useState(() => {
        if (typeof window !== "undefined") {
            const savedMessages = sessionStorage.getItem('chatMessages');
            return savedMessages ? JSON.parse(savedMessages) : [
                { text: 'Devox here, how may I assist?', type: 'incoming' }
            ];
        }
        return [
            { text: 'Devox here, how may I assist?', type: 'incoming' }
        ];
    });

    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(true); // Manage visibility of the chat
    const chatRef = useRef(null); // Ref for the chat component
    const [isTraining, setIsTraining] = useState(false);
    const [trainingStep, setTrainingStep] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [rolesToDelete, setRolesToDelete] = useState([]);
    const [deleteStep, setDeleteStep] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Check if the `localStorage` key matches the environment variable value
    useEffect(() => {
        let editKeyFromLocalStorage;
        if (typeof window !== "undefined" && typeof URLSearchParams !== "undefined") {
            editKeyFromLocalStorage = localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY);
        }
        const editKeyFromEnv = process.env.NEXT_PUBLIC_EDIT_VALUE;

        if (editKeyFromLocalStorage === editKeyFromEnv) {
            setIsEditMode(true);
        }

        // Initialize `isEditMode` based on the presence of the `edit` query parameter
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has("edit")) {
                setIsEditMode(true);
            }
        }

        // Load messages from sessionStorage
        if (typeof window !== "undefined") {
            const savedMessages = sessionStorage.getItem('chatMessages');
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
            }
        }
    }, []);

    // Save messages to sessionStorage whenever they change
    useEffect(() => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem('chatMessages', JSON.stringify(messages));
        }
    }, [messages]);

    // Scroll to the latest message whenever messages update
    useEffect(() => {
        if (chatRef.current) {
            const chatBody = document.getElementById('chatBody');
            if (chatBody) {
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        }
    }, [messages]);

    const sendMessage = async () => {
        const trimmedInput = userInput.trim();

        if (!trimmedInput) {
            alert('Please enter a message');
            return;
        }

        // Append user message
        setMessages((prevMessages) => [
            ...prevMessages,
            { text: trimmedInput, type: 'outgoing' },
            { text: 'Typing...', type: 'typing' }
        ]);

        // Clear input
        setUserInput('');

        setIsLoading(true);

        // Handle special commands
        if (trimmedInput.startsWith('!train') || trimmedInput.startsWith('!delete')) {
            // Ensure user is in edit mode
            if (!isEditMode) {
                setMessages((prevMessages) => [
                    ...prevMessages.filter((message) => message.type !== 'typing'),
                    { text: 'You do not have permission to perform this action.', type: 'incoming' }
                ]);
                setIsLoading(false);
                return;
            }
        }

        if (trimmedInput.startsWith('!train')) {
            setIsTraining(true);
            setMessages((prevMessages) => [
                ...prevMessages.filter((message) => message.type !== 'typing'),
                { text: 'Training mode activated. Add a question:', type: 'incoming' }
            ]);
            setTrainingStep('addQuestion');
            setIsLoading(false);
            return;
        }

        if (trimmedInput.startsWith('!delete')) {
            setIsDeleting(true);
            setDeleteStep('listRoles');
            // Fetch roles from Firestore
            try {
                const docRef = doc(db, 'chatbot', 'roles');
                const docSnap = await getDoc(docRef);
                const roles = docSnap.exists() ? docSnap.data().roles : [];
                setRolesToDelete(roles);
                if (roles.length === 0) {
                    setMessages((prevMessages) => [
                        ...prevMessages.filter((message) => message.type !== 'typing'),
                        { text: 'No roles available to delete.', type: 'incoming' }
                    ]);
                    setIsDeleting(false);
                    setDeleteStep(null);
                } else {
                    // Create a numbered list of roles
                    const roleList = roles.map((role, index) => `${index + 1}. [${role.role}] ${role.text}`).join('\n');
                    setMessages((prevMessages) => [
                        ...prevMessages.filter((message) => message.type !== 'typing'),
                        { text: `Select a role to delete by its number:\n${roleList}`, type: 'incoming' }
                    ]);
                    setDeleteStep('selectRole');
                }
            } catch (error) {
                console.error("Error fetching roles:", error);
                setMessages((prevMessages) => [
                    ...prevMessages.filter((message) => message.type !== 'typing'),
                    { text: 'An error occurred while fetching roles. Please try again later.', type: 'incoming' }
                ]);
                setIsDeleting(false);
                setDeleteStep(null);
            }
            setIsLoading(false);
            return;
        }

        if (isTraining) {
            if (trimmedInput === '!exit') {
                setIsTraining(false);
                setMessages((prevMessages) => [
                    ...prevMessages.filter((message) => message.type !== 'typing'),
                    { text: 'Exited training mode.', type: 'incoming' }
                ]);
                setIsLoading(false);
                return;
            }

            if (trainingStep === 'addQuestion') {
                // Store the question
                try {
                    const docRef = doc(db, 'chatbot', 'roles');
                    const docSnap = await getDoc(docRef);
                    const roles = docSnap.exists() ? docSnap.data().roles : [];
                    roles.push({ role: 'user', text: trimmedInput });
                    await updateDoc(docRef, { roles });
                    setMessages((prevMessages) => [
                        ...prevMessages.filter((message) => message.type !== 'typing'),
                        { text: 'Add an answer for the previous question:', type: 'incoming' }
                    ]);
                    setTrainingStep('addAnswer');
                } catch (error) {
                    console.error("Error adding question:", error);
                }
                setIsLoading(false);
                return;
            }

            if (trainingStep === 'addAnswer') {
                // Store the answer
                try {
                    const docRef = doc(db, 'chatbot', 'roles');
                    const docSnap = await getDoc(docRef);
                    const roles = docSnap.exists() ? docSnap.data().roles : [];
                    roles.push({ role: 'model', text: trimmedInput });
                    await updateDoc(docRef, { roles });
                    setMessages((prevMessages) => [
                        ...prevMessages.filter((message) => message.type !== 'typing'),
                        { text: 'Add another question or type !exit to finish training or !delete to delete any question you have added:', type: 'incoming' }
                    ]);
                    setTrainingStep('addQuestion');
                } catch (error) {
                    console.error("Error adding answer:", error);
                }
                setIsLoading(false);
                return;
            }
        }

        if (isDeleting) {
            if (deleteStep === 'selectRole') {
                const selectedNumber = parseInt(trimmedInput);
                if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > rolesToDelete.length) {
                    setMessages((prevMessages) => [
                        ...prevMessages.filter((message) => message.type !== 'typing'),
                        { text: 'Invalid selection. Please enter a valid number from the list.', type: 'incoming' }
                    ]);
                    setIsLoading(false);
                    return;
                }
                const roleToDelete = rolesToDelete[selectedNumber - 1];
                // Delete the selected role
                try {
                    const docRef = doc(db, 'chatbot', 'roles');
                    const docSnap = await getDoc(docRef);
                    const roles = docSnap.exists() ? docSnap.data().roles : [];
                    const updatedRoles = roles.filter((role, index) => index !== selectedNumber - 1);
                    await updateDoc(docRef, { roles: updatedRoles });
                    setMessages((prevMessages) => [
                        ...prevMessages.filter((message) => message.type !== 'typing'),
                        { text: `Role "${roleToDelete.text}" has been deleted.`, type: 'incoming' }
                    ]);
                    setIsDeleting(false);
                    setDeleteStep(null);
                    setRolesToDelete([]);
                } catch (error) {
                    console.error("Error deleting role:", error);
                    setMessages((prevMessages) => [
                        ...prevMessages.filter((message) => message.type !== 'typing'),
                        { text: 'Error deleting the selected role. Please try again.', type: 'incoming' }
                    ]);
                }
                setIsLoading(false);
                return;
            }
        }

        // Regular message handling with formatted data
        try {
            // Fetch all roles from Firestore
            const docRef = doc(db, 'chatbot', 'roles');
            const docSnap = await getDoc(docRef);
            const roles = docSnap.exists() ? docSnap.data().roles : [];

            const formattedData = JSON.stringify(roles.map(role => ({
                role: role.role,
                parts: [{ text: role.text }]
            })));

            const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_API}/get-response?msg=${encodeURIComponent(trimmedInput)}&data=${encodeURIComponent(formattedData)}`);
            if (!response.ok) {
                throw new Error("Failed to fetch response from server");
            }
            const data = await response.text();

            // Update state after getting response
            setMessages((prevMessages) => [
                ...prevMessages.filter((message) => message.type !== 'typing'),
                { text: data, type: 'incoming' }
            ]);

        } catch (error) {
            console.error("Error fetching response:", error);
            setMessages((prevMessages) => [
                ...prevMessages.filter((message) => message.type !== 'typing'),
                { text: 'An error occurred. Please try again later.', type: 'incoming' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteRole = async (id) => {
        try {
            const docRef = doc(db, 'chatbot', 'roles');
            const docSnap = await getDoc(docRef);
            const roles = docSnap.exists() ? docSnap.data().roles : [];
            const updatedRoles = roles.filter(role => role.id !== id);
            await updateDoc(docRef, { roles: updatedRoles });
            setMessages((prevMessages) => [
                ...prevMessages,
                { text: `Role with ID ${id} has been deleted.`, type: 'incoming' }
            ]);
        } catch (error) {
            console.error("Error deleting role:", error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) {
            sendMessage();
        }
    };

    // Hide chat when clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (chatRef.current && !chatRef.current.contains(event.target)) {
                setIsVisible(false); // Hide the chat if clicked outside
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
      <div
      style={{display: isVisible ? 'flex' : 'none'}}
      className="chat-card"
      ref={chatRef}
    >
            <div className="chat-header">
                <h2>Devox - Assistant</h2>
            </div>
            <div className="chat-body" id="chatBody">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.type}`}>
                        <p>{message.type === 'typing' ? 'Typing...' : message.text}</p>
                    </div>
                ))}
            </div>
            <div className="chat-footer">
                <input
                    type="text"
                    placeholder="Type your message"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}  // Detect Enter key press
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading}  // Disable button while loading
                >
                    Send
                </button>
            </div>
            <style jsx>{`                .chat-card {
                    width: 300px;
                    height: 312px;
                    max-height: 312px;
                    bottom: 0;
                    right: 0;
                    position: fixed;
                    background-color: #fff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transition: opacity 0.3s ease;
                }

                .chat-card.hidden {
                    opacity: 0;
                    pointer-events: none;
                }

                .chat-header {
                    padding: 10px;
                    background-color: #f2f2f2;
                    display: flex;
                    align-items: center;
                }

                .chat-header .h2 {
                    font-size: 16px;
                    color: #333;
                }

                .chat-body {
                    padding: 20px;
                    flex-grow: 1;
                    overflow-y: auto;
                }

                .message {
                    margin-bottom: 10px;
                    padding: 10px;
                    border-radius: 5px;
                }

                .incoming {
                    background-color: #e1e1e1;
                }

                .outgoing {
                    background-color: #f2f2f2;
                    text-align: right;
                }

                .message p {
                    font-size: 14px;
                    color: #333;
                    margin: 0;
                }

                .chat-footer {
                    padding: 10px;
                    background-color: #f2f2f2;
                    display: flex;
                }

                .chat-footer input[type="text"] {
                    flex-grow: 1;
                    padding: 5px;
                    border: none;
                    border-radius: 3px;
                }

                .chat-footer button {
                    padding: 5px 10px;
                    border: none;
                    background-color: #4285f4;
                    color: #fff;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .chat-footer button:hover {
                    background-color: #0f9d58;
                }

                /* Media query to hide scrollbar on mobile devices */
                @media (max-width: 767px) {
                    .chat-card {
                        overflow: hidden;
                    }
                }

                .typing {
                    font-size: 14px;
                    color: #999;
                    margin-top: 10px;
                }

                .chat-card .message {
                    animation: chatAnimation 0.3s ease-in-out;
                    animation-fill-mode: both;
                    animation-delay: 0.1s;
                }

                .chat-card .message:nth-child(even) {
                    animation-delay: 0.2s;
                }

                .chat-card .message:nth-child(odd) {
                    animation-delay: 0.3s;
                }

                @keyframes chatAnimation {
                    0% {
                        opacity: 0;
                        transform: translateY(10px);
                    }

                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
