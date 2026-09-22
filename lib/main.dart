import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SmartShopXApp());
}

class SmartShopXApp extends StatelessWidget {
  const SmartShopXApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SmartShopX',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF059669), // Emerald Brand Primary
          primary: const Color(0xFF059669),
          surface: Colors.white,
        ),
        useMaterial3: true,
      ),
      home: const SmartShopXWebViewPage(),
    );
  }
}

class SmartShopXWebViewPage extends StatefulWidget {
  const SmartShopXWebViewPage({super.key});

  @override
  State<SmartShopXWebViewPage> createState() => _SmartShopXWebViewPageState();
}

class _SmartShopXWebViewPageState extends State<SmartShopXWebViewPage> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  int _loadingProgress = 0;

  static const String _targetUrl = 'https://smartshopx-bd2b0.web.app';

  @override
  void initState() {
    super.initState();
    _initWebViewController();
  }

  void _initWebViewController() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() {
                _loadingProgress = progress;
                if (progress >= 100) {
                  _isLoading = false;
                }
              });
            }
          },
          onPageStarted: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = true;
                _hasError = false;
              });
            }
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
          },
          onWebResourceError: (WebResourceError error) {
            // Filter out minor resource loading warnings, only handle main page failures
            if (error.isForMainFrame ?? true) {
              if (mounted) {
                setState(() {
                  _isLoading = false;
                  _hasError = true;
                  _errorMessage = error.description.isNotEmpty
                      ? error.description
                      : 'নেটওয়ার্ক সংযোগ বা ওয়েবসাইট লোড করতে সমস্যা হয়েছে।';
                });
              }
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            // Keep all SmartShopX web app navigation inside WebView
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(_targetUrl));
  }

  void _reloadWebView() {
    setState(() {
      _isLoading = true;
      _hasError = false;
      _loadingProgress = 0;
    });
    _controller.reload();
  }

  Future<bool> _handleBackPress() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false; // Prevent closing the app, navigate back inside WebView
    }
    return true; // Allow exiting app if no WebView history remains
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool didPop, Object? result) async {
        if (didPop) return;
        final bool shouldPop = await _handleBackPress();
        if (shouldPop && context.mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0F172A), // Slate 900
        body: SafeArea(
          child: Stack(
            children: [
              // Main WebView Container
              if (!_hasError)
                WebViewWidget(controller: _controller)
              else
                _buildErrorScreen(),

              // Top Linear Progress Bar while page loads
              if (_isLoading && !_hasError)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: LinearProgressIndicator(
                    value: _loadingProgress > 0 ? _loadingProgress / 100.0 : null,
                    backgroundColor: Colors.white12,
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF059669)),
                    minHeight: 3.5,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorScreen() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // SmartShopX Logo Badge
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: const Color(0xFF059669),
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: const Center(
                child: Text(
                  'SX',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 28,
                    letterSpacing: -1.0,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'SmartShopX.bd',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 22,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'ইন্টারনেট সংযোগ সমস্যা',
              style: TextStyle(
                color: Color(0xFF34D399),
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _errorMessage.isNotEmpty
                  ? _errorMessage
                  : 'আপনার ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 13,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: _reloadWebView,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 4,
              ),
              icon: const Icon(Icons.refresh, size: 20),
              label: const Text(
                'পুনরায় চেষ্টা করুন (Retry)',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
