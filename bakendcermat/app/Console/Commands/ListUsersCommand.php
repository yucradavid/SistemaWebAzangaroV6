<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ListUsersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:list';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all registered users and their roles';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $users = User::with('profile')->get();

        if ($users->isEmpty()) {
            $this->info('No users found in the database.');
            return Command::SUCCESS;
        }

        $headers = ['Name', 'Email', 'Role', 'Status'];
        
        $data = $users->map(function ($user) {
            $profile = $user->profile;
            return [
                'Name' => $profile ? $profile->full_name : $user->name,
                'Email' => $user->email,
                'Role' => $profile ? $profile->role : 'N/A',
                'Status' => ($profile && $profile->is_active) ? 'Active' : 'Inactive',
            ];
        });

        $this->table($headers, $data);
        
        $this->info("Total users: {$users->count()}");
        
        return Command::SUCCESS;
    }
}
