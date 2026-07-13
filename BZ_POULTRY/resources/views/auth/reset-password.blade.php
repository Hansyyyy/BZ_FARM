<!DOCTYPE html>
<html lang="en">
<head>
    <script>
        (function () {
            try {
                document.documentElement.classList.remove('dark-theme');
                localStorage.removeItem('theme');
            } catch (error) {
                // Ignore storage access errors.
            }
        })();
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - BZ Farm</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="{{ asset('css/farm.css') }}?v={{ @filemtime(public_path('css/farm.css')) }}">
    <link rel="stylesheet" href="{{ asset('css/design-system.css') }}?v={{ @filemtime(public_path('css/design-system.css')) }}">
    <style>
        .password-field{position:relative}
        .password-field .toggle-password{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:transparent;padding:6px;color:#495057;z-index:3}
        .password-field .toggle-password:focus{outline:none}
        .password-field .floating-input{padding-right:42px}

        .login-card__main .form-group{margin-bottom:22px}
        .login-card__main .floating-field{position:relative}
        .login-card__main .floating-input{width:100%;padding:20px 16px 10px;border-radius:14px;border:1px solid rgba(27,77,46,0.18);background:rgba(255,255,255,0.9);transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s cubic-bezier(.22,1,.36,1), border-color .35s cubic-bezier(.22,1,.36,1), background-color .35s cubic-bezier(.22,1,.36,1)}
        .login-card__main .floating-input::placeholder{color:transparent}
        .login-card__main .floating-label{position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none;background:rgba(255,255,255,0.9);padding:0 6px;color:#6c757d;transition:top .35s cubic-bezier(.22,1,.36,1), transform .35s cubic-bezier(.22,1,.36,1), color .35s ease, background-color .35s ease;border-radius:6px}
        .login-card__main .floating-input:focus + .floating-label,
        .login-card__main .floating-input:not(:placeholder-shown) + .floating-label,
        .login-card__main .floating-input:valid + .floating-label{top:0;transform:translateY(-50%) scale(0.92);color:var(--primary)}
        .login-card__main .floating-field:hover .floating-input{transform:translateY(-2px) scale(1.002);box-shadow:0 12px 24px rgba(27,77,46,0.12);border-color:var(--primary-light)}
        .login-card__main .floating-field:focus-within .floating-input{transform:translateY(-2px) scale(1.008);box-shadow:0 0 0 4px rgba(27,77,46,0.12);border-color:var(--primary)}
        .login-card__main .btn-primary{transition:transform .2s ease, box-shadow .2s ease, background .2s ease}
        .login-card__main .btn-primary:hover{transform:translateY(-2px);box-shadow:0 10px 20px rgba(27,77,46,0.18)}
        .login-card__main .btn-primary:active{transform:translateY(0) scale(0.98)}
        .login-card__main .btn-outline{transition:transform .2s ease, box-shadow .2s ease, background .2s ease}
        .login-card__main .btn-outline:hover{transform:translateY(-2px);box-shadow:0 10px 20px rgba(27,77,46,0.18)}
    </style>
</head>
<body>
<div class="login-page">
    <div class="login-bg"></div>
    <div class="login-card split-card">
        <div class="login-card__aside">
            <div class="aside-top">
                <div class="login-logo"><img src="{{ asset('images/BZ_LOGO_W.png') }}" alt="BZ Farm Logo"></div>
            </div>
            <div class="aside-body">
                <h1>Reset Your Password</h1>
                <p>Enter your username and new password to update your account credentials. This feature is available for admin and manager accounts.</p>
            </div>
        </div>

        <div class="login-card__main">
            <div class="login-form-header">
                <h2 style="display:block !important; visibility:visible !important; color:#000000 !important; font-size:2.1rem !important; font-weight:700 !important; margin:0 !important; line-height:1.2 !important;">Password Reset</h2>
            </div>

            @if($errors->any())
                <div class="alert-error" style="margin-bottom:20px">
                    @foreach($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            @endif

            @if(session('success'))
                <div class="alert-success" style="margin-bottom:20px">
                    <div>{{ session('success') }}</div>
                </div>
            @endif

            @if(session('error'))
                <div class="alert-error" style="margin-bottom:20px">
                    <div>{{ session('error') }}</div>
                </div>
            @endif

            <form method="POST" action="{{ route('password.reset.submit') }}">
                @csrf
                <div class="form-group">
                    <div class="floating-field">
                        <input type="text" id="username" name="username" class="form-control floating-input" value="{{ old('username') }}" placeholder=" " required autofocus>
                        <label for="username" class="floating-label">Username <span class="form-required-mark">*</span></label>
                    </div>
                </div>
                <div class="form-group">
                    <div class="password-field floating-field">
                        <input type="password" id="password" name="password" class="form-control floating-input" placeholder=" " required>
                        <label for="password" class="floating-label">New Password <span class="form-required-mark">*</span></label>
                        <button type="button" class="toggle-password" aria-label="Show password">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <div class="password-field floating-field">
                        <input type="password" id="password_confirmation" name="password_confirmation" class="form-control floating-input" placeholder=" " required>
                        <label for="password_confirmation" class="floating-label">Confirm New Password <span class="form-required-mark">*</span></label>
                        <button type="button" class="toggle-password" aria-label="Show password">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Reset Password</button>
                <div style="margin-top: 16px; text-align: center;">
                    <a href="{{ route('login') }}" class="btn btn-outline btn-block">Back to Login</a>
                </div>
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
        const toggleButtons = document.querySelectorAll('.toggle-password');
        toggleButtons.forEach(function(toggle) {
            const input = toggle.parentElement.querySelector('input');
            if (!input) return;

            toggle.addEventListener('click', function(){
                const icon = this.querySelector('i');
                if (input.type === 'password'){
                    input.type = 'text';
                    if (icon) { icon.classList.remove('bi-eye'); icon.classList.add('bi-eye-slash'); }
                    this.setAttribute('aria-label','Hide password');
                } else {
                    input.type = 'password';
                    if (icon) { icon.classList.remove('bi-eye-slash'); icon.classList.add('bi-eye'); }
                    this.setAttribute('aria-label','Show password');
                }
            });
        });
    })();
</script>
</body>
</html>
