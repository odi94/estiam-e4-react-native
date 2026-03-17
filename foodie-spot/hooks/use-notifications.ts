import { useState, useEffect, useCallback, useRef } from 'react';
import { notifications, NotificationPreferences, PushToken } from "@/services/notification";
import { notificationAPI } from '@/services/api';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const useNotifications = (
    onReceived?: (notification: any) => void,
    onTapped?: (datam: any) => void
) => {
    const [pushToken, setPushToken] = useState<PushToken | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [scheduled, setScheduled] = useState<any[]>([]);
    const [notificationsList, setNotificationsList] = useState<any[]>([]);
    const [badgeCount, setBadgeCount] = useState(0);

    const cleanupRef = useRef<(() => void) | null>(null);

    const refreshScheduled = useCallback(async () => {
        const list = await notifications.getScheduled();
        setScheduled(list);
    }, []);

    const setupListeners = useCallback(() => {
        cleanupRef.current = notifications.setupListeners(
            (n) => onReceived?.(n),
            (r) => onTapped?.(r.notification.request.content.data)
        );
    }, [onReceived, onTapped]); 

    const initialize = useCallback(async () => {
        if (isExpoGo) {
            console.warn('Push notifications are not supported in Expo Go (SDK 53+). Use a development build.');
            setHasPermission(false);
            setIsLoading(false);
            return null;
        }
        setIsLoading(true);
        try {
            const token = await notifications.initialize();
            if (token) {
                setPushToken(token);
                setHasPermission(true);
                
                // Register with backend
                try {
                    await notificationAPI.registerPushToken(
                        token.token, 
                        token.platform, 
                        token.deviceId
                    );
                } catch (e) {
                    console.warn('Failed to register push token with backend', e);
                }
            }
            return token;

        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadData = useCallback(async () => {
        try {
            const [token, prefs, badge, scheduledList] = await Promise.all([
                notifications.getToken(),
                notifications.getPreferences(),
                notifications.getBadge(),
                notifications.getScheduled(),
            ]);

            setPushToken(token);
            setPreferences(prefs);
            setBadgeCount(badge);
            setScheduled(scheduledList);
            setHasPermission(!!token);

            // Fetch from backend
            try {
                const history = await notificationAPI.getNotifications();
                setNotificationsList(history);
            } catch (e) {
                console.warn('Failed to fetch notification history');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        setupListeners();
        refreshScheduled(); 
        const cleanup = cleanupRef.current;
        return () => cleanup?.();
    }, [loadData, setupListeners, refreshScheduled]);

    const send = useCallback((title: string, body: string, data?: any) => {
        return notifications.send(title, body, data);
    }, []);

    const schedule = useCallback(async (title: string, body: string, date: Date, data?: any) => {
        const id = await notifications.schedule(title, body, date, data);
        await refreshScheduled();
        return id;
    }, [refreshScheduled]);



    const scheduleTripReminder = useCallback(async (id: string, title: string, date: Date) => {
        const id_ = await notifications.scheduleTripReminder(id, title, date);
        await refreshScheduled();
        return id_;
    }, [refreshScheduled]);


    const cancel = useCallback(async (id: string) => {
        await notifications.cancel(id);
        await refreshScheduled();
    }, [refreshScheduled]);

    const cancelAll = useCallback(async () => {
        await notifications.cancelAll();
        await setScheduled([]);
    }, []);

    const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
        const current = preferences || await notifications.getPreferences();
        const updated = { ...current, ...updates };
        await notifications.savePreferences(updated);
        setPreferences(updated);
    }, [preferences]);

    const updateBadge = useCallback(async (count: number) => {
        await notifications.setBadge(count);
        setBadgeCount(count)
    }, []);

    const clearBadge = useCallback(async () => {
        await notifications.clearBadge();
        setBadgeCount(0)
    }, []);


    // Moved refreshScheduled definition up to be memoized and used as a dependency
    // const refreshScheduled = useCallback(async () => {
    //     const list = await notifications.getScheduled();
    //     setScheduled(list);
    // }, []);

    return {
        pushToken,
        isLoading,
        hasPermission,
        preferences,
        scheduled,
        notificationsList,
        badgeCount,
        initialize,
        send,
        schedule,
        scheduleTripReminder,
        cancel,
        cancelAll,
        updatePreferences,
        setBadgeCount: updateBadge,
        clearBadge,
        refreshScheduled,
    };
}

export const useLastNotificationResponse = () => {
    const [response, setResponse] = useState<any>(null);
    useEffect(() => {
        notifications.getLastResponse().then((r) => {
            if (r) setResponse(r);
        });
    }, []);

    return response;
}