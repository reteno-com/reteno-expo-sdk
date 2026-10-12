package expo.modules.retenosdk;

import android.util.Log;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.List;

/**
 * Singleton event queue for Reteno SDK.
 * Queues events until JavaScript starts listening and a sink is attached.
 */
public class RetenoEventQueue {
    private static final String TAG = "RetenoEventQueue";
    private static final int MAX_QUEUE_SIZE = 100;

    private static RetenoEventQueue instance;

    private final List<QueuedEvent> eventQueue = new ArrayList<>();
    @Nullable private EventSink sink;
    private final Object lock = new Object();

    /**
     * Delivers an event to JavaScript, e.g. through the Expo module's sendEvent.
     */
    public interface EventSink {
        void emit(String eventName, WritableMap eventData);
    }

    private static class QueuedEvent {
        final String eventName;
        final WritableMap eventData;

        QueuedEvent(String eventName, WritableMap eventData) {
            this.eventName = eventName;
            this.eventData = eventData;
        }
    }

    private RetenoEventQueue() {}

    public static synchronized RetenoEventQueue getInstance() {
        if (instance == null) {
            instance = new RetenoEventQueue();
        }
        return instance;
    }

    /**
     * Dispatch an event. If no sink is attached, queue it. Otherwise send immediately.
     */
    public void dispatch(String eventName, WritableMap eventData) {
        synchronized (lock) {
            if (sink != null) {
                sendEvent(sink, eventName, eventData);
            } else {
                queueEvent(eventName, eventData);
            }
        }
    }

    private void queueEvent(String eventName, WritableMap eventData) {
        if (eventQueue.size() >= MAX_QUEUE_SIZE) {
            Log.w(TAG, "Event queue full, dropping oldest event");
            eventQueue.remove(0);
        }
        eventQueue.add(new QueuedEvent(eventName, eventData));
        Log.d(TAG, "Queued event: " + eventName + ", queue size: " + eventQueue.size());
    }

    private void sendEvent(EventSink sink, String eventName, WritableMap eventData) {
        try {
            sink.emit(eventName, eventData);
        } catch (Exception e) {
            Log.e(TAG, "Failed to send event: " + eventName, e);
        }
    }

    /**
     * Called when JavaScript starts listening. Attaches the sink and flushes queued events.
     */
    public void setSink(EventSink sink) {
        synchronized (lock) {
            this.sink = sink;
            Log.d(TAG, "Sink attached, flushing " + eventQueue.size() + " queued events");

            for (QueuedEvent event : eventQueue) {
                sendEvent(sink, event.eventName, event.eventData);
            }
            eventQueue.clear();
        }
    }

    /**
     * Detaches the sink so new events are queued until JavaScript listens again.
     */
    public void clearSink(EventSink sink) {
        synchronized (lock) {
            if (this.sink == sink) {
                this.sink = null;
            }
        }
    }

    /**
     * Check if a sink is attached (for debugging/testing)
     */
    public boolean isInitialized() {
        synchronized (lock) {
            return sink != null;
        }
    }

    /**
     * Get pending event count (for debugging/testing)
     */
    public int getPendingEventCount() {
        synchronized (lock) {
            return eventQueue.size();
        }
    }
}
