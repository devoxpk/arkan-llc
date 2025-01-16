// components/ChatComponent.js
import { useState, useEffect, useRef } from 'react';

export default function ChatComponent() {
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState([
        { text: 'Devox here, how may I assist?', type: 'incoming' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(true); // Manage visibility of the chat
    const chatRef = useRef(null); // Ref for the chat component

    // {{ Add state variables for edit and train modes }}
    const [isEditMode, setIsEditMode] = useState(false);
    const [isTrainMode, setIsTrainMode] = useState(false);
    const [trainingStep, setTrainingStep] = useState(null); // 'question' or 'answer' or 'delete'
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [history, setHistory] = useState([]);

    // {{ Initialize edit mode based on localStorage and environment variables }}
    useEffect(() => {
        const editKeyFromLocalStorage = typeof window !== "undefined" ? localStorage.getItem(process.env.NEXT_PUBLIC_EDIT_KEY) : null;
        const editKeyFromEnv = process.env.NEXT_PUBLIC_EDIT_VALUE;

        if (editKeyFromLocalStorage === editKeyFromEnv) {
            setIsEditMode(true);
        }

        // Scroll to bottom on initial load
        const chatBody = document.getElementById('chatBody');
        if (chatBody) {
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }, []);

    const sendMessage = async () => {
        const trimmedInput = userInput.trim();

        if (!trimmedInput) {
            alert('Please enter a message');
            return;
        }

        // {{ Handle training commands }}
        if (trimmedInput.startsWith('!')) {
            handleCommand(trimmedInput);
            setUserInput('');
            return;
        }

        // {{ Handle deletion input }}
        if (isTrainMode && trainingStep === 'delete') {
            const index = parseInt(trimmedInput, 10) - 1;
            if (isNaN(index)) {
                setMessages((prev) => [
                    ...prev,
                    { text: 'Please enter a valid number.', type: 'incoming' }
                ]);
                setUserInput('');
                return;
            }
            try {
                const response = await fetch('/api/chatbot', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ index })
                });
                const data = await response.json();
                if (data.success) {
                    setMessages((prev) => [
                        ...prev,
                        { text: 'Entry deleted successfully.', type: 'incoming' }
                    ]);
                } else {
                    setMessages((prev) => [
                        ...prev,
                        { text: 'Failed to delete entry.', type: 'incoming' }
                    ]);
                }
            } catch (error) {
                console.error("Error deleting entry:", error);
                setMessages((prev) => [
                    ...prev,
                    { text: 'Error deleting entry.', type: 'incoming' }
                ]);
            }
            setTrainingStep(null);
            setIsTrainMode(true); // Remain in train mode
            setUserInput('');
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

        // Scroll to the bottom
        const chatBody = document.getElementById('chatBody');
        chatBody.scrollTop = chatBody.scrollHeight;

        setIsLoading(true);

        try {
            let responseData;
            if (isTrainMode) {
                // Pass training history to the response
                responseData = await fetchTrainingResponse(trimmedInput);
            } else {
                const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_API}/get-response?msg=${encodeURIComponent(trimmedInput)}&auth=devox`);
                if (!response.ok) {
                    throw new Error("Failed to fetch response from server");
                }
                responseData = await response.text();
            }

            // Update state after getting response
            setMessages((prevMessages) => [
                ...prevMessages.filter((message) => message.type !== 'typing'),
                { text: responseData, type: 'incoming' }
            ]);

            // Scroll to the bottom
            chatBody.scrollTop = chatBody.scrollHeight;
        } catch (error) {
            console.error("Error fetching response:", error);
            setMessages((prevMessages) => [
                ...prevMessages.filter((message) => message.type !== 'typing'),
                { text: 'An error occurred. Please try again later.', type: 'incoming' }
            ]);
            const chatBody = document.getElementById('chatBody');
            chatBody.scrollTop = chatBody.scrollHeight;
        } finally {
            setIsLoading(false);
        }
    };

    // {{ New function to handle training responses }}
    const fetchTrainingResponse = async (input) => {
        if (trainingStep === 'question') {
            setCurrentQuestion(input);
            setTrainingStep('answer');
            setMessages((prev) => [
                ...prev,
                { text: 'Give the suitable answer to it', type: 'incoming' }
            ]);
            return '';
        } else if (trainingStep === 'answer') {
            const newEntry = { role: 'user', model: 'assistant', question: currentQuestion, answer: input };
            try {
                const response = await fetch('/api/chatbot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entry: newEntry })
                });
                const data = await response.json();
                if (data.success) {
                    setHistory((prev) => [...prev, newEntry]);
                    setMessages((prev) => [
                        ...prev,
                        { text: 'Training entry saved.', type: 'incoming' }
                    ]);
                } else {
                    setMessages((prev) => [
                        ...prev,
                        { text: 'Failed to save training entry.', type: 'incoming' }
                    ]);
                }
            } catch (error) {
                console.error("Error saving training entry:", error);
                setMessages((prev) => [
                    ...prev,
                    { text: 'Error saving training entry.', type: 'incoming' }
                ]);
            }
            return '';
        }
    };

    const handleCommand = (command) => {
        if (command === '!train') {
            if (isEditMode) {
                setIsTrainMode(true);
                setTrainingStep('question');
                setMessages((prev) => [
                    ...prev,
                    { text: 'Give Question that user can ask', type: 'incoming' },
                    { text: '!quit, !delete', type: 'incoming' }
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { text: 'You are not authorized to train.', type: 'incoming' }
                ]);
            }
        } else if (command === '!quit') {
            setIsTrainMode(false);
            setTrainingStep(null);
            setMessages((prev) => [
                ...prev,
                { text: 'Exited training mode.', type: 'incoming' }
            ]);
        } else if (command === '!delete') {
            if (isEditMode) {
                setTrainingStep('delete');
                setMessages((prev) => [
                    ...prev,
                    { text: 'Enter the number of the entry you wish to delete:', type: 'incoming' }
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { text: 'You are not authorized to delete entries.', type: 'incoming' }
                ]);
            }
        }
    };

    const deleteHistory = async () => {
        try {
            const response = await fetch('/api/chatbot', {
                method: 'GET',
            });
            const data = await response.json();
            if (data.success) {
                let message = 'Select a number to delete a role:\n';
                data.histories.forEach((item, index) => {
                    message += `${index + 1}. ${item.role} - ${item.model}\n`;
                });
                setMessages((prev) => [
                    ...prev,
                    { text: message, type: 'incoming' }
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { text: 'Error accessing training data.', type: 'incoming' }
                ]);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            setMessages((prev) => [
                ...prev,
                { text: 'Error accessing training data.', type: 'incoming' }
            ]);
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
            <style jsx>{`
                .chat-card {
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
