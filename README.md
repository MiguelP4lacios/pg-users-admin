# PostgreSQL User Manager

A CLI tool for managing users, roles and permissions in PostgreSQL databases.

## Features

- User management: list, create, update passwords and delete users
- Role management: list, create and delete roles
- User assignment to roles
- Permission management: grant read permissions, write permissions and revoke all permissions
- List permissions for a specific role

## Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file from the example `.env-example`:
   ```
   cp .env-example .env
   ```
4. Edit the `.env` file with your PostgreSQL connection data
5. Install the tool globally (optional):
   ```
   npm install -g .
   ```

### Uninstallation

If you've installed the tool globally and want to remove it:

```bash
npm uninstall -g pg-user-manager
```

## Usage

If you have installed the tool globally:

```bash
pg-user-manager <command>
```

Or you can run it locally:

```bash
npm start -- <command>
```

### Getting Help

For a complete list of all available commands and their descriptions:

```bash
pg-user-manager help
```

To get detailed help for a specific command:

```bash
pg-user-manager <command> --help
```

For example:

```bash
pg-user-manager grant-read-permissions --help
```

## Available Commands

### Users

- `list-users`: List all database users
- `create-user`: Create a new user
- `update-user-password`: Update a user's password
- `delete-user`: Delete a user

### Roles

- `list-roles`: List all roles
- `list-user-roles`: List all roles assigned to a specific user
- `create-role`: Create a new role
- `delete-role`: Delete a role
- `assign-user-to-role`: Assign a user to a role
- `remove-user-from-role`: Remove a user from a role

### Permissions

- `grant-read-permissions`: Grant read permissions to a role
- `grant-write-permissions`: Grant write permissions to a role
- `revoke-permissions`: Revoke all permissions from a role
- `list-permissions`: List permissions for a role

## Usage Examples

### Creating a read-only user

1. Create a new read-only role:
   ```
   pg-user-manager create-role
   # Enter "app_read_only" as the role name
   ```

2. Create a user:
   ```
   pg-user-manager create-user
   # Enter "readonly_user" and a secure password
   ```

3. Assign the user to the role:
   ```
   pg-user-manager assign-user-to-role
   # Select "readonly_user" and "app_read_only"
   ```

4. Grant read permissions:
   ```
   pg-user-manager grant-read-permissions
   # Select "app_read_only" and provide the database name
   ```

## License

ISC 