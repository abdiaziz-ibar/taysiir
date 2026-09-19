package com.taysirfoundation.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();

        // The app's own CSS viewport meta (width=device-width) is the source of
        // truth for layout — disable the WebView's own zoom/pan so a stray
        // pinch or double-tap can never leave the page scrolled/zoomed away
        // from that intended mobile layout.
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        webView.setInitialScale(0);
    }
}
