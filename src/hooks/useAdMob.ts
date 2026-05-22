import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdOptions,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  AdMobBannerSize,
} from '@capacitor-community/admob';

const BANNER_AD_UNIT_ID = 'ca-app-pub-4227443066128564/3020985391';

export function useAdMob() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let sizeListener: { remove: () => void } | null = null;

    async function init() {
      await AdMob.initialize();

      sizeListener = await AdMob.addListener(
        BannerAdPluginEvents.SizeChanged,
        ({ height }: AdMobBannerSize) => {
          // height is in dp, which equals CSS px on Android
          document.documentElement.style.setProperty('--admob-banner-height', `${height}px`);
        },
      );

      const options: BannerAdOptions = {
        adId: BANNER_AD_UNIT_ID,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: false,
      };

      await AdMob.showBanner(options);
    }

    init().catch(console.error);

    return () => {
      sizeListener?.remove();
      document.documentElement.style.removeProperty('--admob-banner-height');
      AdMob.removeBanner().catch(console.error);
    };
  }, []);
}
