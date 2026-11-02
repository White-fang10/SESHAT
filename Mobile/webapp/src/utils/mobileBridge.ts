import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';

declare global {
  interface Window {
    AndroidBridge?: {
      postMessage: (action: string, payload?: string) => void;
      triggerHaptic: (intensity: string) => void;
      shareText: (title: string, text: string, url?: string) => void;
      showToast: (message: string) => void;
      finishActivity: () => void;
    };
    handleAndroidBack?: () => boolean;
  }
}

export const triggerHapticFeedback = async (type: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    if (typeof window !== 'undefined' && window.AndroidBridge?.triggerHaptic) {
      window.AndroidBridge.triggerHaptic(type);
      return;
    }
    const style =
      type === 'heavy' ? ImpactStyle.Heavy : type === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
    await Haptics.impact({ style });
  } catch {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(type === 'heavy' ? 35 : 15);
    }
  }
};

export const shareContent = async (options: { title: string; text: string; url?: string }): Promise<boolean> => {
  try {
    if (typeof window !== 'undefined' && window.AndroidBridge?.shareText) {
      window.AndroidBridge.shareText(options.title, options.text, options.url || '');
      return true;
    }
    const canCapShare = await Share.canShare().then((r) => r.value).catch(() => false);
    if (canCapShare) {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.title,
      });
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(options);
      return true;
    }
  } catch (err) {
    console.warn('Share operation cancelled or unsupported:', err);
  }
  return false;
};

export const showNativeToast = (message: string) => {
  if (typeof window !== 'undefined' && window.AndroidBridge?.showToast) {
    window.AndroidBridge.showToast(message);
  }
};
