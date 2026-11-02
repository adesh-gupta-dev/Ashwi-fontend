import React from 'react';

const RoleSelector = ({ roles, activeRole, onRoleChange }) => {
  const topRoles = roles.slice(0, 4);
  const moreRoles = roles.slice(4);

  return (
    <div className="flex items-center gap-1 bg-[var(--color-surface-container-low)] p-1.5 rounded-2xl shadow-inner scrollbar-hide overflow-x-auto shrink-0">
      {topRoles.map((role) => (
        <button
          key={role.keyName}
          onClick={() => onRoleChange(role.keyName)}
          className={`px-6 py-2 rounded-xl text-sm transition-all whitespace-nowrap ${
            activeRole === role.keyName
              ? 'font-semibold bg-[var(--color-surface-container-highest)] text-[var(--color-primary)] shadow-sm ring-1 ring-black/5'
              : 'font-medium text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]/50'
          }`}
        >
          {role.label}
        </button>
      ))}

      {moreRoles.length > 0 && (
        <select
          value={moreRoles.some((r) => r.keyName === activeRole) ? activeRole : ''}
          onChange={(e) => onRoleChange(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        >
          <option value="" disabled>
            More roles
          </option>
          {moreRoles.map((role) => (
            <option key={role.keyName} value={role.keyName}>
              {role.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default RoleSelector;
