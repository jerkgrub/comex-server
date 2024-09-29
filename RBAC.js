class RoleBasedAccessControl {
    constructor() {
        this.roles = {
            admin: ['create', 'read', 'update', 'delete'],
            comexCoordinator: ['create', 'read', 'update'],
            faculty: ['create','read'],
            student: ['read'],
        };
    }

    hasPermission(role, action) {
        return (res, next) => {
            const permissions = this.roles[role];
            if (!permissions || !permissions.includes(action)) {
                return res.status(403).json({ message: 'Access denied' });
            }
            next();
        };
    }

    assignRole(email, role) {
        if (!this.roles[role]) {
            throw new Error('Invalid role');
        }

        return { email, role };
    }

    hasRole(requiredRole) {
        return (req, res, next) => {
            const userRole = req.user.role;
            if (userRole !== requiredRole) {
                return res.status(403).json({ message: 'Access denied' });
            }
            next();
        };
    }
}

module.exports = new RoleBasedAccessControl();
