/**
 * Utility to handle browser push notifications and sounds
 */

export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notifications");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
};

export const showPushNotification = (title, options = {}) => {
    if (Notification.permission === "granted") {
        const defaultOptions = {
            icon: '/favicon.svg',
            badge: '/favicon.svg',
            silent: false,
            ...options
        };
        new Notification(title, defaultOptions);
    }
};

export const playNotificationSound = (type = 'default') => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'success') {
            // Upward chime
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
        } else if (type === 'error') {
            // Downward tone
            oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(329.63, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime + 0.2);
        } else {
            // Neutral alert
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
        }

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
        console.error('Failed to play sound:', err);
    }
};
