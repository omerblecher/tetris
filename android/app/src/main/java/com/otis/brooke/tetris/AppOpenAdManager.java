package com.otis.brooke.tetris;

import android.app.Activity;
import android.app.Application;
import android.util.Log;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.appopen.AppOpenAd;

import java.util.Date;

public class AppOpenAdManager {

    private static final String LOG_TAG = "AppOpenAdManager";
    private static final String AD_UNIT_ID = "ca-app-pub-4227443066128564/4649796258";
    private static final long AD_EXPIRY_HOURS = 4;

    private AppOpenAd appOpenAd = null;
    private boolean isLoadingAd = false;
    boolean isShowingAd = false;
    private long loadTime = 0;

    private final Application application;

    AppOpenAdManager(Application application) {
        this.application = application;
    }

    private boolean isAdFresh() {
        long elapsed = new Date().getTime() - loadTime;
        return elapsed < (AD_EXPIRY_HOURS * 3600000L);
    }

    boolean isAdAvailable() {
        return appOpenAd != null && isAdFresh();
    }

    void loadAd() {
        if (isLoadingAd || isAdAvailable()) return;
        isLoadingAd = true;
        AdRequest request = new AdRequest.Builder().build();
        AppOpenAd.load(application, AD_UNIT_ID, request, new AppOpenAd.AppOpenAdLoadCallback() {
            @Override
            public void onAdLoaded(AppOpenAd ad) {
                appOpenAd = ad;
                isLoadingAd = false;
                loadTime = new Date().getTime();
                Log.d(LOG_TAG, "App Open Ad loaded.");
            }

            @Override
            public void onAdFailedToLoad(LoadAdError error) {
                isLoadingAd = false;
                Log.d(LOG_TAG, "App Open Ad failed to load: " + error.getMessage());
            }
        });
    }

    void showAdIfAvailable(Activity activity, OnShowAdCompleteListener listener) {
        if (isShowingAd) return;
        if (!isAdAvailable()) {
            listener.onShowAdComplete();
            loadAd();
            return;
        }
        appOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                appOpenAd = null;
                isShowingAd = false;
                Log.d(LOG_TAG, "App Open Ad dismissed.");
                listener.onShowAdComplete();
                loadAd();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(AdError error) {
                appOpenAd = null;
                isShowingAd = false;
                Log.d(LOG_TAG, "App Open Ad failed to show: " + error.getMessage());
                listener.onShowAdComplete();
                loadAd();
            }

            @Override
            public void onAdShowedFullScreenContent() {
                isShowingAd = true;
                Log.d(LOG_TAG, "App Open Ad showed.");
            }
        });
        appOpenAd.show(activity);
    }

    interface OnShowAdCompleteListener {
        void onShowAdComplete();
    }
}
