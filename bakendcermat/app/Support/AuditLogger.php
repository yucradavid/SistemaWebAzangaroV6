<?php

namespace App\Support;

use App\Models\AuditLog;

class AuditLogger
{
    public static function log(
        ?string $userId,
        string $action,
        string $entityType,
        string $entityId,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $reason = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'reason' => $reason,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'created_at' => now(),
        ]);
    }
}
