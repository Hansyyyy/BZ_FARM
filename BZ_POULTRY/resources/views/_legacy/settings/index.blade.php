@extends('layouts.app')
@section('title', 'Settings')
@section('page-title', 'Settings')
@section('page-description', 'Manage users and system settings')

@section('content')
<div class="grid-2">
    <div class="card">
        <div class="card-header">
            <h3>User Management</h3>
            <button class="btn btn-success btn-sm" onclick="openModal('addUserModal')"><i class="bi bi-plus-lg"></i> Add User</button>
        </div>
        <div class="card-body" style="padding:0">
            <table class="data-table">
                <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                <tbody>
                    @foreach($users as $user)
                    <tr>
                        <td>{{ $user->name }}</td>
                        <td>{{ $user->username }}</td>
                        <td>{{ $user->email }}</td>
                        <td><span class="status-badge status-active">{{ ucfirst($user->role) }}</span></td>
                        <td>
                            @if($user->id !== auth()->id())
                            <form action="{{ route('settings.users.destroy', $user) }}" method="POST" onsubmit="return confirm('Delete user?')">@csrf @method('DELETE')<button class="action-btn delete" type="submit"><i class="bi bi-trash"></i></button></form>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
    <div class="card">
        <div class="card-header"><h3>My Profile</h3></div>
        <form method="POST" action="{{ route('settings.profile') }}">@csrf @method('PUT')
            <div class="card-body">
                <div class="form-group"><label>Name</label><input name="name" class="form-control" value="{{ auth()->user()->name }}" required></div>
                <div class="form-group"><label>Email</label><input name="email" type="email" class="form-control" value="{{ auth()->user()->email }}" required></div>
                <div class="form-group"><label>Current Password</label><input name="current_password" type="password" class="form-control" placeholder="Required to change password"></div>
                <div class="form-group"><label>New Password</label><input name="password" type="password" class="form-control"></div>
                <div class="form-group"><label>Confirm Password</label><input name="password_confirmation" type="password" class="form-control"></div>
                <button type="submit" class="btn btn-primary">Update Profile</button>
            </div>
        </form>
    </div>
</div>

<div class="modal-overlay" id="addUserModal">
    <div class="modal">
        <div class="modal-header"><h3>Add New User</h3><button onclick="closeModal('addUserModal')" class="action-btn"><i class="bi bi-x-lg"></i></button></div>
        <form method="POST" action="{{ route('settings.users.store') }}">@csrf
            <div class="modal-body">
                <div class="form-group"><label>Name</label><input name="name" class="form-control" required></div>
                <div class="form-group"><label>Username</label><input name="username" class="form-control" required></div>
                <div class="form-group"><label>Email</label><input name="email" type="email" class="form-control" required></div>
                <div class="form-group"><label>Password</label><input name="password" type="password" class="form-control" required></div>
                <div class="form-group"><label>Role</label><select name="role" class="form-control"><option value="manager">Manager</option><option value="admin">Admin</option></select></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="closeModal('addUserModal')">Cancel</button><button type="submit" class="btn btn-success">Create User</button></div>
        </form>
    </div>
</div>
@endsection
