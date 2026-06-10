<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <meta name="theme-color" content="#1b4d2e">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="manifest" href="<?php echo e(asset('manifest.json')); ?>">
    <link rel="apple-touch-icon" href="<?php echo e(asset('images/BZ LOGO.png')); ?>">
    <title>BZ Farm</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="<?php echo e(asset('css/farm.css')); ?>">
    <?php echo app('Illuminate\Foundation\Vite')(['resources/css/app.css', 'resources/js/main.jsx']); ?>
    <script>
        window.Laravel = {
            user: <?php echo json_encode(auth()->user(), 15, 512) ?>,
            csrfToken: '<?php echo e(csrf_token()); ?>',
            logoUrl: <?php echo json_encode(asset('images/BZ LOGO.png'), 15, 512) ?>,
        };
    </script>
</head>
<body>
    <div id="root"></div>
</body>
</html>
<?php /**PATH C:\xampp\htdocs\BZ_FARM-1\BZ_POULTRY\resources\views/react-app.blade.php ENDPATH**/ ?>