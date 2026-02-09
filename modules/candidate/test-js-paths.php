<?php
echo "<h1>Checking File Existence</h1>";

$base = 'C:/xampp/htdocs/GSS';

$files = [
    'portal.php' => $base . '/modules/candidate/portal.php',
    'router.js' => $base . '/js/modules/candidate/router.js',
    'forms.js' => $base . '/js/modules/candidate/forms.js', 
    'app.js' => $base . '/js/modules/candidate/app.js',
    'aside_candidate.js' => $base . '/js/includes/aside_candidate.js'
];

foreach ($files as $name => $path) {
    if (file_exists($path)) {
        echo "<p style='color:green'>✅ $name exists at: $path</p>";
        echo "<p>Size: " . filesize($path) . " bytes | ";
        echo "<a href='" . str_replace($base, '', $path) . "' target='_blank'>View</a></p>";
    } else {
        echo "<p style='color:red'>❌ $name NOT FOUND at: $path</p>";
    }
    echo "<hr>";
}
?>