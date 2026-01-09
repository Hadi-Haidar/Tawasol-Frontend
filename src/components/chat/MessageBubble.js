/* eslint-disable react/prop-types */
import React, { useState, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
    XMarkIcon,
    PencilIcon,
    TrashIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';

// WhatsApp-style check mark components
const SingleCheck = ({ className = "w-4 h-4 text-gray-400" }) => (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
    </svg>
);

const DoubleCheck = ({ isRead = false, className = "w-4 h-4" }) => (
    <div className="flex items-center">
        <svg className={`w-3 h-3 ${isRead ? 'text-blue-500' : 'text-gray-400'}`} viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
        </svg>
        <div className="w-px"></div>
        <svg className={`w-3 h-3 ${isRead ? 'text-blue-500' : 'text-gray-400'}`} viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
        </svg>
    </div>
);

const MessageBubble = ({
    message,
    currentUser,
    targetUser,
    isOwn,
    isEditing,
    isDeleting,
    editingText,
    setEditingText,
    onSaveEdit,
    onCancelEdit,
    onStartEdit,
    onDelete,
    onImageClick
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`mb-4 group ${isDeleting ? 'opacity-50' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isOwn ? (
                // Sent Messages (Right Side)
                <div className="flex justify-end">
                    <div className="flex items-end space-x-2 max-w-xs lg:max-w-md relative">
                        {/* Edit/Delete Actions */}
                        {isOwn && isHovered && !isEditing && !isDeleting && (
                            <div className="absolute -left-8 top-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {/* Edit Button - Only for text messages, not images */}
                                {message.type !== 'image' && (
                                    <button
                                        onClick={() => onStartEdit(message)}
                                        className="w-6 h-6 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-all duration-200"
                                        title="Edit message"
                                    >
                                        <PencilIcon className="w-3 h-3" />
                                    </button>
                                )}
                                <button
                                    onClick={() => onDelete(message.id)}
                                    className="w-6 h-6 bg-red-500 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full flex items-center justify-center transition-all duration-200"
                                    title="Delete message"
                                >
                                    <TrashIcon className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="text-right flex-1">
                            {/* Message Bubble */}
                            {isEditing ? (
                                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-2xl rounded-br-md shadow-sm border-2 border-blue-500">
                                    <div className="flex items-center space-x-2">
                                        <textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white resize-none focus:outline-none"
                                            rows={Math.min(editingText.split('\n').length, 4)}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    onSaveEdit();
                                                } else if (e.key === 'Escape') {
                                                    onCancelEdit();
                                                }
                                            }}
                                        />
                                        <div className="flex flex-col space-y-1">
                                            <button
                                                onClick={onSaveEdit}
                                                className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
                                                title="Save changes"
                                            >
                                                <CheckIcon className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={onCancelEdit}
                                                className="w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors"
                                                title="Cancel"
                                            >
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-br-md shadow-sm">
                                    {message.type === 'image' && message.file_url ? (
                                        <div>
                                            <img
                                                src={message.file_url}
                                                alt="Image message"
                                                className="w-full max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => onImageClick(message.file_url, "Image message")}
                                                title="Click to view full size"
                                            />
                                            {message.message && (
                                                <p className="text-sm mt-2 whitespace-pre-wrap break-words">
                                                    {message.message}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {message.message}
                                        </p>
                                    )}
                                    {message.is_edited && (
                                        <p className="text-xs text-blue-200 mt-1 italic">edited</p>
                                    )}
                                </div>
                            )}
                            {/* Timestamp with Read Receipts */}
                            <div className="flex items-center justify-end space-x-1 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {message.created_at ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : 'Unknown time'}
                                </span>
                                {/* Read Receipt Check Marks */}
                                <div className="flex-shrink-0">
                                    {message.is_read ? (
                                        <DoubleCheck isRead={true} className="w-3 h-3" />
                                    ) : (
                                        <SingleCheck className="w-3 h-3 text-gray-400" />
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Your Avatar */}
                        <div className="flex-shrink-0 mb-1">
                            <Avatar
                                user={currentUser}
                                size="sm"
                                showBorder={true}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                // Received Messages (Left Side)
                <div className="flex justify-start">
                    <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                        {/* Their Avatar */}
                        <div className="flex-shrink-0 mb-1">
                            <Avatar
                                user={targetUser}
                                size="sm"
                                showBorder={true}
                            />
                        </div>
                        <div>
                            {/* Sender Name & Timestamp */}
                            <div className="flex items-baseline space-x-2 mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {targetUser?.name || 'Unknown User'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {message.created_at ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true }) : 'Unknown time'}
                                </span>
                            </div>
                            {/* Message Bubble */}
                            <div className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-600">
                                {message.type === 'image' && message.file_url ? (
                                    <div>
                                        <img
                                            src={message.file_url}
                                            alt="Image message"
                                            className="w-full max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => onImageClick(message.file_url, "Image message")}
                                            title="Click to view full size"
                                        />
                                        {message.message && (
                                            <p className="text-sm mt-2 whitespace-pre-wrap break-words">
                                                {message.message}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.message}
                                    </p>
                                )}
                                {message.is_edited && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">edited</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(MessageBubble);
