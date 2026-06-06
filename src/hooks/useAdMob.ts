import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  AdMobBannerSize,
  InterstitialAdPluginEvents,
  MaxAdContentRating,
} from '@capacitor-community/admob';

const BANNER_AD_UNIT_ID = 'ca-app-pub-4227443066128564/3020985391';
const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-4227443066128564/8389730719';

let interstitialReady = false;

async function loadInterstitial() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_UNIT_ID });
    interstitialReady = true;
  } catch (e) {
    console.error('[AdMob] Interstitial load failed:', e);
  }
}

async function showInterstitialAd() {
  if (!Capacitor.isNativePlatform() || !interstitialReady) return;
  interstitialReady = false;
  try {
    await AdMob.showInterstitial();
  } catch (e) {
    console.error('[AdMob] Interstitial show failed:', e);
  }
  loadInterstitial();
}

export function useAdMob(isGameOver: boolean, isNewPersonalBest: boolean) {
  const interstitialShownRef = useRef(false);

  // Banner + initialization (runs once on mount)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let sizeListener: { remove: () => void } | null = null;
    let dismissedListener: { remove: () => void } | null = null;

    async function init() {
      await AdMob.initialize({
        maxAdContentRating: MaxAdContentRating.General,
      });

      sizeListener = await AdMob.addListener(
        BannerAdPluginEvents.SizeChanged,
        ({ height }: AdMobBannerSize) => {
          document.documentElement.style.setProperty('--admob-banner-height', `${height}px`);
        },
      );

      dismissedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.Dismissed,
        () => { interstitialReady = false; },
      );

      const options: BannerAdOptions = {
        adId: BANNER_AD_UNIT_ID,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: false,
      };

      await AdMob.showBanner(options);
      loadInterstitial();
    }

    init().catch(console.error);

    return () => {
      sizeListener?.remove();
      dismissedListener?.remove();
      document.documentElement.style.removeProperty('--admob-banner-height');
      AdMob.removeBanner().catch(console.error);
    };
  }, []);

  // Show interstitial when game over + new personal best
  useEffect(() => {
    if (!isGameOver) {
      interstitialShownRef.current = false;
      return;
    }
    if (isNewPersonalBest && !interstitialShownRef.current) {
      interstitialShownRef.current = true;
      showInterstitialAd();
    }
  }, [isGameOver, isNewPersonalBest]);
}
