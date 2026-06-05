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
    <div class="login-card">
        <div class="login-logo"><i class="bi bi-egg-fried"></i></div>
        <h2>BZ Farm</h2>
        <p class="subtitle">Poultry Farm Management System</p>

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
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
                <input type="checkbox" id="remember" name="remember">
                <label for="remember" style="margin:0;font-weight:400">Remember me</label>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Sign In</button>
        </form>

        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e9ecef;text-align:center;font-size:12px;color:#6c757d">
            <p><strong>Demo Accounts:</strong></p>
            <p>Admin: <code>admin</code> / <code>admin123</code></p>
            <p>Manager: <code>manager</code> / <code>manager123</code></p>
        </div>
    </div>
</div>
</body>
</html>
