# Fix Duplicate Messages in Real-Time Chat

## 🔴 The Problem

When you send a message:
1. **Optimistic update** → Message added to UI immediately
2. **API response** → Message confirmed, might be added again
3. **WebSocket event** → Backend broadcasts, frontend receives and adds AGAIN
4. **Result:** Same message appears 2-3 times! ❌

## ✅ The Solution: Deduplicate by ID

### **Pattern 1: Simple Deduplication (Recommended)**

```javascript
// In your RoomChat or wherever you handle messages
const handleNewMessage = (newMessage) => {
  setMessages(prev => {
    // Check if message already exists
    const exists = prev.some(m => m.id === newMessage.id);
    if (exists) {
      console.log('⚠️  Message already exists, skipping duplicate');
      return prev;
    }
    
    // Add new message
    return [...prev, newMessage];
  });
};

// Use in WebSocket listener
websocketService.joinRoom(roomId, {
  onMessage: (event) => {
    console.log('🔥 MESSAGE EVENT RECEIVED:', event);
    handleNewMessage(event.message);  // ✅ Deduplicates automatically
  }
});
```

### **Pattern 2: Advanced (With Optimistic Updates)**

```javascript
// When sending a message
const sendMessage = async (messageText) => {
  // 1. Create temporary message for optimistic UI
  const tempMessage = {
    id: `temp-${Date.now()}`,
    message: messageText,
    user_id: currentUser.id,
    user: currentUser,
    created_at: new Date().toISOString(),
    status: 'sending',
    temp: true,  // Mark as temporary
  };
  
  // 2. Add to UI immediately (optimistic)
  setMessages(prev => [...prev, tempMessage]);
  
  try {
    // 3. Send to backend
    const response = await api.post(`/rooms/${roomId}/messages`, { message: messageText });
    
    // 4. Replace temp message with real one
    setMessages(prev => prev.map(m => 
      m.id === tempMessage.id ? { ...response.data.message, status: 'sent' } : m
    ));
  } catch (error) {
    // 5. Mark as failed
    setMessages(prev => prev.map(m => 
      m.id === tempMessage.id ? { ...m, status: 'failed' } : m
    ));
  }
};

// When receiving via WebSocket
const handleNewMessage = (newMessage) => {
  setMessages(prev => {
    // Skip if already exists (by real ID)
    const exists = prev.some(m => m.id === newMessage.id && !m.temp);
    if (exists) return prev;
    
    // Replace temp message if it's from current user
    const tempIndex = prev.findIndex(m => 
      m.temp && 
      m.user_id === currentUser.id && 
      Math.abs(new Date(m.created_at) - new Date(newMessage.created_at)) < 5000
    );
    
    if (tempIndex >= 0) {
      // Replace temp with real
      return prev.map((m, idx) => idx === tempIndex ? newMessage : m);
    }
    
    // Add new message
    return [...prev, newMessage];
  });
};
```

## ✅ Fix React Key Warning

### **Correct Usage:**
```javascript
{messages.map(message => (
  <div key={message.id}>  {/* ✅ Use database ID */}
    <MessageBubble message={message} />
  </div>
))}
```

### **Common Mistakes:**
```javascript
key={index}                    // ❌ WRONG - Changes on reorder
key={message.tempId}           // ❌ WRONG - Undefined for real messages
key={`${message.id}`}          // ❌ WRONG - String conversion unnecessary
key={message.id || index}      // ❌ WRONG - Mixed types
```

## 🎯 Where to Make Changes

### **File: `src/components/rooms/tabs/RoomChat.js`** (or similar)

Look for:

1. **Where messages are received from WebSocket:**
```javascript
// Find this pattern:
websocketService.joinRoom(roomId, {
  onMessage: (event) => {
    setMessages(prev => [...prev, event.message]);  // ❌ Add deduplication here
  }
});
```

2. **Where messages are rendered:**
```javascript
// Find this pattern:
messages.map((message, index) => (
  <div key={index}>  // ❌ Change to key={message.id}
```

## 📝 Complete Example

```javascript
// In RoomChat.js or similar

useEffect(() => {
  // ... initialization code ...
  
  websocketService.joinRoom(roomId, {
    onMessage: (event) => {
      console.log('🔥 MESSAGE EVENT RECEIVED:', event);
      
      // ✅ Deduplicate before adding
      setMessages(prev => {
        const exists = prev.some(m => m.id === event.message.id);
        if (exists) {
          console.log('⚠️  Message already exists, skipping');
          return prev;
        }
        return [...prev, event.message];
      });
    },
    
    onMessageEdited: (event) => {
      // Update existing message
      setMessages(prev => prev.map(m => 
        m.id === event.message.id ? event.message : m
      ));
    },
    
    onMessageDeleted: (event) => {
      // Remove message
      setMessages(prev => prev.filter(m => m.id !== event.messageId));
    },
  });
  
  return () => {
    websocketService.leaveRoom(roomId);
  };
}, [roomId]);

// Render messages with correct key
return (
  <div className="messages">
    {messages.map(message => (
      <MessageBubble 
        key={message.id}  {/* ✅ Correct key */}
        message={message}
      />
    ))}
  </div>
);
```

## ✅ Benefits After Fix

- ✅ No duplicate messages
- ✅ No React key warnings
- ✅ Stable UI (no flickering)
- ✅ Better performance
- ✅ Handles optimistic updates correctly

## 🧪 How to Test

1. Send a message
2. Check console - should see `🔥 MESSAGE EVENT RECEIVED`
3. Check UI - message appears ONCE
4. Check console - NO warnings about keys
5. Send multiple messages quickly - all appear correctly
6. Refresh page - messages stay stable

## 🎯 Checklist

- [ ] Added deduplication logic in `onMessage` handler
- [ ] Changed React keys from `index` to `message.id`
- [ ] Tested sending messages - no duplicates
- [ ] No console warnings
- [ ] Optimistic updates work (if implemented)
- [ ] Message editing updates correctly
- [ ] Message deletion removes correctly

