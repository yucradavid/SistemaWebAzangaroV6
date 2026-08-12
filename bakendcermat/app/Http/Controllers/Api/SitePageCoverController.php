<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SitePageCover;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class SitePageCoverController extends Controller
{
    private const SIZES = [
        'large' => 1920,
        'medium' => 1200,
        'small' => 600,
    ];

    public function index(): JsonResponse
    {
        $covers = SitePageCover::orderBy('page_key')->get()->map(fn (SitePageCover $cover) => $this->format($cover));

        return response()->json(['data' => $covers]);
    }

    /**
     * Endpoint público: sin autenticación, cacheable por el navegador/CDN.
     */
    public function publicIndex(): JsonResponse
    {
        $covers = SitePageCover::orderBy('page_key')->get()->map(fn (SitePageCover $cover) => $this->format($cover));

        return response()->json(['data' => $covers])
            ->header('Cache-Control', 'public, max-age=300');
    }

    public function update(Request $request, string $pageKey): JsonResponse
    {
        $cover = SitePageCover::where('page_key', $pageKey)->firstOrFail();

        $data = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'object_position' => ['nullable', 'string', 'max:50'],
        ]);

        $relativeBase = "covers/{$pageKey}";

        try {
            // Fotos de celular reales pueden decodificar a bitmaps de 40-60MB+ en GD;
            // el memory_limit por defecto (128M) no alcanza. Se eleva solo para esta petición.
            ini_set('memory_limit', '512M');

            $manager = new ImageManager(Driver::class);
            $current = $manager->decodePath($data['image']->getRealPath());

            $absoluteDir = Storage::disk('public')->path('covers');
            if (!is_dir($absoluteDir)) {
                mkdir($absoluteDir, 0755, true);
            }

            // self::SIZES está ordenado de mayor a menor ancho: reescala la misma
            // instancia progresivamente en vez de clonar el original en cada tamaño,
            // evitando triplicar el pico de memoria.
            foreach (self::SIZES as $suffix => $width) {
                $current->scaleDown(width: $width);
                $current->save(Storage::disk('public')->path("{$relativeBase}-{$suffix}.webp"), quality: 82);
            }
        } catch (\Throwable $e) {
            Log::error('SitePageCover upload failed', [
                'page_key' => $pageKey,
                'error' => $e->getMessage(),
                'file' => $e->getFile() . ':' . $e->getLine(),
                'uploaded_mime' => $data['image']->getMimeType(),
                'uploaded_size' => $data['image']->getSize(),
            ]);

            return response()->json([
                'message' => 'No se pudo procesar la imagen: ' . $e->getMessage(),
            ], 422);
        }

        $cover->image_path = $relativeBase;
        if ($request->filled('alt_text')) {
            $cover->alt_text = $data['alt_text'];
        }
        if ($request->filled('object_position')) {
            $cover->object_position = $data['object_position'];
        }
        $cover->updated_by = optional($request->user())->id;
        $cover->save();

        return response()->json(['data' => $this->format($cover)]);
    }

    /**
     * Actualiza solo el object_position sin re-subir la imagen.
     */
    public function updatePosition(Request $request, string $pageKey): JsonResponse
    {
        $cover = SitePageCover::where('page_key', $pageKey)->firstOrFail();

        $data = $request->validate([
            'object_position' => ['required', 'string', 'max:50'],
        ]);

        $cover->object_position = $data['object_position'];
        $cover->updated_by = optional($request->user())->id;
        $cover->save();

        return response()->json(['data' => $this->format($cover)]);
    }

    public function destroy(Request $request, string $pageKey): JsonResponse
    {
        $cover = SitePageCover::where('page_key', $pageKey)->firstOrFail();

        if ($cover->image_path) {
            foreach (array_keys(self::SIZES) as $suffix) {
                Storage::disk('public')->delete("{$cover->image_path}-{$suffix}.webp");
            }
        }

        $cover->image_path = null;
        $cover->updated_by = optional($request->user())->id;
        $cover->save();

        return response()->json(['data' => $this->format($cover)]);
    }

    private function format(SitePageCover $cover): array
    {
        return [
            'page_key' => $cover->page_key,
            'image_path' => $cover->image_path,
            'alt_text' => $cover->alt_text,
            'object_position' => $cover->object_position,
            'urls' => $cover->image_path ? [
                'large' => Storage::disk('public')->url("{$cover->image_path}-large.webp"),
                'medium' => Storage::disk('public')->url("{$cover->image_path}-medium.webp"),
                'small' => Storage::disk('public')->url("{$cover->image_path}-small.webp"),
            ] : null,
            'updated_at' => $cover->updated_at,
        ];
    }
}
