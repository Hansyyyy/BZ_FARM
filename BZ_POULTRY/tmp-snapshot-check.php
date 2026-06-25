<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::create('/api/daily-reports/snapshot?date=2026-06-26', 'GET');
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . PHP_EOL;
echo "Headers:\n";
foreach ($response->headers->all() as $k => $v) {
    echo "$k: " . implode(', ', $v) . PHP_EOL;
}
echo "\nBody snippet:\n";
$body = (string) $response->getContent();
echo substr($body, 0, 1000) . PHP_EOL;
$kernel->terminate($request, $response);
