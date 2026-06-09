<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - BZ Farm</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="{{ asset('css/farm.css') }}">
    <style>
        .password-field{position:relative}
        .password-field .toggle-password{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:transparent;padding:6px;color:#495057}
        .password-field .toggle-password:focus{outline:none}
        .password-field .form-control{padding-right:38px}
    </style>
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
                    <div class="password-field">
                        <input type="password" id="password" name="password" class="form-control" placeholder="Enter password" required>
                        <button type="button" class="toggle-password" aria-label="Show password">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
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

    // Password show/hide toggle
    (function(){
        const pwdInput = document.getElementById('password');
        const toggle = document.querySelector('.toggle-password');
        if (!pwdInput || !toggle) return;

        toggle.addEventListener('click', function(){
            const icon = this.querySelector('i');
            if (pwdInput.type === 'password'){
                pwdInput.type = 'text';
                if (icon) { icon.classList.remove('bi-eye'); icon.classList.add('bi-eye-slash'); }
                this.setAttribute('aria-label','Hide password');
            } else {
                pwdInput.type = 'password';
                if (icon) { icon.classList.remove('bi-eye-slash'); icon.classList.add('bi-eye'); }
                this.setAttribute('aria-label','Show password');
            }
        });
    })();
</script>
</body>
</html>
