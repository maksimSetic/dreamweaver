import React from "react";
import { useSocket } from "../contexts/SocketContext";

const ChatRequestAcceptedModal = () => {
  const {
    showChatAcceptedModal,
    chatAcceptedData,
    closeChatAcceptedModal,
    startChatFromModal,
  } = useSocket();

  if (!showChatAcceptedModal || !chatAcceptedData) return null;

  const handleStartChat = () => {
    startChatFromModal(chatAcceptedData.chatId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Chat Request Accepted! 🎉
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            <span className="font-medium text-purple-600">
              {chatAcceptedData.acceptedBy}
            </span>{" "}
            has accepted your chat request. You can now start chatting!
          </p>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={closeChatAcceptedModal}
              className="flex-1 px-4 py-2 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleStartChat}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Start Chatting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRequestAcceptedModal;
