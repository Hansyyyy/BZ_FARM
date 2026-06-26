<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
// Bootstrap the framework by handling a safe request first (this runs providers)
$req = Illuminate\Http\Request::create('/login', 'GET');
$res = $kernel->handle($req);

try {
    $html = view('react-app')->render();
    echo "OK\n";
    echo substr($html, 0, 2000);
} catch (Throwable $e) {
    echo "EXCEPTION\n";
    echo get_class($e) . ": " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
// Terminate the kernel (clean up)
$kernel->terminate($req, $res);
