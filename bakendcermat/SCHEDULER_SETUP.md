# Programador de tareas (Scheduler) — Cierre automático de periodos

El sistema cierra automáticamente los trimestres vencidos y genera su snapshot
histórico mediante el comando:

```
php artisan periods:auto-close
```

Este comando está registrado en el scheduler de Laravel (ver `bootstrap/app.php`,
bloque `->withSchedule(...)`) para ejecutarse **todos los días a las 00:01**.

> El scheduler de Laravel **no corre solo**: necesita que el sistema operativo
> invoque `php artisan schedule:run` periódicamente (idealmente cada minuto).
> `schedule:run` revisa qué tareas tocan en ese momento y las ejecuta.

---

## Verificar la configuración

```bash
# Ver las tareas programadas y su próxima ejecución
php artisan schedule:list

# Ejecutar manualmente el comando (sin esperar al cron)
php artisan periods:auto-close

# Simular una corrida del scheduler (ejecuta lo que toque ahora)
php artisan schedule:run
```

El log de salida se guarda en: `storage/logs/auto-close-periods.log`

---

## Windows — Task Scheduler (Programador de tareas)

1. Abrir **Programador de tareas** (Task Scheduler).
2. **Crear tarea básica…**
   - Nombre: `CERMAT - Laravel Scheduler`
   - Desencadenador (Trigger): **Diariamente**, y luego en
     *Repetir cada* **1 hora** (o cada **5 minutos** si se desea mayor precisión)
     durante **1 día**.
   - Acción: **Iniciar un programa**
     - Programa/script: `php`
     - Argumentos: `artisan schedule:run`
     - Iniciar en (directorio de trabajo):
       `D:\UpeU-JULIACA\Practicas Pre-Profesionales\SistemaWebAzangaroV6\bakendcermat`
3. Marcar **Ejecutar tanto si el usuario inició sesión como si no**.
4. Guardar.

> Si `php` no está en el PATH del sistema, usar la ruta completa al ejecutable,
> por ejemplo: `C:\php\php.exe` en *Programa/script* y dejar
> `artisan schedule:run` en *Argumentos*.

Alternativa por línea de comandos (PowerShell como administrador):

```powershell
$action  = New-ScheduledTaskAction -Execute "php" -Argument "artisan schedule:run" -WorkingDirectory "D:\UpeU-JULIACA\Practicas Pre-Profesionales\SistemaWebAzangaroV6\bakendcermat"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName "CERMAT - Laravel Scheduler" -Action $action -Trigger $trigger -RunLevel Highest
```

---

## Linux / Mac — crontab

Editar el crontab del usuario:

```bash
crontab -e
```

Agregar esta línea (ejecuta el scheduler cada minuto):

```cron
* * * * * cd /ruta/al/proyecto/bakendcermat && php artisan schedule:run >> /dev/null 2>&1
```

---

## Resumen del flujo

```
Cron del SO (cada 1-5 min)
        │
        ▼
php artisan schedule:run
        │  (Laravel decide qué toca según la hora)
        ▼
00:01 → php artisan periods:auto-close
        │
        ├─ Busca periodos con end_date < hoy y is_closed = false
        ├─ Marca is_closed = true
        └─ Genera snapshot (AcademicPeriodHistoryService::generateForPeriod)
```
