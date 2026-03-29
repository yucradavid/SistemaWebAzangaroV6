<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (!Schema::hasColumn('payments', 'method')) {
                    $table->string('method')->nullable()->after('amount');
                }
                if (!Schema::hasColumn('payments', 'reference')) {
                    $table->string('reference')->nullable()->after('method');
                }
                if (!Schema::hasColumn('payments', 'paid_at')) {
                    $table->dateTime('paid_at')->nullable()->after('reference');
                }
                if (!Schema::hasColumn('payments', 'voided_at')) {
                    $table->dateTime('voided_at')->nullable()->after('notes');
                }
                if (!Schema::hasColumn('payments', 'voided_by')) {
                    $table->uuid('voided_by')->nullable()->after('voided_at');
                }
                if (!Schema::hasColumn('payments', 'void_reason')) {
                    $table->text('void_reason')->nullable()->after('voided_by');
                }
            });

            if (Schema::hasColumn('payments', 'payment_method')) {
                DB::table('payments')
                    ->whereNull('method')
                    ->update(['method' => DB::raw('payment_method')]);
            }

            if (Schema::hasColumn('payments', 'transaction_ref')) {
                DB::table('payments')
                    ->whereNull('reference')
                    ->update(['reference' => DB::raw('transaction_ref')]);
            }

            if (Schema::hasColumn('payments', 'payment_date')) {
                DB::table('payments')
                    ->whereNull('paid_at')
                    ->update(['paid_at' => DB::raw('payment_date')]);
            }
        }

        if (Schema::hasTable('receipts')) {
            Schema::table('receipts', function (Blueprint $table) {
                if (!Schema::hasColumn('receipts', 'number')) {
                    $table->string('number')->nullable()->after('student_id');
                }
                if (!Schema::hasColumn('receipts', 'issued_at')) {
                    $table->dateTime('issued_at')->nullable()->after('number');
                }
                if (!Schema::hasColumn('receipts', 'total')) {
                    $table->decimal('total', 12, 2)->nullable()->after('issued_at');
                }
            });

            if (Schema::hasColumn('receipts', 'receipt_number')) {
                DB::table('receipts')
                    ->whereNull('number')
                    ->update(['number' => DB::raw('receipt_number')]);
            }

            if (Schema::hasColumn('receipts', 'created_at')) {
                DB::table('receipts')
                    ->whereNull('issued_at')
                    ->update(['issued_at' => DB::raw('created_at')]);
            }

            if (Schema::hasColumn('receipts', 'total_amount')) {
                DB::table('receipts')
                    ->whereNull('total')
                    ->update(['total' => DB::raw('total_amount')]);
            }
        }

        if (Schema::hasTable('charges')) {
            Schema::table('charges', function (Blueprint $table) {
                if (!Schema::hasColumn('charges', 'notes')) {
                    $table->text('notes')->nullable()->after('due_date');
                }
                if (!Schema::hasColumn('charges', 'discount_amount')) {
                    $table->decimal('discount_amount', 12, 2)->default(0)->after('amount');
                }
                if (!Schema::hasColumn('charges', 'paid_amount')) {
                    $table->decimal('paid_amount', 12, 2)->default(0)->after('discount_amount');
                }
                if (!Schema::hasColumn('charges', 'voided_at')) {
                    $table->dateTime('voided_at')->nullable()->after('notes');
                }
                if (!Schema::hasColumn('charges', 'voided_by')) {
                    $table->uuid('voided_by')->nullable()->after('voided_at');
                }
                if (!Schema::hasColumn('charges', 'void_reason')) {
                    $table->text('void_reason')->nullable()->after('voided_by');
                }
            });

            if (Schema::hasColumn('charges', 'description')) {
                DB::table('charges')
                    ->whereNull('notes')
                    ->update(['notes' => DB::raw('description')]);
            }

            if (Schema::hasColumn('charges', 'discount')) {
                DB::table('charges')
                    ->where('discount_amount', 0)
                    ->update(['discount_amount' => DB::raw('discount')]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                foreach (['void_reason', 'voided_by', 'voided_at'] as $column) {
                    if (Schema::hasColumn('payments', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        if (Schema::hasTable('charges')) {
            Schema::table('charges', function (Blueprint $table) {
                foreach (['void_reason', 'voided_by', 'voided_at'] as $column) {
                    if (Schema::hasColumn('charges', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
