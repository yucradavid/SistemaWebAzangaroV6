<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Profile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateUserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new user with a specific role';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('--- Setup New User ---');

        $name = $this->ask('Enter full name (e.g. Juan Perez)');
        $email = $this->ask('Enter email address');
        $password = $this->secret('Enter password (typing will be hidden)');
        
        $roles = ['admin', 'teacher', 'student', 'guardian', 'cashier', 'administrative'];
        $role = $this->choice('Select the user role', $roles, 0);

        try {
            // Check if user already exists
            if (User::where('email', $email)->exists()) {
                $this->error("A user with the email {$email} already exists.");
                return Command::FAILURE;
            }

            // Create User
            $user = User::create([
                'id' => Str::uuid(),
                'name' => explode(' ', $name)[0], // Just first name for the user table
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]);

            // Create Profile
            Profile::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'role' => $role,
                'full_name' => $name,
                'is_active' => true,
            ]);

            $this->info("User {$email} created successfully with role: {$role}!");
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Failed to create user: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
