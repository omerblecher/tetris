package com.otis.brooke.tetris;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;

import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;

public class MainApplication extends Application implements Application.ActivityLifecycleCallbacks {

    private AppOpenAdManager appOpenAdManager;
    private long backgroundedAt = 0;
    // Show App Open Ad only when app has been in background for at least 3 seconds
    private static final long APP_OPEN_THRESHOLD_MS = 3000;

    @Override
    public void onCreate() {
        super.onCreate();
        registerActivityLifecycleCallbacks(this);

        // Must be set before MobileAds.initialize() and before any ad requests.
        // TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE signals COPPA compliance and propagates
        // to all certified mediation adapters. MAX_AD_CONTENT_RATING_G blocks gambling,
        // adult, and violence-rated ads — required for Google Play Families Policy.
        RequestConfiguration config = new RequestConfiguration.Builder()
                .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE)
                .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G)
                .build();
        MobileAds.setRequestConfiguration(config);
        MobileAds.initialize(this);

        appOpenAdManager = new AppOpenAdManager(this);
        appOpenAdManager.loadAd();
    }

    @Override
    public void onActivityStarted(Activity activity) {
        if (appOpenAdManager.isShowingAd) return;
        if (backgroundedAt > 0) {
            long elapsed = System.currentTimeMillis() - backgroundedAt;
            if (elapsed > APP_OPEN_THRESHOLD_MS) {
                backgroundedAt = 0;
                appOpenAdManager.showAdIfAvailable(activity, () -> {});
            }
        }
    }

    @Override
    public void onActivityStopped(Activity activity) {
        if (activity instanceof MainActivity) {
            backgroundedAt = System.currentTimeMillis();
        }
    }

    @Override public void onActivityCreated(Activity activity, Bundle savedInstanceState) {}
    @Override public void onActivityResumed(Activity activity) {}
    @Override public void onActivityPaused(Activity activity) {}
    @Override public void onActivitySaveInstanceState(Activity activity, Bundle outState) {}
    @Override public void onActivityDestroyed(Activity activity) {}
}
