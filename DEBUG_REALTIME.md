# Debug Real-Time Issues

## Step 1: Check WebSocket Connection

Open browser console and run:

```javascript
// Check if Echo exists
window.Echo

// Check connection state
window.Echo?.connector?.pusher?.connection?.state
// Should be: "connected"

// List active channels
window.Echo?.connector?.pusher?.channels?.all()
```

## Step 2: Check Backend Logs

In terminal where Reverb is running, you should see:
- Connection established
- Channel subscriptions
- Event broadcasts

If you don't see any logs, Reverb might not be running.

## Step 3: Test Event Broadcasting

### From Laravel Tinker:
```bash
php artisan tinker
```

Then broadcast a test event:
```php
use App\Events\MessageSent;
use App\Models\User;
use App\Models\ChatRoom;

$user = User::first();
$room = ChatRoom::first();

// Trigger a test event
broadcast(new MessageSent([
    'id' => 999,
    'message' => 'Test message',
    'user_id' => $user->id,
    'room_id' => $room->id,
    'created_at' => now(),
]));
```

Check if this appears in your browser console.

## Common Issues:

### Issue 1: Reverb Not Running
**Solution:** Start Reverb in a separate terminal
```bash
cd C:\Users\User\Desktop\Tawasol
php artisan reverb:start
```

### Issue 2: Event Not Being Broadcast
**Check:** Look at your backend code where messages are created
- Is `broadcast()` being called?
- Is the event class correct?

### Issue 3: Wrong Channel Name
**Frontend channel:** `private-chat.room.{id}`
**Backend channel:** Should match exactly

### Issue 4: Authentication Failed
Check browser Network tab for:
- `/broadcasting/auth` requests
- Should return 200, not 401/403

## Quick Test:

1. Open browser console
2. Type: `window.Echo.connector.pusher.connection.state`
3. If it's NOT "connected", there's a connection issue
4. If it IS "connected" but no events, there's an event/channel issue

