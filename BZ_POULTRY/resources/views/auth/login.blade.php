<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - BZ Farm</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="{{ asset('css/farm.css') }}">
</head>
<body>
<div class="login-page">
    <div class="login-bg"></div>
    <div class="login-card split-card">
        <div class="login-card__aside">
            <div class="aside-top">
                <div class="login-logo"><img src="{{ asset('images/BZ LOGO.png') }}" alt="BZ Logo"></div>
            </div>
            <div class="aside-body">
                <h1>Your next poultry adventure awaits!</h1>
                <p>Log in to unlock real-time flock tracking, egg production analytics, feed management, and sales monitoring in one modern farm dashboard.</p>
            </div>
        </div>

        <div class="login-card__main">
            <div class="login-form-header">
                <h2>Welcome back!</h2>
                <p>Please enter your details to continue.</p>
            </div>

            @if($errors->any())
                <div class="alert-error" style="margin-bottom:20px">
                    @foreach($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            @endif

            <form method="POST" action="{{ route('login') }}">
                @csrf
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" class="form-control" value="{{ old('username') }}" placeholder="Enter username" required autofocus>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" class="form-control" placeholder="Enter password" required>
                </div>
                <div class="form-group remember-row">
                    <label class="checkbox-field">
                        <input type="checkbox" id="remember" name="remember">
                        <span>Remember me</span>
                    </label>
                    <a href="#" class="forgot-link">Forgot password?</a>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Sign In</button>
            </form>

            <div class="login-card__help">
                <p><strong>Demo Accounts:</strong></p>
                <p>Admin: <code>admin</code> / <code>admin123</code></p>
                <p>Manager: <code>manager</code> / <code>manager123</code></p>
            </div>
        </div>
    </div>
</div>
<script>
    const loginBgImages = [
        "{{ asset('images/login-bg-1.jpg') }}",
        "{{ asset('images/login-bg-2.jpg') }}",
        "{{ asset('images/login-bg-3.jpg') }}",
        "{{ asset('images/login-bg-4.jpg') }}",
        "{{ asset('images/login-bg-5.jpg') }}"
    ];

    let loginBgIndex = 0;
    const loginBgEl = document.querySelector('.login-bg');

    function updateLoginBg() {
        if (!loginBgEl) return;

        const nextUrl = loginBgImages[loginBgIndex];
        const nextImage = new Image();
        nextImage.src = nextUrl;

        nextImage.onload = () => {
            loginBgEl.style.opacity = '0';
            setTimeout(() => {
                loginBgEl.style.backgroundImage = `url('${nextUrl}')`;
                loginBgEl.style.opacity = '1';
            }, 200);
        };

        loginBgIndex = (loginBgIndex + 1) % loginBgImages.length;
    }

    if (loginBgEl) {
        updateLoginBg();
        setInterval(updateLoginBg, 7000);
    }
</script>
</body>
</html>
