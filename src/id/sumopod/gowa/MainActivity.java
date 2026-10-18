package id.sumopod.gowa;

import android.app.Activity;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView webView;
    private FrameLayout rootLayout;
    private LinearLayout splashView;
    private LinearLayout errorView;
    private ValueCallback<Uri[]> uploadMessage;
    private long lastBackPressTime = 0;
    private static final int FILE_CHOOSER_RESULT_CODE = 1001;
    private static final String PREFS_NAME = "gowa_mobile_prefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String CHANNEL_ID = "gowa_messages_v2";
    private static final String CHANNEL_NAME = "GoWA Pesan & Notifikasi";
    private static final int PERMISSION_REQUEST_POST_NOTIFICATIONS = 2001;

    public class MobileBridge {
        @JavascriptInterface
        public void showToast(final String message) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void vibrate(long ms) {
            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null && v.hasVibrator()) {
                    v.vibrate(ms > 0 ? ms : 50);
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public String getAppVersion() {
            return "1.1.6";
        }

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }

        @JavascriptInterface
        public boolean hasNotificationPermission() {
            if (Build.VERSION.SDK_INT >= 33) {
                return checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
            }
            return true;
        }

        @JavascriptInterface
        public void saveServerUrl(String url) {
            if (url == null || url.trim().isEmpty() || url.contains("trycloudflare.com") || url.contains("serverinka.cloud") || url.contains("localhost:3000")) {
                url = "https://agentai.my.id";
            }
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            prefs.edit().putString(KEY_SERVER_URL, url.trim()).apply();
        }

        @JavascriptInterface
        public String getServerUrl() {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
            String url = prefs.getString(KEY_SERVER_URL, "https://agentai.my.id");
            if (url == null || url.trim().isEmpty() || url.contains("trycloudflare.com") || url.contains("serverinka.cloud") || url.contains("localhost:3000")) {
                url = "https://agentai.my.id";
                prefs.edit().putString(KEY_SERVER_URL, url).apply();
            }
            return url;
        }

        @JavascriptInterface
        public void showNotification(final String title, final String body, final String type) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    displayNotification(title, body, type);
                }
            });
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    MainActivity.this.requestNotificationPermission();
                }
            });
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.setStatusBarColor(0xFF0B0F19);
            window.setNavigationBarColor(0xFF0B0F19);
        }

        rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(0xFF0B0F19);
        setContentView(rootLayout);

        initWebView();
        initSplashView();
        initErrorView();

        rootLayout.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        rootLayout.addView(splashView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        rootLayout.addView(errorView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        initNotificationChannel();
        requestNotificationPermission();

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String currentUrl = prefs.getString(KEY_SERVER_URL, null);
        if (currentUrl == null || currentUrl.trim().isEmpty() || currentUrl.contains("trycloudflare.com") || currentUrl.contains("serverinka.cloud") || currentUrl.contains("localhost:3000")) {
            prefs.edit().putString(KEY_SERVER_URL, "https://agentai.my.id").apply();
        }

        webView.loadUrl("file:///android_asset/index.html");
    }

    private void initWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(0xFF0B0F19);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            settings.setMediaPlaybackRequiresUserGesture(false);
        }

        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString((defaultUa != null ? defaultUa : "") + " GoWAMobile/1.1.6");

        MobileBridge bridge = new MobileBridge();
        webView.addJavascriptInterface(bridge, "GoWAMobile");
        webView.addJavascriptInterface(bridge, "Android");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && url.startsWith("file:///android_asset/")) {
                    return false;
                }
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        if (splashView != null && splashView.getVisibility() == View.VISIBLE) {
                            splashView.animate().alpha(0f).setDuration(250).withEndAction(new Runnable() {
                                @Override
                                public void run() {
                                    splashView.setVisibility(View.GONE);
                                }
                            });
                        }
                    }
                }, 350);
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                notifyConnectionError(description != null ? description : "Koneksi terputus");
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                String msg = "Koneksi terputus";
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && error != null && error.getDescription() != null) {
                    msg = error.getDescription().toString();
                }
                notifyConnectionError(msg);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (uploadMessage != null) {
                    uploadMessage.onReceiveValue(null);
                    uploadMessage = null;
                }
                uploadMessage = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE);
                } catch (Exception e) {
                    uploadMessage = null;
                    return false;
                }
                return true;
            }
        });

        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimetype);
                    String cookies = CookieManager.getInstance().getCookie(url);
                    if (cookies != null) {
                        request.addRequestHeader("cookie", cookies);
                    }
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setDescription("Mengunduh berkas dari GoWA");
                    String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                    request.setTitle(filename);
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
                    DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(MainActivity.this, "Mengunduh " + filename, Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception ignored) {}
                }
            }
        });
    }

    private void initSplashView() {
        splashView = new LinearLayout(this);
        splashView.setOrientation(LinearLayout.VERTICAL);
        splashView.setGravity(Gravity.CENTER);
        splashView.setBackgroundColor(0xFF0B0F19);

        ImageView logo = new ImageView(this);
        int logoId = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
        if (logoId != 0) {
            logo.setImageResource(logoId);
        }
        int size = dpToPx(88);
        LinearLayout.LayoutParams logoParams = new LinearLayout.LayoutParams(size, size);
        logoParams.gravity = Gravity.CENTER_HORIZONTAL;
        splashView.addView(logo, logoParams);

        TextView title = new TextView(this);
        title.setText("GoWA");
        title.setTextColor(Color.WHITE);
        title.setTextSize(22);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        titleParams.topMargin = dpToPx(14);
        titleParams.gravity = Gravity.CENTER_HORIZONTAL;
        splashView.addView(title, titleParams);

        TextView subtitle = new TextView(this);
        subtitle.setText("WhatsApp Web Automation Suite");
        subtitle.setTextColor(0xFF94A3B8);
        subtitle.setTextSize(12);
        subtitle.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        subParams.topMargin = dpToPx(4);
        subParams.gravity = Gravity.CENTER_HORIZONTAL;
        splashView.addView(subtitle, subParams);

        ProgressBar progress = new ProgressBar(this);
        progress.setIndeterminate(true);
        LinearLayout.LayoutParams progressParams = new LinearLayout.LayoutParams(
                dpToPx(36), dpToPx(36));
        progressParams.topMargin = dpToPx(24);
        progressParams.gravity = Gravity.CENTER_HORIZONTAL;
        splashView.addView(progress, progressParams);
    }

    private void initErrorView() {
        errorView = new LinearLayout(this);
        errorView.setOrientation(LinearLayout.VERTICAL);
        errorView.setGravity(Gravity.CENTER);
        errorView.setBackgroundColor(0xFF0B0F19);
        errorView.setPadding(dpToPx(24), dpToPx(24), dpToPx(24), dpToPx(24));
        errorView.setVisibility(View.GONE);

        ImageView icon = new ImageView(this);
        int iconId = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
        if (iconId != 0) {
            icon.setImageResource(iconId);
        }
        int iconSize = dpToPx(64);
        LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(iconSize, iconSize);
        iconParams.gravity = Gravity.CENTER_HORIZONTAL;
        errorView.addView(icon, iconParams);

        TextView title = new TextView(this);
        title.setText("Gagal Terhubung ke Server");
        title.setTextColor(Color.WHITE);
        title.setTextSize(18);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        titleParams.topMargin = dpToPx(16);
        titleParams.gravity = Gravity.CENTER_HORIZONTAL;
        errorView.addView(title, titleParams);

        TextView desc = new TextView(this);
        desc.setText("Pastikan server GoWA aktif dan koneksi internet stabil.");
        desc.setTextColor(0xFF94A3B8);
        desc.setTextSize(13);
        desc.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams descParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        descParams.topMargin = dpToPx(8);
        descParams.gravity = Gravity.CENTER_HORIZONTAL;
        errorView.addView(desc, descParams);

        Button retryBtn = new Button(this);
        retryBtn.setText("Muat Ulang");
        retryBtn.setTextColor(Color.WHITE);
        retryBtn.setTextSize(13);
        retryBtn.setTypeface(null, android.graphics.Typeface.BOLD);

        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(0xFF10B981);
        btnBg.setCornerRadius(dpToPx(8));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            retryBtn.setBackground(btnBg);
        } else {
            retryBtn.setBackgroundDrawable(btnBg);
        }

        retryBtn.setPadding(dpToPx(24), dpToPx(10), dpToPx(24), dpToPx(10));
        retryBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                errorView.setVisibility(View.GONE);
                splashView.setAlpha(1f);
                splashView.setVisibility(View.VISIBLE);
                String currentUrl = webView.getUrl();
                if (currentUrl == null || currentUrl.isEmpty() || !currentUrl.startsWith("file:///android_asset/")) {
                    webView.loadUrl("file:///android_asset/index.html");
                } else {
                    webView.reload();
                }
            }
        });

        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        btnParams.topMargin = dpToPx(20);
        btnParams.gravity = Gravity.CENTER_HORIZONTAL;
        errorView.addView(retryBtn, btnParams);

        Button configBtn = new Button(this);
        configBtn.setText("Buka Pengaturan Koneksi");
        configBtn.setTextColor(0xFF38BDF8);
        configBtn.setTextSize(13);
        configBtn.setTypeface(null, android.graphics.Typeface.BOLD);
        GradientDrawable configBg = new GradientDrawable();
        configBg.setColor(0xFF1E293B);
        configBg.setStroke(dpToPx(1), 0xFF334155);
        configBg.setCornerRadius(dpToPx(8));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            configBtn.setBackground(configBg);
        } else {
            configBtn.setBackgroundDrawable(configBg);
        }
        configBtn.setPadding(dpToPx(20), dpToPx(10), dpToPx(20), dpToPx(10));
        configBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                errorView.setVisibility(View.GONE);
                webView.loadUrl("file:///android_asset/index.html#/connect");
            }
        });
        LinearLayout.LayoutParams configParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        configParams.topMargin = dpToPx(12);
        configParams.gravity = Gravity.CENTER_HORIZONTAL;
        errorView.addView(configBtn, configParams);
    }

    private void notifyConnectionError(final String errorMsg) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (splashView != null && splashView.getVisibility() == View.VISIBLE) {
                    splashView.setVisibility(View.GONE);
                }
                try {
                    webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('gowa:connection-error', { detail: { message: '" + (errorMsg != null ? errorMsg.replace("'", "\\'") : "Koneksi terputus") + "' } }));", null);
                } catch (Exception ignored) {}
            }
        });
    }

    private void showErrorScreen() {
        notifyConnectionError("Server tidak merespons");
    }

    @Override
    protected void onResume() {
        super.onResume();
        initNotificationChannel();
    }

    private void initNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifikasi pesan WhatsApp personal dan penjadwalan pesan GoWA");
            channel.enableLights(true);
            channel.setLightColor(0xFF10B981);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 200, 250});
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setShowBadge(true);

            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                    .build();
            channel.setSound(soundUri, audioAttributes);

            nm.createNotificationChannel(channel);
        }
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, PERMISSION_REQUEST_POST_NOTIFICATIONS);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_POST_NOTIFICATIONS) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                initNotificationChannel();
            }
        }
    }

    public void displayNotification(String title, String body, String type) {
        try {
            initNotificationChannel();
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, pendingFlags);

            int iconId = android.R.drawable.stat_notify_chat;

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(this, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(this);
                builder.setDefaults(Notification.DEFAULT_ALL);
                builder.setPriority(Notification.PRIORITY_HIGH);
            }

            builder.setContentTitle(title)
                   .setContentText(body)
                   .setSmallIcon(iconId)
                   .setContentIntent(pendingIntent)
                   .setAutoCancel(true);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                builder.setCategory(Notification.CATEGORY_MESSAGE);
                builder.setVisibility(Notification.VISIBILITY_PUBLIC);
                builder.setPriority(Notification.PRIORITY_HIGH);
            }

            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            builder.setSound(soundUri);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                builder.setStyle(new Notification.BigTextStyle().bigText(body));
            }

            try {
                Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                if (v != null && v.hasVibrator()) {
                    v.vibrate(200);
                }
            } catch (Exception ignored) {}

            String tag = (type != null && !type.trim().isEmpty()) ? type.trim() : "gowa";
            int notifId = (int) (System.currentTimeMillis() % 1000000000L);
            nm.notify(tag, notifId, builder.build());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round((float) dp * density);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (uploadMessage != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                uploadMessage.onReceiveValue(results);
                uploadMessage = null;
            }
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
                return true;
            }
            long now = System.currentTimeMillis();
            if (now - lastBackPressTime < 2000) {
                finish();
                return true;
            }
            lastBackPressTime = now;
            Toast.makeText(this, "Tekan sekali lagi untuk keluar", Toast.LENGTH_SHORT).show();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
