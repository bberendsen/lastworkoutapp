<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

trait StoresTeamLogos
{
    protected function storeTeamLogoFile(UploadedFile $file): string
    {
        $path = $file->store('teams', 'public');

        return url(Storage::url($path));
    }

    protected function deleteStoredTeamLogo(?string $logoUrl): void
    {
        if (! $logoUrl) {
            return;
        }
        $path = parse_url($logoUrl, PHP_URL_PATH);
        if (! is_string($path) || ! str_starts_with($path, '/storage/')) {
            return;
        }
        $relative = substr($path, strlen('/storage/'));
        if ($relative !== '') {
            Storage::disk('public')->delete($relative);
        }
    }
}
