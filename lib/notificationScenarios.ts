/**
 * Pre-made notification scenarios: one place that defines who is notified
 * for each event so everyone who needs to know gets it with minimal interactions.
 * Real-time: titles/bodies use payload data; rows are inserted per target role.
 *
 * Use buildNotificationRows() after a mutation; caller inserts into notifications.
 */

import type { UserRole } from '@/types';

export type NotificationScenarioId =
  | 'issue_raised'
  | 'issue_resolved'
  | 'trip_completed'
  | 'expense_added'
  | 'survey_submitted'
  | 'survey_approved'
  | 'report_generated'
  | 'user_created'
  | 'password_reset'
  | 'site_assignment'
  | 'driver_vehicle_assignment'
  | 'machine_session_completed'
  | 'task_completed'
  | 'vehicle_added';

export interface NotificationScenario {
  id: NotificationScenarioId;
  /** Roles that receive this notification (from profiles.role). */
  targetRoles: UserRole[];
  /** Link type for deep link / UI. */
  linkType: string;
  getTitle: (payload: Record<string, unknown>) => string;
  getBody: (payload: Record<string, unknown>) => string;
  linkIdKey?: string;
}

const scenarios: Record<NotificationScenarioId, NotificationScenario> = {
  issue_raised: {
    id: 'issue_raised',
    targetRoles: ['admin', 'owner', 'head_supervisor', 'assistant_supervisor'],
    linkType: 'issue',
    linkIdKey: 'id',
    getTitle: () => 'New issue reported',
    getBody: (p) => {
      const site = p.siteName ? `[${String(p.siteName)}] ` : '';
      const desc = typeof p.description === 'string' ? p.description.slice(0, 120) : 'No description';
      return site + desc;
    },
  },

  issue_resolved: {
    id: 'issue_resolved',
    targetRoles: ['admin', 'owner', 'head_supervisor', 'assistant_supervisor'],
    linkType: 'issue',
    linkIdKey: 'id',
    getTitle: () => 'Issue updated',
    getBody: (p) => {
      const site = p.siteName ? `[${String(p.siteName)}] ` : '';
      const status = p.status ? `Status: ${String(p.status)}.` : 'Updated.';
      const desc = typeof p.description === 'string' ? p.description.slice(0, 80) : '';
      return `${site}${status} ${desc}`.trim();
    },
  },

  trip_completed: {
    id: 'trip_completed',
    targetRoles: ['owner', 'head_supervisor', 'assistant_supervisor', 'accountant'],
    linkType: 'trip',
    linkIdKey: 'id',
    getTitle: () => 'Trip completed',
    getBody: (p) => {
      const site = p.siteName ? `[${p.siteName}] ` : '';
      const vehicle = p.vehicleNumberOrId ? ` ${String(p.vehicleNumberOrId)}` : '';
      const dist = p.distanceKm != null ? ` • ${p.distanceKm} km` : '';
      return `${site}${vehicle}${dist}`.trim() || 'Trip logged.';
    },
  },

  expense_added: {
    id: 'expense_added',
    targetRoles: ['owner', 'head_supervisor', 'assistant_supervisor', 'accountant'],
    linkType: 'expense',
    linkIdKey: 'id',
    getTitle: () => 'New expense',
    getBody: (p) => {
      const site = p.siteName ? `[${p.siteName}] ` : '';
      const amount = p.amountRwf != null ? `${Number(p.amountRwf).toLocaleString()} RWF` : '';
      const desc = typeof p.description === 'string' ? p.description.slice(0, 80) : '';
      return `${site}${amount} – ${desc}`.trim();
    },
  },

  survey_submitted: {
    id: 'survey_submitted',
    targetRoles: ['admin', 'owner', 'head_supervisor', 'assistant_supervisor'],
    linkType: 'survey',
    linkIdKey: 'id',
    getTitle: () => 'Survey submitted',
    getBody: (p) => {
      const site = p.siteName ? `[${p.siteName}]` : 'Survey';
      return `${site} – ready for review`;
    },
  },

  survey_approved: {
    id: 'survey_approved',
    targetRoles: ['surveyor', 'owner', 'head_supervisor', 'accountant'],
    linkType: 'survey',
    linkIdKey: 'id',
    getTitle: () => 'Survey approved',
    getBody: (p) => {
      const site = p.siteName ? `[${p.siteName}]` : 'Your survey';
      return `${site} has been approved`;
    },
  },

  report_generated: {
    id: 'report_generated',
    targetRoles: ['admin', 'owner', 'head_supervisor', 'accountant'],
    linkType: 'report',
    linkIdKey: 'id',
    getTitle: () => 'Report ready',
    getBody: (p) => {
      const title = p.title ? String(p.title) : 'Report';
      const period = p.period ? ` (${p.period})` : '';
      return `${title}${period}`;
    },
  },

  user_created: {
    id: 'user_created',
    targetRoles: ['admin', 'owner'],
    linkType: 'user',
    linkIdKey: 'user_id',
    getTitle: () => 'New user added',
    getBody: (p) => {
      const name = p.name ? String(p.name) : 'User';
      const role = p.role ? String(p.role) : '';
      return `${name}${role ? ` • ${role}` : ''}`;
    },
  },

  password_reset: {
    id: 'password_reset',
    targetRoles: [],
    linkType: 'settings',
    getTitle: () => 'Password reset',
    getBody: () => 'A new temporary password was set. Check with admin or email. Use it to sign in and change password.',
  },

  site_assignment: {
    id: 'site_assignment',
    targetRoles: ['owner', 'head_supervisor', 'assistant_supervisor'],
    linkType: 'site',
    linkIdKey: 'siteId',
    getTitle: () => 'Site assignment updated',
    getBody: (p) => {
      const site = p.siteName ? String(p.siteName) : 'A site';
      const role = p.role ? ` as ${String(p.role)}` : '';
      return `${site}${role}`;
    },
  },

  driver_vehicle_assignment: {
    id: 'driver_vehicle_assignment',
    targetRoles: ['owner', 'head_supervisor', 'assistant_supervisor', 'driver_truck', 'driver_machine'],
    linkType: 'site',
    linkIdKey: 'siteId',
    getTitle: () => 'Vehicle assignment updated',
    getBody: (p) => {
      const site = p.siteName ? `[${p.siteName}]` : 'Site';
      const vehicles = Array.isArray(p.vehicleIds) ? `${(p.vehicleIds as string[]).length} vehicle(s)` : 'vehicles';
      return `${site} – ${vehicles}`;
    },
  },

  machine_session_completed: {
    id: 'machine_session_completed',
    targetRoles: ['owner', 'head_supervisor', 'assistant_supervisor', 'accountant'],
    linkType: 'machine_session',
    linkIdKey: 'id',
    getTitle: () => 'Machine session completed',
    getBody: (p) => {
      const site = p.siteName ? `[${p.siteName}]` : 'Session';
      const hours = p.durationHours != null ? ` ${Number(p.durationHours)}h` : '';
      return `${site}${hours}`.trim();
    },
  },

  task_completed: {
    id: 'task_completed',
    targetRoles: ['owner', 'head_supervisor', 'assistant_supervisor'],
    linkType: 'task',
    linkIdKey: 'id',
    getTitle: () => 'Task completed',
    getBody: (p) => {
      const title = p.title ? String(p.title) : 'Task';
      const site = p.siteName ? ` [${p.siteName}]` : '';
      return `${title}${site}`;
    },
  },

  vehicle_added: {
    id: 'vehicle_added',
    targetRoles: ['owner', 'head_supervisor', 'assistant_supervisor'],
    linkType: 'vehicle',
    linkIdKey: 'id',
    getTitle: () => 'Vehicle added',
    getBody: (p) => {
      const vehicle = p.vehicleNumberOrId ? String(p.vehicleNumberOrId) : 'Vehicle';
      const type = p.type ? ` (${String(p.type)})` : '';
      const site = p.siteName ? ` at [${p.siteName}]` : '';
      return `${vehicle}${type}${site}`;
    },
  },
};

export function getScenario(id: NotificationScenarioId): NotificationScenario {
  const s = scenarios[id];
  if (!s) throw new Error(`Unknown notification scenario: ${id}`);
  return s;
}

export interface InsertNotificationRow {
  id: string;
  target_role: string;
  title: string;
  body: string;
  link_id?: string;
  link_type?: string;
}

/**
 * Build notification rows for a scenario. One row per target role.
 * Caller inserts into notifications (real-time + push via webhook).
 */
export function buildNotificationRows(
  scenarioId: NotificationScenarioId,
  payload: Record<string, unknown>,
  generateId: () => string
): InsertNotificationRow[] {
  const scenario = getScenario(scenarioId);
  if (scenario.targetRoles.length === 0) return [];

  const title = scenario.getTitle(payload);
  const body = scenario.getBody(payload);
  const linkId = scenario.linkIdKey && payload[scenario.linkIdKey] != null
    ? String(payload[scenario.linkIdKey])
    : undefined;

  return scenario.targetRoles.map((targetRole) => ({
    id: generateId(),
    target_role: targetRole,
    title,
    body,
    link_id: linkId,
    link_type: scenario.linkType,
  }));
}
